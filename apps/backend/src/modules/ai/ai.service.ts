import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import type {
  AiAssistantRequest,
  AiAssistantResponse,
  Locale,
} from '@wayra/types';
import { PlacesService } from '../places/places.service';
import { RoutesService } from '../routes/routes.service';
import { RealtimeService } from '../realtime/realtime.service';
import { SYSTEM_PROMPT, TOOLS } from './ai.prompts';

/**
 * Wayra travel assistant.
 *
 * Two modes:
 *  • PRODUCTION  — ANTHROPIC_API_KEY set. Forwards to Claude with a tool-use
 *    loop. Tools call into PlacesService / RoutesService / RealtimeService.
 *  • OFFLINE     — no key. Returns deterministic localized stubs.
 *
 * Wire format is identical, only `respond()` branches.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: Anthropic | null;
  private readonly model = 'claude-sonnet-4-6';

  constructor(
    config: ConfigService,
    private readonly places: PlacesService,
    private readonly routes: RoutesService,
    private readonly realtime: RealtimeService,
  ) {
    const apiKey = config.get<string>('ANTHROPIC_API_KEY');
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
    if (!this.client) {
      this.logger.warn('ANTHROPIC_API_KEY not set — AI assistant runs in offline stub mode.');
    }
  }

  async respond(req: AiAssistantRequest): Promise<AiAssistantResponse> {
    if (!this.client) return this.stubResponse(req);

    try {
      const messages = this.mapHistory(req);
      for (let iter = 0; iter < 4; iter++) {
        const completion = await this.client.messages.create({
          model: this.model,
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          tools: TOOLS,
          messages,
        });

        const toolUses = completion.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
        );

        if (toolUses.length === 0) {
          const text = completion.content
            .filter((b): b is Anthropic.TextBlock => b.type === 'text')
            .map((b) => b.text)
            .join('\n')
            .trim();
          return { reply: text || this.stubResponse(req).reply };
        }

        messages.push({ role: 'assistant', content: completion.content });
        const results: Anthropic.ToolResultBlockParam[] = await Promise.all(
          toolUses.map(async (tu) => {
            const data = await this.runTool(tu.name, tu.input as Record<string, unknown>);
            return {
              type: 'tool_result',
              tool_use_id: tu.id,
              content: JSON.stringify(data).slice(0, 8000),
            };
          }),
        );
        messages.push({ role: 'user', content: results });
      }

      this.logger.warn('AI tool-use loop exhausted; returning fallback message.');
      return this.stubResponse(req);
    } catch (e) {
      this.logger.error(`Claude call failed: ${(e as Error).message}`);
      return {
        reply:
          req.locale === 'de'
            ? 'Der KI-Dienst ist aktuell nicht erreichbar. Bitte später erneut versuchen.'
            : 'AI service is temporarily unavailable. Please try again shortly.',
      };
    }
  }

  explainDelay(body: { tripId: string; delaySeconds: number; locale?: string }) {
    const mins = Math.round((body.delaySeconds ?? 0) / 60);
    const locale = (body.locale as Locale) ?? 'en';
    if (locale === 'de') return { reply: `Aktuell ca. ${mins} Min. Verspätung.` };
    if (locale === 'fr') return { reply: `Retard estimé : ${mins} min.` };
    return { reply: `Currently delayed by ~${mins} min.` };
  }

  routeSummary(body: { routeId: string; locale?: string }) {
    return {
      reply: `Summary for route ${body.routeId} — see /routes/${body.routeId} for full leg breakdown.`,
    };
  }

  // --- internals ---

  /**
   * Convert the client's chat transcript into Anthropic Messages. We:
   *  - drop any client-side `system` messages (system goes via the
   *    top-level system prompt only)
   *  - merge consecutive same-role turns so the API doesn't reject us
   *  - cap history at the most recent 12 turns to control token cost
   *  - prefix the latest user turn with locale + country + now context
   */
  private mapHistory(req: AiAssistantRequest): Anthropic.MessageParam[] {
    const history = (req.history ?? []).filter((m) => m.role !== 'system');
    const tail = history.slice(-12);
    const merged: Anthropic.MessageParam[] = [];
    for (const m of tail) {
      const last = merged[merged.length - 1];
      if (last && last.role === m.role && typeof last.content === 'string') {
        last.content = `${last.content}\n\n${m.content}`;
      } else {
        merged.push({ role: m.role, content: m.content });
      }
    }
    const ctx =
      `User locale: ${req.locale}` +
      (req.context?.countryCode ? `, country: ${req.context.countryCode}` : '') +
      (req.context?.nowISO ? `, now: ${req.context.nowISO}` : '');
    const final: Anthropic.MessageParam = { role: 'user', content: `${ctx}\n\n${req.message}` };
    // If the previous turn is already a user turn, merge to keep alternation.
    const last = merged[merged.length - 1];
    if (last && last.role === 'user' && typeof last.content === 'string') {
      last.content = `${last.content}\n\n${final.content as string}`;
    } else {
      merged.push(final);
    }
    return merged;
  }

  /**
   * Server-Sent Events streaming variant. Iterator yields plain-text
   * deltas so controllers can pipe directly to the response.
   */
  async *streamRespond(req: AiAssistantRequest): AsyncGenerator<string, void, void> {
    if (!this.client) {
      yield this.stubResponse(req).reply;
      return;
    }
    const messages = this.mapHistory(req);
    try {
      const stream = await this.client.messages.stream({
        model: this.model,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      });
      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta' &&
          event.delta.text
        ) {
          yield event.delta.text;
        }
      }
    } catch (e) {
      this.logger.error(`Streaming failed: ${(e as Error).message}`);
      yield `⚠️ Assistant error: ${(e as Error).message}`;
    }
  }

  private async runTool(name: string, input: Record<string, unknown>): Promise<unknown> {
    switch (name) {
      case 'find_place': {
        const q = String(input.query ?? '');
        const country = input.countryCode ? [String(input.countryCode)] : undefined;
        const { suggestions } = await this.places.autocomplete(q, {
          limit: 5,
          countryCodes: country,
        });
        return {
          suggestions: suggestions.slice(0, 5).map((s) => ({ ...s.place, score: s.score })),
        };
      }
      case 'plan_route': {
        const result = await this.routes.plan({
          from: { placeId: String(input.fromPlaceId) },
          to: { placeId: String(input.toPlaceId) },
          departAt: input.departAt ? String(input.departAt) : undefined,
          arriveBy: input.arriveBy ? String(input.arriveBy) : undefined,
          wheelchair: Boolean(input.wheelchair),
          stroller: Boolean(input.stroller),
          preferences: (input.preferences as never) ?? undefined,
        });
        return {
          routes: result.routes.slice(0, 3).map((r) => ({
            id: r.id,
            departureTime: r.departureTime,
            arrivalTime: r.arrivalTime,
            durationSeconds: r.durationSeconds,
            transfers: r.transfers,
            walkingMeters: r.walkingMeters,
            fare: r.fare,
            tags: r.tags,
            legs: r.legs.map((l) => ({
              kind: l.mode.kind,
              ...(l.mode.kind === 'transit' && {
                line: l.mode.line.shortName,
                mode: l.mode.mode,
              }),
              from: l.from.name,
              to: l.to.name,
              departureTime: l.departureTime,
              arrivalTime: l.arrivalTime,
              delaySeconds: l.delaySeconds ?? 0,
            })),
          })),
          notice: result.notice,
        };
      }
      case 'get_departures': {
        return this.realtime.departures(String(input.stopId), Number(input.limit ?? 8), 90);
      }
      case 'get_disruptions': {
        return this.realtime.disruptions(
          input.countryCode ? String(input.countryCode) : undefined,
        );
      }
      default:
        return { error: 'unknown_tool' };
    }
  }

  private stubResponse(req: AiAssistantRequest): AiAssistantResponse {
    const m = req.message.toLowerCase();
    const locale = req.locale ?? 'en';
    if (m.includes('paris') && m.includes('frankfurt')) {
      return {
        reply:
          locale === 'de'
            ? 'Frankfurt → Paris: ICE direkt via Saarbrücken, ca. 3 h 55 min, keine Umstiege.'
            : locale === 'fr'
              ? 'Francfort → Paris : ICE direct via Sarrebruck, ~3 h 55, sans correspondance.'
              : 'Frankfurt → Paris: direct ICE via Saarbrücken, ~3h 55, no transfers.',
        suggestions: ['Find the cheapest connection', 'Show disruptions today'],
      };
    }
    if (m.includes('tunis') && m.includes('sousse')) {
      return {
        reply:
          locale === 'ar'
            ? 'تونس → سوسة (SNCFT): نحو ساعتين و15 دقيقة، عدة رحلات يوميًا.'
            : 'Tunis → Sousse (SNCFT): ~2h 15, several daily departures.',
      };
    }
    return {
      reply:
        locale === 'de'
          ? 'Stub-Modus (kein ANTHROPIC_API_KEY). Mit Key nutze ich Claude + GTFS-Tools.'
          : locale === 'fr'
            ? 'Mode démo (sans ANTHROPIC_API_KEY). Avec une clé, j’utilise Claude + outils GTFS.'
            : 'Stub mode (no ANTHROPIC_API_KEY). With a key, I use Claude + GTFS tools.',
      suggestions: [
        'Plan a trip from Berlin to Munich tomorrow',
        'Show live status for Frankfurt',
        'Compare fares Tunis–Sousse',
      ],
    };
  }
}
