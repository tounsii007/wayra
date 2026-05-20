'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Sparkles, Send, Bot, User as UserIcon, RotateCcw } from 'lucide-react';
import type { AiChatMessage, Locale } from '@wayra/types';
import { cn } from '@/lib/utils';

/**
 * AI Travel Assistant — a polished chat interface with the Wayra brand
 * palette: gradient avatar, paper-warm bubbles, mono timestamp, animated
 * thinking indicator, suggested-prompt chips that fade out once the user
 * starts a conversation.
 */
export function AssistantClient() {
  const t = useTranslations('assistant');
  const locale = useLocale() as Locale;
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([
    { role: 'assistant', content: t('greeting') },
  ]);
  const scrollerRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  async function send(text: string) {
    const message = text.trim();
    if (!message) return;
    const next: AiChatMessage[] = [...messages, { role: 'user', content: message }];
    setMessages(next);
    setInput('');
    setBusy(true);

    // MVP: local stub. Production: POST /api/ai/travel-assistant (streaming).
    setTimeout(() => {
      setMessages([
        ...next,
        {
          role: 'assistant',
          content: localStub(message, locale),
        },
      ]);
      setBusy(false);
    }, 650);
  }

  function reset() {
    setMessages([{ role: 'assistant', content: t('greeting') }]);
  }

  const examples = t.raw('examples') as string[];
  const showExamples = messages.length <= 1 && !busy;

  return (
    <section className="ticket flex min-h-[70vh] flex-col overflow-hidden">
      {/* Top accent bar */}
      <div className="from-brand-500 via-accent-500 to-brand-500 h-[3px] shrink-0 bg-gradient-to-r" />

      {/* Header */}
      <header className="flex items-center justify-between gap-3 border-b border-[rgb(var(--border))] p-4">
        <div className="flex items-center gap-3">
          <div className="from-brand-500 via-brand-700 to-accent-600 relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md">
            <Sparkles className="h-5 w-5" />
            <span className="bg-status-onTime absolute -bottom-0.5 -right-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full ring-2 ring-[rgb(var(--bg-elevated))]" />
          </div>
          <div>
            <div className="font-display text-base font-bold tracking-tight">Wayra Assistant</div>
            <div className="text-subtle font-mono text-[10px] uppercase tracking-[0.18em]">
              Multilingual · context-aware · GTFS
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={messages.length <= 1}
          aria-label="Reset conversation"
          className="focus-ring text-muted inline-flex h-9 items-center gap-1.5 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-xs font-semibold transition-colors hover:text-[rgb(var(--text))] disabled:opacity-40"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </header>

      {/* Messages */}
      <ol ref={scrollerRef} className="flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
        {messages.map((m, i) => (
          <li
            key={i}
            className={cn('animate-fade-in flex gap-3', m.role === 'user' && 'flex-row-reverse')}
          >
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl shadow-sm',
                m.role === 'assistant'
                  ? 'from-brand-500 via-brand-700 to-accent-600 bg-gradient-to-br text-white'
                  : 'text-muted border border-[rgb(var(--border))] bg-[rgb(var(--surface))]',
              )}
            >
              {m.role === 'assistant' ? (
                <Bot className="h-4 w-4" />
              ) : (
                <UserIcon className="h-4 w-4" />
              )}
            </div>
            <div
              className={cn(
                'max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                m.role === 'assistant'
                  ? 'border border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))]'
                  : 'from-brand-500 to-brand-700 bg-gradient-to-br text-white',
              )}
            >
              {m.content}
            </div>
          </li>
        ))}

        {busy && (
          <li className="animate-fade-in flex gap-3">
            <div className="from-brand-500 via-brand-700 to-accent-600 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))] px-4 py-3 shadow-sm">
              <span className="inline-flex items-center gap-1">
                <span className="bg-brand-500 h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]" />
                <span className="bg-brand-500 h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]" />
                <span className="bg-brand-500 h-2 w-2 animate-bounce rounded-full" />
                <span className="text-subtle ml-2 font-mono text-[10px] uppercase tracking-[0.16em]">
                  thinking
                </span>
              </span>
            </div>
          </li>
        )}
      </ol>

      {/* Suggested prompts */}
      {showExamples && (
        <div className="border-t border-[rgb(var(--border))] p-4">
          <div className="text-subtle mb-2 font-mono text-[10px] uppercase tracking-[0.18em]">
            Try
          </div>
          <div className="flex flex-wrap gap-1.5">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => send(ex)}
                className="chip-surface transition-all hover:-translate-y-0.5 hover:text-[rgb(var(--text))]"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-[rgb(var(--border))] p-3 sm:p-4"
      >
        <div className="focus-within:border-brand-500/60 flex items-end gap-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-1.5 focus-within:shadow-[0_0_0_4px_rgb(13_148_136_/_0.12)]">
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
            className="placeholder:text-subtle max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || busy}
            aria-label="Send"
            className="focus-ring from-brand-500 to-brand-700 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-subtle mt-2 px-1 font-mono text-[10px] uppercase tracking-[0.18em]">
          ⏎ to send · shift+⏎ for newline · responses may be inaccurate
        </p>
      </form>
    </section>
  );
}

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
