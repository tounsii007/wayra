'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Activity, AlertTriangle, CheckCircle2, RadioTower } from 'lucide-react';
import { DemoBadge } from './demo-badge';
import { cn } from '@/lib/utils';

interface StatusItem {
  city: string;
  country: 'DE' | 'FR' | 'TN';
  status: 'ok' | 'minor' | 'major';
  note: string;
  locale: string;
}

const tone: Record<
  StatusItem['status'],
  { ring: string; text: string; bg: string; icon: typeof CheckCircle2 }
> = {
  ok: {
    ring: 'ring-status-onTime/30',
    text: 'text-status-onTime',
    bg: 'bg-status-onTime',
    icon: CheckCircle2,
  },
  minor: {
    ring: 'ring-status-delay/30',
    text: 'text-status-delay',
    bg: 'bg-status-delay',
    icon: AlertTriangle,
  },
  major: {
    ring: 'ring-status-severe/30',
    text: 'text-status-severe',
    bg: 'bg-status-severe',
    icon: AlertTriangle,
  },
};

const FALLBACK: StatusItem[] = [
  { city: 'Berlin', country: 'DE', status: 'ok', note: 'S-Bahn pünktlich', locale: 'de' },
  { city: 'Paris', country: 'FR', status: 'minor', note: 'Ligne 4 — perturbations', locale: 'fr' },
  { city: 'Tunis', country: 'TN', status: 'minor', note: 'Métro 1 ralentie', locale: 'fr' },
];

/**
 * Live network status — styled as a "departure board" with mono-numeric
 * typography, amber-on-ink color palette, and a scrolling marquee ticker
 * at the bottom for that classic transit-station vibe.
 */
export function LiveStatusBanner() {
  const t = useTranslations('home.sections');
  const [items, setItems] = useState<StatusItem[]>([]);
  const [usedFallback, setUsedFallback] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${base}/api/realtime/network-status`, { signal: ctrl.signal });
        const json = (await res.json()) as {
          data?: { items: StatusItem[]; generatedAt: string };
          error?: { message: string };
        };
        if (json.error) throw new Error(json.error.message);
        setItems(json.data?.items ?? []);
        setGeneratedAt(json.data?.generatedAt ?? null);
        setUsedFallback(false);
      } catch {
        setItems(FALLBACK);
        setUsedFallback(true);
      }
    })();
    return () => ctrl.abort();
  }, []);

  const display = items.length > 0 ? items.slice(0, 6) : FALLBACK;

  return (
    <section aria-labelledby="live-status-title">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="chip-brand">
            <RadioTower className="h-3 w-3" />
            Realtime
          </span>
          <h2
            id="live-status-title"
            className="font-display text-display-sm tracking-tightest display-tight mt-3 inline-flex items-center gap-2 font-bold"
          >
            <Activity className="text-status-onTime h-6 w-6" />
            {t('liveStatus')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <DemoBadge />
          {generatedAt && (
            <span className="text-subtle font-mono text-[11px] uppercase tracking-[0.16em]">
              ·{' '}
              {new Date(generatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          {usedFallback && <span className="chip-amber text-[10px]">offline preview</span>}
        </div>
      </header>

      {/* Departure-board style grid */}
      <div className="board-dark relative overflow-hidden p-1 sm:p-2">
        <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {display.map((it, i) => {
            const Icon = tone[it.status].icon;
            return (
              <li
                key={`${it.country}-${it.city}`}
                className="group relative flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-white/5"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Pulsing status dot */}
                <span
                  className={cn(
                    'relative inline-flex h-2.5 w-2.5 shrink-0 rounded-full ring-4',
                    tone[it.status].bg,
                    tone[it.status].ring,
                  )}
                >
                  {it.status === 'ok' && (
                    <span className="bg-status-onTime/40 absolute inset-0 animate-ping rounded-full" />
                  )}
                </span>

                <Icon className={cn('h-4 w-4 shrink-0', tone[it.status].text)} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display truncate text-sm font-bold text-amber-100">
                      {it.city}
                    </span>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300/70">
                      {it.country}
                    </span>
                  </div>
                  <div className="truncate text-xs text-amber-200/60">{it.note}</div>
                </div>

                {/* Faux frequency bars */}
                <div className="hidden h-4 items-end gap-px sm:flex" aria-hidden>
                  {[3, 5, 7, 4, 6].map((h, j) => (
                    <span
                      key={j}
                      className={cn(
                        'w-0.5 rounded-sm bg-amber-300/40',
                        it.status === 'ok' && 'bg-emerald-400/40',
                        it.status === 'major' && 'bg-rose-400/50',
                      )}
                      style={{ height: `${h * 2}px` }}
                    />
                  ))}
                </div>
              </li>
            );
          })}
        </ul>

        {/* Bottom scrolling ticker */}
        <div className="mt-1 flex items-center gap-3 border-t border-white/5 px-3 py-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/80">
            Ticker
          </span>
          <div className="mask-fade-r relative flex-1 overflow-hidden">
            <div className="animate-marquee flex w-max gap-8 whitespace-nowrap font-mono text-[11px] text-amber-200/60">
              {[
                '• Berlin ICE 597 — on time',
                '• Paris RER B — 4 min delay',
                '• Tunis TGM — normal service',
                '• Milano Centrale → Roma — boarding',
                '• München Hbf → Salzburg — on time',
                '• Casablanca Voyageurs — normal',
                '• Madrid Atocha → Sevilla — boarding',
              ]
                .concat([
                  '• Berlin ICE 597 — on time',
                  '• Paris RER B — 4 min delay',
                  '• Tunis TGM — normal service',
                  '• Milano Centrale → Roma — boarding',
                  '• München Hbf → Salzburg — on time',
                  '• Casablanca Voyageurs — normal',
                  '• Madrid Atocha → Sevilla — boarding',
                ])
                .map((line, idx) => (
                  <span key={idx}>{line}</span>
                ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
