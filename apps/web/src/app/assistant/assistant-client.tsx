'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Sparkles, Send, Bot, User as UserIcon } from 'lucide-react';
import type { AiChatMessage, Locale } from '@wayra/types';
import { cn } from '@/lib/utils';

export function AssistantClient() {
  const t = useTranslations('assistant');
  const locale = useLocale() as Locale;
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([
    { role: 'assistant', content: t('greeting') },
  ]);

  async function send(text: string) {
    const message = text.trim();
    if (!message) return;
    const next: AiChatMessage[] = [...messages, { role: 'user', content: message }];
    setMessages(next);
    setInput('');
    setBusy(true);

    // For MVP we stub a thoughtful local response. Production wires this to
    // POST /api/ai/travel-assistant which calls Claude with the GTFS schema as a tool.
    setTimeout(() => {
      setMessages([
        ...next,
        {
          role: 'assistant',
          content: localStub(message, locale),
        },
      ]);
      setBusy(false);
    }, 600);
  }

  const examples = t.raw('examples') as string[];

  return (
    <section className="surface rounded-3xl p-4 sm:p-6 min-h-[70vh] flex flex-col">
      <header className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-violet text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold">Wayra Assistant</div>
          <div className="text-xs text-subtle">Multilingual · context-aware · routes & disruptions</div>
        </div>
      </header>

      <ol className="my-6 flex-1 space-y-3 overflow-y-auto">
        {messages.map((m, i) => (
          <li
            key={i}
            className={cn(
              'flex gap-3 animate-fade-in',
              m.role === 'user' && 'flex-row-reverse',
            )}
          >
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                m.role === 'assistant'
                  ? 'bg-gradient-to-br from-brand-500 to-accent-violet text-white'
                  : 'surface text-muted',
              )}
            >
              {m.role === 'assistant' ? <Bot className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
            </div>
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                m.role === 'assistant'
                  ? 'surface-muted'
                  : 'bg-brand-500 text-white',
              )}
            >
              {m.content}
            </div>
          </li>
        ))}
        {busy && (
          <li className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-violet text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div className="surface-muted rounded-2xl px-4 py-3">
              <span className="inline-flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted" />
              </span>
            </div>
          </li>
        )}
      </ol>

      {messages.length <= 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => send(ex)}
              className="rounded-full surface-muted px-3 py-1.5 text-xs font-medium text-muted hover:text-[rgb(var(--text))] focus-ring"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="surface flex items-end gap-2 rounded-2xl p-2"
      >
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder={t('placeholder')}
          dir="auto"
          className="min-h-[40px] max-h-32 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-subtle"
        />
        <button
          type="submit"
          disabled={!input.trim() || busy}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white disabled:opacity-40 transition-opacity focus-ring"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}

/**
 * MVP stub. Replace with /api/ai/travel-assistant in production.
 */
function localStub(message: string, locale: Locale): string {
  const lower = message.toLowerCase();
  if (lower.includes('paris') && lower.includes('frankfurt')) {
    return locale === 'de'
      ? 'Von Frankfurt nach Paris empfehle ich den ICE über Saarbrücken — ca. 3 h 55 min, ab Frankfurt Hbf, keine Umstiege. Eine günstigere Verbindung mit IC + TGV liegt bei ca. 5 h.'
      : locale === 'fr'
        ? 'De Francfort à Paris : ICE direct via Sarrebruck en ~3 h 55, sans correspondance. Une option moins chère IC + TGV en ~5 h existe.'
        : 'Frankfurt → Paris: direct ICE via Saarbrücken in ~3 h 55, no transfers. A cheaper IC + TGV combo takes ~5 h.';
  }
  if (lower.includes('tunis') && lower.includes('sousse')) {
    return locale === 'fr'
      ? 'Tunis → Sousse en SNCFT : ~2 h 15 en train direct depuis Tunis Barcelone, plusieurs départs par jour. Tarif estimé : 8–14 TND.'
      : locale === 'ar'
        ? 'تونس → سوسة عبر SNCFT: نحو ساعتين و15 دقيقة بقطار مباشر من محطة برشلونة، عدّة رحلات يوميًا. السعر التقديري: 8–14 د.ت.'
        : 'Tunis → Sousse via SNCFT: ~2h 15 direct train from Tunis Barcelone, several departures daily. Estimated fare: 8–14 TND.';
  }
  return locale === 'de'
    ? 'Im MVP-Modus gebe ich kurze Demoantworten. Die Live-Variante nutzt Claude + GTFS-Daten und kann Routen erklären, Alternativen bei Verspätungen vorschlagen und mehrsprachig antworten.'
    : locale === 'fr'
      ? 'En mode MVP, je donne des réponses de démo. La version live utilise Claude + données GTFS pour expliquer les itinéraires et proposer des alternatives.'
      : locale === 'ar'
        ? 'في وضع MVP أقدّم إجابات تجريبية قصيرة. النسخة المباشرة تستخدم Claude مع بيانات GTFS لتوضيح المسارات واقتراح بدائل عند التأخير.'
        : 'In MVP mode I give short demo answers. The live version uses Claude with GTFS data to explain routes and propose alternatives on disruption.';
}
