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
} from 'lucide-react';
import { formatTime, formatDuration, formatFare, formatCO2 } from '@wayra/shared';
import type { Locale, Route } from '@wayra/types';
import { useAuthStore } from '@/lib/auth-store';
import { useState } from 'react';

const MapLibreMap = dynamic(
  () => import('@/components/maplibre-map').then((m) => m.MapLibreMap),
  { ssr: false, loading: () => <div className="skeleton h-full w-full rounded-3xl" /> },
);

export function TripDetailsClient({ route }: { route: Route }) {
  const locale = useLocale() as Locale;
  const tRoute = useTranslations('route');
  const { token } = useAuthStore();
  const [saved, setSaved] = useState(false);
  const [savingError, setSavingError] = useState<string | null>(null);

  const firstLeg = route.legs[0]!;
  const lastLeg = route.legs[route.legs.length - 1]!;

  const markers = route.legs.flatMap((l) => [
    { id: `${l.from.id}-from`, coordinates: l.from.coordinates, color: '#2563eb', label: l.from.name },
    { id: `${l.to.id}-to`, coordinates: l.to.coordinates, color: '#7c3aed', label: l.to.name },
  ]);

  const routes = [
    {
      id: route.id,
      coordinates: route.legs.flatMap((l) => [
        [l.from.coordinates.lng, l.from.coordinates.lat] as [number, number],
        [l.to.coordinates.lng, l.to.coordinates.lat] as [number, number],
      ]),
      color: '#2563eb',
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
      <header className="surface relative overflow-hidden rounded-3xl p-5">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-brand-500 to-accent-violet opacity-20 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-3xl font-bold tabular-nums">
              {formatTime(route.departureTime, locale)}
              <ArrowRight className="mx-2 inline h-5 w-5 text-muted" />
              {formatTime(route.arrivalTime, locale)}
            </div>
            <div className="mt-1 text-sm text-muted">
              <span className="font-semibold">{firstLeg.from.name}</span> →{' '}
              <span className="font-semibold">{lastLeg.to.name}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {route.fare && (
              <span className="rounded-full bg-brand-500/10 px-3 py-1 text-sm font-bold text-brand-700 dark:text-brand-300">
                {formatFare(route.fare.amount, route.fare.currency, locale)}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full surface-muted px-3 py-1 text-sm font-semibold">
              <Clock className="h-3.5 w-3.5" /> {formatDuration(route.durationSeconds, locale)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full surface-muted px-3 py-1 text-sm font-semibold">
              {route.transfers === 0 ? tRoute('noTransfer') : `${route.transfers} ${tRoute('transfers')}`}
            </span>
            {route.tags?.includes('recommended') && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/15 px-3 py-1 text-sm font-bold text-brand-700 dark:text-brand-300">
                <Sparkles className="h-3.5 w-3.5" /> recommended
              </span>
            )}
          </div>
        </div>

        <div className="relative mt-4 flex flex-wrap gap-2">
          <button
            onClick={save}
            disabled={saved}
            className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-60 focus-ring"
          >
            <BookmarkPlus className="h-4 w-4" />
            {saved ? 'Saved' : 'Save trip'}
          </button>
          <button
            onClick={share}
            className="inline-flex items-center gap-2 rounded-full surface px-4 py-2 text-sm font-semibold focus-ring"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
          {savingError && <span className="text-xs text-status-severe self-center">{savingError}</span>}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Legs</h2>
          <ol className="space-y-3">
            {route.legs.map((leg, i) => {
              if (leg.mode.kind === 'walk') {
                return (
                  <li key={i} className="surface rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl surface-muted">
                        <Footprints className="h-4 w-4 text-muted" />
                      </span>
                      <div className="flex-1 text-sm">
                        Walk · {Math.round(leg.distanceMeters)} m
                      </div>
                      <div className="text-xs text-muted">
                        {formatTime(leg.departureTime, locale)} → {formatTime(leg.arrivalTime, locale)}
                      </div>
                    </div>
                  </li>
                );
              }
              if (leg.mode.kind === 'transit') {
                const delayMin = Math.round((leg.delaySeconds ?? 0) / 60);
                return (
                  <li key={i} className="surface rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white"
                        style={{ background: leg.mode.line.color ?? '#2563eb' }}
                      >
                        <Train className="h-4 w-4" />
                      </span>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-bold">{leg.mode.line.shortName}</span>
                          <span className="truncate text-sm text-muted">→ {leg.mode.trip.headsign}</span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-y-1 text-sm">
                          <div className="font-semibold">{leg.from.name}</div>
                          <div className="text-right tabular-nums">{formatTime(leg.departureTime, locale)}</div>
                          <div className="font-semibold">{leg.to.name}</div>
                          <div className="text-right tabular-nums">{formatTime(leg.arrivalTime, locale)}</div>
                        </div>
                        {delayMin > 0 && (
                          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-status-delay/15 px-2 py-0.5 text-xs font-bold text-status-delay">
                            +{delayMin} min
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              }
              return null;
            })}
          </ol>

          {route.co2SavedGrams !== undefined && (
            <div className="mt-6 surface flex items-center gap-3 rounded-2xl p-4">
              <Leaf className="h-5 w-5 text-status-onTime" />
              <div className="text-sm">
                <span className="font-bold text-status-onTime">
                  {formatCO2(route.co2SavedGrams, locale)}
                </span>{' '}
                CO₂ saved vs driving solo.
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-3">
          <h2 className="text-lg font-semibold">Overview</h2>
          <div className="surface relative h-[420px] overflow-hidden rounded-2xl">
            <MapLibreMap
              center={firstLeg.from.coordinates}
              zoom={10}
              markers={markers}
              routes={routes}
              fitToContent
              className="h-full w-full"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
