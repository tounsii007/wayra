'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Train, TramFront, Bus, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { formatTime, formatDelayMinutes } from '@wayra/shared';
import type { Departure, Locale, TransitMode } from '@wayra/types';
import { useLiveDepartures } from '@/hooks/use-live-departures';
import { cn } from '@/lib/utils';

const MODE_ICON: Partial<Record<TransitMode, typeof Train>> = {
  rail: Train,
  subway: Train,
  tram: TramFront,
  bus: Bus,
  coach: Bus,
};

function statusFor(d: Departure): 'on_time' | 'delay' | 'severe' | 'cancelled' {
  if (d.cancelled) return 'cancelled';
  const s = d.delaySeconds ?? 0;
  if (s <= 60) return 'on_time';
  if (s <= 5 * 60) return 'delay';
  return 'severe';
}

/**
 * Real station-style departure board.  Dark ink background, amber mono
 * digits, line-color badges, status chips on the right.  Empty + loading
 * + error states all stay on-brand.
 */
export function DeparturesBoard({ stopId }: { stopId: string }) {
  const t = useTranslations('errors');
  const locale = useLocale() as Locale;
  const { departures, liveDataAvailable, loading, error } = useLiveDepartures(stopId);

  // Wrapper preserved across all states
  return (
    <div className="board-dark overflow-hidden">
      {/* Top status strip */}
      <div className="flex items-center justify-between gap-2 border-b border-white/5 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="live-pip text-emerald-400" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200/90">
            Live departures
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-200/40">
          {stopId.split(':').slice(-1)[0]?.toUpperCase()}
        </span>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid divide-y divide-white/5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 opacity-60">
              <div className="h-8 w-12 rounded-md bg-white/5" />
              <div className="h-3 flex-1 rounded-md bg-white/5" />
              <div className="h-5 w-12 rounded-md bg-white/5" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex items-center gap-3 px-4 py-6 text-sm text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && departures.length === 0 && (
        <div className="flex items-center gap-3 px-4 py-8 text-sm text-amber-200/60">
          <Clock className="h-5 w-5 shrink-0" />
          <p>No departures in the next window.</p>
        </div>
      )}

      {/* No-live banner */}
      {!loading && !error && departures.length > 0 && liveDataAvailable === false && (
        <div className="flex items-center gap-2 border-b border-white/5 bg-amber-500/10 px-4 py-2 text-[11px] font-semibold text-amber-300">
          <Loader2 className="h-3 w-3 animate-spin" />
          {t('noLive')}
        </div>
      )}

      {/* Departures list */}
      {!loading && !error && departures.length > 0 && (
        <ul className="divide-y divide-white/5">
          {departures.map((d, i) => {
            const status = statusFor(d);
            const Icon = MODE_ICON[d.line.mode] ?? Bus;
            const delayMin = d.delaySeconds ? formatDelayMinutes(d.delaySeconds) : '';
            const time = formatTime(d.predictedTime ?? d.scheduledTime, locale);
            return (
              <li
                key={`${d.tripId}-${d.scheduledTime}`}
                className="grid items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5"
                style={{
                  gridTemplateColumns: 'auto 1fr auto',
                  animationDelay: `${Math.min(i, 8) * 30}ms`,
                }}
              >
                {/* Line badge */}
                <span
                  className="inline-flex h-10 min-w-[3rem] items-center justify-center gap-1.5 rounded-md px-2 font-mono text-sm font-bold text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                  style={{ background: d.line.color ?? '#0d9488' }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {d.line.shortName}
                </span>

                {/* Destination + platform */}
                <div className="min-w-0">
                  <div className="font-display truncate text-sm font-bold text-amber-100">
                    {d.headsign}
                  </div>
                  <div className="flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-amber-200/50">
                    {d.platform && <span>Gleis {d.platform}</span>}
                    {d.platformChanged && (
                      <span className="rounded-sm bg-amber-500/30 px-1 py-0.5 text-amber-200">
                        changed
                      </span>
                    )}
                  </div>
                </div>

                {/* Time + delay */}
                <div className="text-right">
                  <div
                    className={cn(
                      'board-num text-xl font-bold tracking-tight text-amber-300',
                      status === 'cancelled' && 'text-rose-300 line-through',
                    )}
                    style={{
                      textShadow:
                        status === 'cancelled' ? 'none' : '0 0 12px rgba(251, 191, 36, 0.4)',
                    }}
                  >
                    {time}
                  </div>
                  {delayMin && (
                    <span
                      className={cn(
                        'mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold',
                        status === 'on_time' && 'bg-emerald-400/15 text-emerald-300',
                        status === 'delay' && 'bg-amber-400/20 text-amber-300',
                        status === 'severe' && 'bg-rose-500/20 text-rose-300',
                        status === 'cancelled' && 'bg-rose-500/30 text-rose-200',
                      )}
                    >
                      {delayMin}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
