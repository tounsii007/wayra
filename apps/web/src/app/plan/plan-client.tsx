'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  Footprints,
  Train,
  Leaf,
  AlertTriangle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { formatDuration, formatTime, formatFare, formatCO2 } from '@wayra/shared';
import type { Locale, Route, PlanRouteRequest, PlanRouteResponse } from '@wayra/types';
import { mockRouteResults } from '@/data/mock-routes';
import { sampleSuggestions } from '@/data/sample-suggestions';
import { DemoBadge } from '@/components/demo-badge';
import { cn } from '@/lib/utils';

type Preference = 'fastest' | 'cheapest' | 'fewest_transfers' | 'least_walking' | 'accessible';

export function PlanClient() {
  const sp = useSearchParams();
  const tHero = useTranslations('home.hero');
  const tRoute = useTranslations('route');
  const tErr = useTranslations('errors');
  const locale = useLocale() as Locale;

  const fromId = sp.get('from');
  const toId = sp.get('to');
  const departAt = sp.get('departAt') ?? undefined;
  const arriveBy = sp.get('arriveBy') ?? undefined;

  const from = sampleSuggestions.find((p) => p.id === fromId);
  const to = sampleSuggestions.find((p) => p.id === toId);

  const [pref, setPref] = useState<Preference>('fastest');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [usedFallback, setUsedFallback] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!fromId || !toId) {
      setLoading(false);
      return;
    }
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const ctrl = new AbortController();
    setLoading(true);
    setNotice(null);

    (async () => {
      const body: PlanRouteRequest = {
        from: { placeId: fromId },
        to: { placeId: toId },
        ...(departAt ? { departAt } : {}),
        ...(arriveBy ? { arriveBy } : {}),
        preferences: [pref === 'accessible' ? 'accessible' : pref],
        ...(pref === 'accessible' ? { wheelchair: true } : {}),
      };
      try {
        const res = await fetch(`${base}/api/routes/plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
        const payload = (await res.json()) as {
          data?: PlanRouteResponse;
          error?: { message: string };
        };
        if (payload.error) throw new Error(payload.error.message);
        const result = payload.data ?? { routes: [] };
        setRoutes(result.routes);
        setNotice(result.notice ?? null);
        setUsedFallback(false);
      } catch {
        setRoutes(mockRouteResults);
        setUsedFallback(true);
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [fromId, toId, departAt, arriveBy, pref]);

  const sorted = [...routes];
  if (pref === 'cheapest') sorted.sort((a, b) => (a.fare?.amount ?? 9e9) - (b.fare?.amount ?? 9e9));
  else if (pref === 'fewest_transfers') sorted.sort((a, b) => a.transfers - b.transfers);
  else if (pref === 'least_walking') sorted.sort((a, b) => a.walkingMeters - b.walkingMeters);
  else sorted.sort((a, b) => a.durationSeconds - b.durationSeconds);

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <aside className="surface sticky top-20 h-fit rounded-2xl p-5">
        <div className="text-muted text-sm">{tHero('title')}</div>
        <div className="mt-2 flex items-start gap-2">
          <div className="flex flex-col items-center pt-1">
            <span className="bg-brand-500 h-2 w-2 rounded-full" />
            <span className="my-1 h-8 w-px bg-[rgb(var(--border))]" />
            <span className="bg-accent-violet h-2 w-2 rounded-full" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <div className="text-subtle text-xs">{tRoute('departure')}</div>
              <div className="truncate text-sm font-semibold">{from?.name ?? '—'}</div>
            </div>
            <div>
              <div className="text-subtle text-xs">{tRoute('arrival')}</div>
              <div className="truncate text-sm font-semibold">{to?.name ?? '—'}</div>
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-[rgb(var(--border))] pt-4">
          <div className="text-subtle mb-2 text-xs font-semibold uppercase tracking-wide">
            Sort by
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              ['fastest', 'cheapest', 'fewest_transfers', 'least_walking', 'accessible'] as const
            ).map((p) => (
              <button
                key={p}
                onClick={() => setPref(p)}
                className={cn(
                  'focus-ring rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  pref === p
                    ? 'bg-brand-500 text-white'
                    : 'text-muted border border-[rgb(var(--border))] hover:text-[rgb(var(--text))]',
                )}
              >
                {tRoute(`preferences.${p}`)}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section>
        {usedFallback && (
          <div className="surface-muted text-muted mb-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Backend unreachable — showing offline preview.
          </div>
        )}
        {notice && (
          <div className="bg-status-delay/10 text-status-delay mb-3 rounded-xl px-3 py-2 text-xs">
            {notice}
          </div>
        )}
        {!from || !to ? (
          <EmptyState message={tErr('noRoute')} />
        ) : loading ? (
          <RouteListSkeleton />
        ) : sorted.length === 0 ? (
          <EmptyState message={tErr('noRoute')} />
        ) : (
          <>
            <div className="mb-2 flex items-center gap-2">
              <DemoBadge label="Estimated" />
              <span className="text-subtle text-xs">
                Synthesised from distance + per-km energy mix; production uses OpenTripPlanner over
                GTFS.
              </span>
            </div>
            <ul className="space-y-3">
              {sorted.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/trips/${encodeURIComponent(r.id)}`}
                    className="focus-ring block rounded-2xl"
                  >
                    <RouteCard route={r} locale={locale} />
                  </Link>
                </li>
              ))}
            </ul>
          </>
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
    <article className="surface hover:shadow-card group relative overflow-hidden rounded-2xl p-5 transition-shadow">
      <div className="via-brand-500/40 absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent" />
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <div className="text-2xl font-bold tabular-nums">
            {formatTime(route.departureTime, locale)}
            <ArrowRight className="text-muted mx-2 inline h-4 w-4" />
            {formatTime(route.arrivalTime, locale)}
          </div>
          {delayMin > 0 && (
            <span className="bg-status-delay/15 text-status-delay inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold">
              +{delayMin} min
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span className="text-muted inline-flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatDuration(route.durationSeconds, locale)}
          </span>
          {route.fare && (
            <span className="bg-brand-500/10 text-brand-700 dark:text-brand-300 rounded-full px-3 py-1">
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
                className="surface-muted text-muted inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
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

      <div className="text-muted mt-4 flex flex-wrap items-center gap-3 text-xs">
        <span>
          {route.transfers === 0
            ? tRoute('noTransfer')
            : `${route.transfers} ${tRoute('transfers')}`}
        </span>
        <span>·</span>
        <span className="inline-flex items-center gap-1">
          <Footprints className="h-3.5 w-3.5" />
          {Math.round(route.walkingMeters)} m
        </span>
        {route.co2SavedGrams !== undefined && route.co2SavedGrams > 0 && (
          <>
            <span>·</span>
            <span className="text-status-onTime inline-flex items-center gap-1">
              <Leaf className="h-3.5 w-3.5" />
              {tRoute('co2Saved', { value: formatCO2(route.co2SavedGrams, locale) })}
            </span>
          </>
        )}
        {route.tags?.includes('recommended') && (
          <>
            <span>·</span>
            <span className="bg-brand-500/15 text-brand-700 dark:text-brand-300 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold">
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
      <AlertTriangle className="text-status-delay h-10 w-10" />
      <p className="text-muted mt-3 max-w-sm text-sm">{message}</p>
    </div>
  );
}
