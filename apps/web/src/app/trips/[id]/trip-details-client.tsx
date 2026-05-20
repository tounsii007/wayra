'use client';

import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowRight,
  Footprints,
  Train,
  Leaf,
  Clock,
  Sparkles,
  Share2,
  BookmarkPlus,
  Check,
  BellRing,
  MapPin,
  Ticket,
} from 'lucide-react';
import { formatTime, formatDuration, formatFare, formatCO2 } from '@wayra/shared';
import type { Locale, Route } from '@wayra/types';
import { useAuthStore } from '@/lib/auth-store';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const MapLibreMap = dynamic(() => import('@/components/maplibre-map').then((m) => m.MapLibreMap), {
  ssr: false,
  loading: () => <div className="skeleton h-full w-full rounded-3xl" />,
});

export function TripDetailsClient({ route }: { route: Route }) {
  const locale = useLocale() as Locale;
  const tRoute = useTranslations('route');
  const { token } = useAuthStore();
  const [saved, setSaved] = useState(false);
  const [savingError, setSavingError] = useState<string | null>(null);

  const firstLeg = route.legs[0]!;
  const lastLeg = route.legs[route.legs.length - 1]!;

  const markers = route.legs.flatMap((l) => [
    {
      id: `${l.from.id}-from`,
      coordinates: l.from.coordinates,
      color: '#0d9488',
      label: l.from.name,
    },
    { id: `${l.to.id}-to`, coordinates: l.to.coordinates, color: '#d97706', label: l.to.name },
  ]);

  const mapRoutes = [
    {
      id: route.id,
      coordinates: route.legs.flatMap((l) => [
        [l.from.coordinates.lng, l.from.coordinates.lat] as [number, number],
        [l.to.coordinates.lng, l.to.coordinates.lat] as [number, number],
      ]),
      color: '#0d9488',
      width: 5,
    },
  ];

  async function save() {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    setSavingError(null);
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const res = await fetch(`${base}/api/me/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        label: `${firstLeg.from.name} → ${lastLeg.to.name}`,
        data: { from: firstLeg.from.id, to: lastLeg.to.id, route },
        notify: true,
      }),
    });
    if (!res.ok) {
      setSavingError('Could not save — sign in?');
      return;
    }
    setSaved(true);
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Wayra trip', url });
      } catch {
        /* user cancelled */
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  }

  return (
    <div className="space-y-6">
      {/* ---- Hero ticket --------------------------------------------- */}
      <header className="ticket ticket--stub relative overflow-hidden p-0">
        {/* Top accent bar */}
        <div className="from-brand-500 via-accent-500 to-brand-500 h-[3px] bg-gradient-to-r" />

        <div className="relative p-6 sm:p-8">
          {/* Subtle aurora */}
          <div className="from-brand-500/30 via-accent-500/20 pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br to-transparent blur-3xl" />

          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="chip-amber">
                <Ticket className="h-3 w-3" />
                Trip ticket
              </span>
              {/* Big time row */}
              <div className="mt-3 flex flex-wrap items-baseline gap-3">
                <div className="board-num font-display tracking-tightest text-4xl font-bold sm:text-5xl">
                  {formatTime(route.departureTime, locale)}
                </div>
                <ArrowRight className="text-muted h-5 w-5" />
                <div className="board-num font-display tracking-tightest text-4xl font-bold sm:text-5xl">
                  {formatTime(route.arrivalTime, locale)}
                </div>
              </div>

              {/* From → To */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <span className="bg-brand-500 h-2 w-2 rounded-full" />
                  <span className="font-semibold">{firstLeg.from.name}</span>
                </span>
                <span className="text-subtle font-mono text-xs">→</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="bg-accent-500 h-2 w-2 rounded-full" />
                  <span className="font-semibold">{lastLeg.to.name}</span>
                </span>
              </div>
            </div>

            {/* Pricing / metadata */}
            <div className="flex flex-wrap items-center gap-2">
              {route.fare && (
                <span className="board-num bg-brand-500/10 text-brand-700 dark:text-brand-300 inline-flex items-center rounded-2xl px-4 py-2 text-lg font-bold">
                  {formatFare(route.fare.amount, route.fare.currency, locale)}
                </span>
              )}
              <div className="surface-muted inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold">
                <Clock className="h-3.5 w-3.5" />
                <span className="board-num">{formatDuration(route.durationSeconds, locale)}</span>
              </div>
              <div className="surface-muted inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold">
                {route.transfers === 0
                  ? tRoute('noTransfer')
                  : `${route.transfers} ${tRoute('transfers')}`}
              </div>
              {route.tags?.includes('recommended') && (
                <span className="chip-brand">
                  <Sparkles className="h-3 w-3" />
                  Recommended
                </span>
              )}
            </div>
          </div>

          {/* Action row */}
          <div className="relative mt-6 flex flex-wrap items-center gap-2">
            <button
              onClick={save}
              disabled={saved}
              className={cn('btn', saved ? 'bg-status-onTime text-white' : 'btn-primary')}
            >
              {saved ? (
                <>
                  <Check className="h-4 w-4" /> Saved
                </>
              ) : (
                <>
                  <BookmarkPlus className="h-4 w-4" /> Save trip
                </>
              )}
            </button>
            <button onClick={share} className="btn-surface">
              <Share2 className="h-4 w-4" />
              Share
            </button>
            <button className="btn-ghost">
              <BellRing className="h-4 w-4" />
              Notify on delays
            </button>
            {savingError && (
              <span className="text-status-severe self-center text-xs">{savingError}</span>
            )}
          </div>
        </div>
      </header>

      {/* ---- Body: legs + map --------------------------------------- */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section>
          <header className="mb-4 flex items-end justify-between">
            <div>
              <span className="chip-brand">
                <Train className="h-3 w-3" />
                Itinerary
              </span>
              <h2 className="font-display text-display-sm tracking-tightest display-tight mt-3 font-bold">
                {route.legs.length} {route.legs.length === 1 ? 'leg' : 'legs'}
              </h2>
            </div>
          </header>

          <ol className="relative space-y-3">
            {/* Vertical guide line */}
            <span
              aria-hidden
              className="bg-[linear-gradient(to_bottom,rgb(var(--border)) 50%,transparent 50%)] absolute bottom-5 left-5 top-5 w-px bg-[length:1px_6px]"
            />

            {route.legs.map((leg, i) => {
              const isFirst = i === 0;
              const isLast = i === route.legs.length - 1;

              if (leg.mode.kind === 'walk') {
                return (
                  <li
                    key={i}
                    className="surface-elevated relative flex items-center gap-4 rounded-2xl p-4"
                  >
                    <span className="text-muted relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))]">
                      <Footprints className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold">Walk</div>
                      <div className="text-muted text-xs">{Math.round(leg.distanceMeters)} m</div>
                    </div>
                    <div className="text-muted board-num font-mono text-xs">
                      {formatTime(leg.departureTime, locale)} →{' '}
                      {formatTime(leg.arrivalTime, locale)}
                    </div>
                  </li>
                );
              }
              if (leg.mode.kind === 'transit') {
                const delayMin = Math.round((leg.delaySeconds ?? 0) / 60);
                const color = leg.mode.line.color ?? '#0d9488';
                return (
                  <li
                    key={i}
                    className="surface-elevated relative overflow-hidden rounded-2xl"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {/* Left accent stripe in line color */}
                    <div
                      className="absolute inset-y-0 left-0 w-1.5"
                      style={{ background: color }}
                    />

                    <div className="flex items-start gap-4 p-4 pl-5">
                      <span
                        className="relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
                        style={{ background: color }}
                      >
                        <Train className="h-4 w-4" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-display text-lg font-bold tracking-tight">
                            {leg.mode.line.shortName}
                          </span>
                          {leg.mode.trip.headsign && (
                            <span className="text-muted truncate text-xs font-semibold">
                              → {leg.mode.trip.headsign}
                            </span>
                          )}
                          {delayMin > 0 && (
                            <span className="bg-status-delay/15 text-status-delay ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold">
                              +{delayMin}m
                            </span>
                          )}
                        </div>

                        {/* Stop sequence */}
                        <ol className="mt-3 grid gap-1">
                          <StopRow
                            name={leg.from.name}
                            time={formatTime(leg.departureTime, locale)}
                            color={color}
                            first={isFirst}
                          />
                          <li
                            className="ml-2 h-2 border-l-2 border-dashed"
                            style={{ borderColor: color }}
                          />
                          <StopRow
                            name={leg.to.name}
                            time={formatTime(leg.arrivalTime, locale)}
                            color={color}
                            last={isLast}
                          />
                        </ol>
                      </div>
                    </div>
                  </li>
                );
              }
              return null;
            })}
          </ol>

          {route.co2SavedGrams !== undefined && route.co2SavedGrams > 0 && (
            <div className="ticket mt-6 flex items-center gap-4 overflow-hidden p-5">
              <span className="bg-status-onTime/15 text-status-onTime inline-flex h-12 w-12 items-center justify-center rounded-2xl">
                <Leaf className="h-5 w-5" />
              </span>
              <div className="text-sm">
                <div className="font-display text-status-onTime board-num text-lg font-bold tracking-tight">
                  {formatCO2(route.co2SavedGrams, locale)}
                </div>
                <p className="text-muted">CO₂ saved vs driving solo on this trip.</p>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-3 lg:sticky lg:top-20 lg:h-fit">
          <header>
            <span className="chip-amber">
              <MapPin className="h-3 w-3" />
              Map
            </span>
            <h2 className="font-display text-display-sm tracking-tightest display-tight mt-3 font-bold">
              Overview
            </h2>
          </header>
          <div className="relative h-[480px] overflow-hidden rounded-3xl border border-[rgb(var(--border))] shadow-md">
            <MapLibreMap
              center={firstLeg.from.coordinates}
              zoom={10}
              markers={markers}
              routes={mapRoutes}
              fitToContent
              className="h-full w-full"
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[rgb(var(--bg))]/40 to-transparent" />
          </div>
        </aside>
      </div>
    </div>
  );
}

function StopRow({
  name,
  time,
  color,
  first,
  last,
}: {
  name: string;
  time: string;
  color: string;
  first?: boolean;
  last?: boolean;
}) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={cn(
          'h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-[rgb(var(--bg-elevated))]',
          first || last ? 'ring-4' : '',
        )}
        style={{ background: color }}
      />
      <span className="flex-1 truncate text-sm font-semibold">{name}</span>
      <span className="board-num text-muted font-mono text-xs">{time}</span>
    </li>
  );
}
