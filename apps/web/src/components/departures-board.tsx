'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Train, TramFront, Bus, Plane, AlertCircle, Clock, Loader2 } from 'lucide-react';
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

const STATUS_CLASS: Record<ReturnType<typeof statusFor>, string> = {
  on_time: 'bg-status-onTime/15 text-status-onTime',
  delay: 'bg-status-delay/15 text-status-delay',
  severe: 'bg-status-severe/15 text-status-severe',
  cancelled: 'bg-status-cancelled/15 text-status-cancelled line-through',
};

export function DeparturesBoard({ stopId }: { stopId: string }) {
  const t = useTranslations('errors');
  const locale = useLocale() as Locale;
  const { departures, liveDataAvailable, loading, error } = useLiveDepartures(stopId);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-14 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface text-status-severe rounded-2xl p-4 text-sm">
        <AlertCircle className="mr-2 inline h-4 w-4" />
        {error}
      </div>
    );
  }

  if (departures.length === 0) {
    return (
      <div className="surface text-muted rounded-2xl p-6 text-sm">
        <Clock className="mr-2 inline h-4 w-4" />
        No departures in the next window.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {liveDataAvailable === false && (
        <div className="surface-muted text-muted inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t('noLive')}
        </div>
      )}

      <ul className="surface divide-y divide-[rgb(var(--border))] overflow-hidden rounded-2xl">
        {departures.map((d) => {
          const status = statusFor(d);
          const Icon = MODE_ICON[d.line.mode] ?? Bus;
          const delayMin = d.delaySeconds ? formatDelayMinutes(d.delaySeconds) : '';
          return (
            <li
              key={`${d.tripId}-${d.scheduledTime}`}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ background: d.line.color ?? '#2563eb' }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{d.line.shortName}</span>
                  <span className="text-muted truncate text-sm">→ {d.headsign}</span>
                </div>
                <div className="text-subtle flex items-baseline gap-2 text-xs">
                  {d.platform && <span>Gleis {d.platform}</span>}
                  {d.platformChanged && (
                    <span className="bg-status-delay/20 text-status-delay rounded-full px-1.5 py-0.5 font-semibold">
                      changed
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={cn(
                    'text-base font-bold tabular-nums',
                    status === 'cancelled' && 'line-through',
                  )}
                >
                  {formatTime(d.predictedTime ?? d.scheduledTime, locale)}
                </div>
                {delayMin && (
                  <span
                    className={cn(
                      'inline-block rounded-full px-2 py-0.5 text-xs font-bold',
                      STATUS_CLASS[status],
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
    </div>
  );
}
