import { Injectable } from '@nestjs/common';
import type { AiAssistantRequest, AiAssistantResponse } from '@wayra/types';
import { AiService } from './ai.service';
import { ConversationService } from './conversation.service';

interface ConversationContext {
  /** From the JWT subject if signed in. */
  userId?: string | null;
  /** Anonymous fallback (client-supplied cookie / device id). */
  clientId?: string | null;
}

/**
 * Persistent wrapper around AiService.
 *
 *   1. Looks up or creates a conversation for the requester.
 *   2. Prepends server-stored history so the model has memory across requests.
 *   3. Persists the user message + assistant reply.
 *
 * The wire format stays identical to AiService.respond — clients only need
 * to know about `ConversationContext` if they want explicit isolation.
 */
@Injectable()
export class ConversationalAiService {
  constructor(
    private readonly ai: AiService,
    private readonly convos: ConversationService,
  ) {}

  async respond(req: AiAssistantRequest, ctx: ConversationContext): Promise<AiAssistantResponse> {
    const conversation = await this.convos.findOrCreate(ctx);
    const history = await this.convos.getHistory(conversation.id);

    const enrichedReq: AiAssistantRequest = {
      ...req,
      history: [...history.map((m) => ({ role: m.role, content: m.content })), ...(req.history ?? [])],
    };

    const reply = await this.ai.respond(enrichedReq);

    await this.convos.append(conversation.id, 'user', req.message);
    await this.convos.append(conversation.id, 'assistant', reply.reply);
    return reply;
  }

  async *stream(req: AiAssistantRequest, ctx: ConversationContext): AsyncGenerator<string, void, void> {
    const conversation = await this.convos.findOrCreate(ctx);
    const history = await this.convos.getHistory(conversation.id);
    const enrichedReq: AiAssistantRequest = {
      ...req,
      history: [...history.map((m) => ({ role: m.role, content: m.content })), ...(req.history ?? [])],
    };

    await this.convos.append(conversation.id, 'user', req.message);
    const collected: string[] = [];
    for await (const chunk of this.ai.streamRespond(enrichedReq)) {
      collected.push(chunk);
      yield chunk;
    }
    await this.convos.append(conversation.id, 'assistant', collected.join(''));
  }
}
