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
  ChevronRight,
  Share2,
  BellRing,
  Bookmark,
  MapPin,
  Zap,
  Euro,
  Repeat,
  Accessibility,
} from 'lucide-react';
import { formatDuration, formatTime, formatFare, formatCO2 } from '@wayra/shared';
import type { Locale, Route, PlanRouteRequest, PlanRouteResponse } from '@wayra/types';
import { mockRouteResults } from '@/data/mock-routes';
import { sampleSuggestions } from '@/data/sample-suggestions';
import { DemoBadge } from '@/components/demo-badge';
import { cn } from '@/lib/utils';

type Preference = 'fastest' | 'cheapest' | 'fewest_transfers' | 'least_walking' | 'accessible';

const PREF_META: Record<Preference, { Icon: typeof Zap; tone: string }> = {
  fastest: { Icon: Zap, tone: 'text-accent-600' },
  cheapest: { Icon: Euro, tone: 'text-emerald-600' },
  fewest_transfers: { Icon: Repeat, tone: 'text-violet-600' },
  least_walking: { Icon: Footprints, tone: 'text-brand-600' },
  accessible: { Icon: Accessibility, tone: 'text-rose-600' },
};

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
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* ---- Sidebar — itinerary ticket ---------------------------- */}
      <aside className="h-fit lg:sticky lg:top-20">
        <div className="ticket relative overflow-hidden">
          {/* Header */}
          <div className="border-b border-[rgb(var(--border))] p-5">
            <span className="chip-amber text-[10px]">
              <MapPin className="h-3 w-3" />
              Trip
            </span>
            <h2 className="font-display mt-3 text-base font-bold tracking-tight">
              {tHero('title')}
            </h2>
          </div>

          {/* Route visualization */}
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center pt-1">
                <span className="bg-brand-500 h-3 w-3 rounded-full shadow-[0_0_0_4px_rgb(var(--brand-soft))]" />
                <span className="bg-[linear-gradient(to_bottom,rgb(var(--border)) 50%,transparent 50%)] my-1 h-12 w-px bg-[length:1px_6px]" />
                <span className="bg-accent-500 h-3 w-3 rounded-full shadow-[0_0_0_4px_rgb(var(--accent-soft))]" />
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <div className="text-subtle text-[10px] font-bold uppercase tracking-[0.18em]">
                    {tRoute('departure')}
                  </div>
                  <div className="font-display truncate text-base font-bold">
                    {from?.name ?? '—'}
                  </div>
                  {from?.countryCode && (
                    <div className="text-subtle font-mono text-[10px] uppercase tracking-[0.16em]">
                      {from.countryCode}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-subtle text-[10px] font-bold uppercase tracking-[0.18em]">
                    {tRoute('arrival')}
                  </div>
                  <div className="font-display truncate text-base font-bold">{to?.name ?? '—'}</div>
                  {to?.countryCode && (
                    <div className="text-subtle font-mono text-[10px] uppercase tracking-[0.16em]">
                      {to.countryCode}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Departure time info */}
            {(departAt || arriveBy) && (
              <div className="mt-5 flex items-center gap-2 rounded-xl bg-[rgb(var(--surface-muted))] px-3 py-2 text-xs">
                <Clock className="text-muted h-3.5 w-3.5" />
                <span className="font-mono text-[11px]">
                  {departAt ? `Depart · ${new Date(departAt).toLocaleString(locale)}` : null}
                  {arriveBy ? `Arrive · ${new Date(arriveBy).toLocaleString(locale)}` : null}
                </span>
              </div>
            )}
          </div>

          {/* Sort preferences */}
          <div className="border-t border-[rgb(var(--border))] p-5">
            <div className="text-subtle mb-3 text-[10px] font-bold uppercase tracking-[0.18em]">
              Sort by
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
              {(
                ['fastest', 'cheapest', 'fewest_transfers', 'least_walking', 'accessible'] as const
              ).map((p) => {
                const { Icon, tone } = PREF_META[p];
                const active = pref === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPref(p)}
                    className={cn(
                      'focus-ring group flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-all',
                      active
                        ? 'border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-200 shadow-sm'
                        : 'text-muted border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:bg-[rgb(var(--surface-muted))] hover:text-[rgb(var(--text))]',
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', active ? tone : 'text-muted')} />
                    <span className="flex-1">{tRoute(`preferences.${p}`)}</span>
                    {active && <ChevronRight className="text-brand-500 h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* ---- Results column ----------------------------------------- */}
      <section>
        {/* Banners */}
        {usedFallback && (
          <div className="chip-amber mb-3 inline-flex">
            <Loader2 className="h-3 w-3 animate-spin" />
            Backend unreachable — offline preview
          </div>
        )}
        {notice && (
          <div className="border-status-delay/30 bg-status-delay/10 text-status-delay mb-3 flex items-start gap-2 rounded-2xl border px-4 py-2.5 text-xs">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>{notice}</p>
          </div>
        )}

        {/* Section header */}
        <header className="mb-4 flex items-end justify-between gap-3">
          <div>
            <span className="chip-brand">
              <Train className="h-3 w-3" />
              Departures
            </span>
            <h1 className="font-display text-display-sm tracking-tightest display-tight mt-3 font-bold">
              {loading
                ? 'Searching…'
                : sorted.length > 0
                  ? `${sorted.length} options`
                  : 'No routes'}
            </h1>
          </div>
          <DemoBadge label="Estimated" />
        </header>

        {!from || !to ? (
          <EmptyState message={tErr('noRoute')} />
        ) : loading ? (
          <RouteListSkeleton />
        ) : sorted.length === 0 ? (
          <EmptyState message={tErr('noRoute')} />
        ) : (
          <ul className="space-y-3">
            {sorted.map((r, i) => (
              <li key={r.id}>
                <RouteCard route={r} locale={locale} index={i} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function RouteCard({ route, locale, index }: { route: Route; locale: Locale; index: number }) {
  const tRoute = useTranslations('route');
  const delay = route.legs.reduce((s, l) => s + (l.delaySeconds ?? 0), 0);
  const delayMin = Math.round(delay / 60);
  const isRecommended = route.tags?.includes('recommended');
  const isFastest = route.tags?.includes('fastest');
  const isCheapest = route.tags?.includes('cheapest');

  return (
    <article
      className={cn(
        'ticket ticket--stub group relative overflow-hidden',
        isRecommended && 'ring-brand-500/40 ring-2',
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      {/* Decorative top accent */}
      <div className="from-brand-500 via-accent-500 to-brand-500 pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r opacity-80" />

      <Link href={`/trips/${encodeURIComponent(route.id)}`} className="focus-ring block p-5">
        {/* Time row — big departure-board style */}
        <header className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <div className="board-num font-display tracking-tightest text-3xl font-bold">
              {formatTime(route.departureTime, locale)}
            </div>
            <ArrowRight className="text-muted h-4 w-4" />
            <div className="board-num font-display tracking-tightest text-3xl font-bold">
              {formatTime(route.arrivalTime, locale)}
            </div>
            {delayMin > 0 && (
              <span className="bg-status-delay/15 text-status-delay inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold">
                +{delayMin}m
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-muted inline-flex items-center gap-1.5 text-sm font-bold">
              <Clock className="h-4 w-4" />
              <span className="board-num">{formatDuration(route.durationSeconds, locale)}</span>
            </span>
            {route.fare && (
              <span className="board-num bg-brand-500/10 text-brand-700 dark:text-brand-300 inline-flex items-center rounded-full px-3 py-1 text-sm font-bold">
                {formatFare(route.fare.amount, route.fare.currency, locale)}
              </span>
            )}
          </div>
        </header>

        {/* Tags row */}
        {(isRecommended || isFastest || isCheapest) && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {isRecommended && (
              <span className="chip-brand text-[10px]">
                <Sparkles className="h-3 w-3" />
                Recommended
              </span>
            )}
            {isFastest && (
              <span className="chip-amber text-[10px]">
                <Zap className="h-3 w-3" />
                Fastest
              </span>
            )}
            {isCheapest && (
              <span className="chip-surface text-[10px] text-emerald-700 dark:text-emerald-400">
                <Euro className="h-3 w-3" />
                Cheapest
              </span>
            )}
          </div>
        )}

        {/* Leg pills + animated timeline */}
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            {route.legs.map((leg, i) => {
              if (leg.mode.kind === 'walk') {
                return (
                  <span
                    key={i}
                    className="text-muted inline-flex items-center gap-1.5 rounded-full bg-[rgb(var(--surface-muted))] px-2.5 py-1 text-xs font-semibold"
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
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-sm"
                    style={{ background: leg.mode.line.color ?? '#0d9488' }}
                  >
                    <Train className="h-3.5 w-3.5" />
                    {leg.mode.line.shortName}
                  </span>
                );
              }
              return null;
            })}
          </div>
        </div>

        {/* Stats row */}
        <div className="text-muted mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
          <span className="inline-flex items-center gap-1">
            <Repeat className="h-3.5 w-3.5" />
            {route.transfers === 0
              ? tRoute('noTransfer')
              : `${route.transfers} ${tRoute('transfers')}`}
          </span>
          <span className="inline-flex items-center gap-1">
            <Footprints className="h-3.5 w-3.5" />
            {Math.round(route.walkingMeters)} m
          </span>
          {route.co2SavedGrams !== undefined && route.co2SavedGrams > 0 && (
            <span className="text-status-onTime inline-flex items-center gap-1">
              <Leaf className="h-3.5 w-3.5" />
              {tRoute('co2Saved', { value: formatCO2(route.co2SavedGrams, locale) })}
            </span>
          )}
        </div>

        {/* Bottom action row */}
        <div className="mt-4 flex items-center justify-between border-t border-[rgb(var(--border))] pt-3">
          <div className="flex items-center gap-1">
            <RouteAction Icon={Bookmark} label="Save" />
            <RouteAction Icon={BellRing} label="Notify" />
            <RouteAction Icon={Share2} label="Share" />
          </div>
          <span className="text-subtle group-hover:text-brand-600 dark:group-hover:text-brand-400 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em]">
            View details
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </article>
  );
}

function RouteAction({ Icon, label }: { Icon: typeof Bookmark; label: string }) {
  return (
    <button
      type="button"
      onClick={(e) => e.preventDefault()}
      aria-label={label}
      className="focus-ring text-subtle inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-[rgb(var(--surface-muted))] hover:text-[rgb(var(--text))]"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function RouteListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton h-40 w-full rounded-2xl" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="ticket relative flex flex-col items-center overflow-hidden px-6 py-16 text-center">
      <AlertTriangle className="text-status-delay h-10 w-10" />
      <p className="text-muted mt-3 max-w-sm text-pretty text-sm">{message}</p>
      <Link href="/" className="btn-surface mt-5">
        Plan a new trip
      </Link>
    </div>
  );
}
