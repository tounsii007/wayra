'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowRight,
  Clock,
  Footprints,
  Train,
  Leaf,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { formatDuration, formatTime, formatFare, formatCO2 } from '@wayra/shared';
import type { Locale, Route } from '@wayra/types';
import { mockRouteResults } from '@/data/mock-routes';
import { sampleSuggestions } from '@/data/sample-suggestions';
import { cn } from '@/lib/utils';

type Preference = 'fastest' | 'cheapest' | 'fewest_transfers' | 'accessible' | 'least_walking';

export function PlanClient() {
  const sp = useSearchParams();
  const tHero = useTranslations('home.hero');
  const tRoute = useTranslations('route');
  const tErr = useTranslations('errors');
  const locale = useLocale() as Locale;

  const fromId = sp.get('from');
  const toId = sp.get('to');
  const from = sampleSuggestions.find((p) => p.id === fromId);
  const to = sampleSuggestions.find((p) => p.id === toId);

  const [pref, setPref] = useState<Preference>('fastest');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      setRoutes(mockRouteResults);
      setLoading(false);
    }, 350);
    return () => clearTimeout(t);
  }, [fromId, toId, pref]);

  const sorted = [...routes].sort((a, b) => {
    if (pref === 'cheapest') return (a.fare?.amount ?? 9e9) - (b.fare?.amount ?? 9e9);
    if (pref === 'fewest_transfers') return a.transfers - b.transfers;
    if (pref === 'least_walking') return a.walkingMeters - b.walkingMeters;
    return a.durationSeconds - b.durationSeconds;
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      {/* Summary card */}
      <aside className="surface sticky top-20 h-fit rounded-2xl p-5">
        <div className="text-sm text-muted">{tHero('title')}</div>
        <div className="mt-2 flex items-start gap-2">
          <div className="flex flex-col items-center pt-1">
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            <span className="my-1 h-8 w-px bg-[rgb(var(--border))]" />
            <span className="h-2 w-2 rounded-full bg-accent-violet" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <div className="text-xs text-subtle">{tRoute('departure')}</div>
              <div className="truncate text-sm font-semibold">{from?.name ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs text-subtle">{tRoute('arrival')}</div>
              <div className="truncate text-sm font-semibold">{to?.name ?? '—'}</div>
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-[rgb(var(--border))] pt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">
            {tRoute('duration')} · sort
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(['fastest', 'cheapest', 'fewest_transfers', 'least_walking', 'accessible'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPref(p)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-ring',
                  pref === p
                    ? 'bg-brand-500 text-white'
                    : 'border border-[rgb(var(--border))] text-muted hover:text-[rgb(var(--text))]',
                )}
              >
                {tRoute(`preferences.${p}`)}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section>
        {!from || !to ? (
          <EmptyState message={tErr('noRoute')} />
        ) : loading ? (
          <RouteListSkeleton />
        ) : sorted.length === 0 ? (
          <EmptyState message={tErr('noRoute')} />
        ) : (
          <ul className="space-y-3">
            {sorted.map((r) => (
              <li key={r.id}>
                <a href={`/trips/${encodeURIComponent(r.id)}`} className="block focus-ring rounded-2xl">
                  <RouteCard route={r} locale={locale} />
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function RouteCard({ route, locale }: { route: Route; locale: Locale }) {
  const tRoute = useTranslations('route');
  const delay = route.legs.reduce((s, l) => s + (l.delaySeconds ?? 0), 0);
  const delayMin = Math.round(delay / 60);

  return (
    <article className="surface group relative overflow-hidden rounded-2xl p-5 transition-shadow hover:shadow-card">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <div className="text-2xl font-bold tabular-nums">
            {formatTime(route.departureTime, locale)}
            <ArrowRight className="mx-2 inline h-4 w-4 text-muted" />
            {formatTime(route.arrivalTime, locale)}
          </div>
          {delayMin > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-status-delay/15 px-2 py-0.5 text-xs font-semibold text-status-delay">
              +{delayMin} min
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span className="inline-flex items-center gap-1 text-muted">
            <Clock className="h-4 w-4" />
            {formatDuration(route.durationSeconds, locale)}
          </span>
          {route.fare && (
            <span className="rounded-full bg-brand-500/10 px-3 py-1 text-brand-700 dark:text-brand-300">
              {formatFare(route.fare.amount, route.fare.currency, locale)}
            </span>
          )}
        </div>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {route.legs.map((leg, i) => {
          if (leg.mode.kind === 'walk') {
            return (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full surface-muted px-2 py-1 text-xs font-medium text-muted"
              >
                <Footprints className="h-3.5 w-3.5" />
                {Math.round(leg.distanceMeters)} m
              </span>
            );
          }
          if (leg.mode.kind === 'transit') {
            return (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-white"
                style={{ background: leg.mode.line.color ?? '#2563eb' }}
              >
                <Train className="h-3.5 w-3.5" />
                {leg.mode.line.shortName}
              </span>
            );
          }
          return null;
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
        <span>
          {route.transfers === 0 ? tRoute('noTransfer') : `${route.transfers} ${tRoute('transfers')}`}
        </span>
        <span>·</span>
        <span className="inline-flex items-center gap-1">
          <Footprints className="h-3.5 w-3.5" />
          {Math.round(route.walkingMeters)} m
        </span>
        {route.co2SavedGrams !== undefined && (
          <>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-status-onTime">
              <Leaf className="h-3.5 w-3.5" />
              {tRoute('co2Saved', { value: formatCO2(route.co2SavedGrams, locale) })}
            </span>
          </>
        )}
        {route.tags?.includes('recommended') && (
          <>
            <span>·</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/15 px-2 py-0.5 font-semibold text-brand-700 dark:text-brand-300">
              <Sparkles className="h-3 w-3" /> recommended
            </span>
          </>
        )}
      </div>
    </article>
  );
}

function RouteListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton h-32 w-full rounded-2xl" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="surface flex flex-col items-center rounded-2xl px-6 py-16 text-center">
      <AlertTriangle className="h-10 w-10 text-status-delay" />
      <p className="mt-3 max-w-sm text-sm text-muted">{message}</p>
    </div>
  );
}
