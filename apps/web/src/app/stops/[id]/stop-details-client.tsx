'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { MapPin, Sparkles, Heart, ArrowRight, Train, Share2, BellRing } from 'lucide-react';
import type { Place } from '@wayra/types';
import { DeparturesBoard } from '@/components/departures-board';
import { typeIconFor } from '@/components/place-icon';

const MapLibreMap = dynamic(() => import('@/components/maplibre-map').then((m) => m.MapLibreMap), {
  ssr: false,
  loading: () => <div className="skeleton h-full w-full rounded-3xl" />,
});

export function StopDetailsClient({ place }: { place: Place }) {
  const tNav = useTranslations('nav');
  const tSearch = useTranslations('search.types');
  const Icon = typeIconFor(place.type);

  return (
    <div className="space-y-6">
      {/* ---- Stop header — editorial ticket -------------------------- */}
      <header className="ticket relative overflow-hidden">
        <div className="from-brand-500 via-accent-500 to-brand-500 h-[3px] bg-gradient-to-r" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="from-brand-500 to-brand-700 inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md">
                <Icon className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <span className="chip-brand text-[10px]">
                  <Train className="h-3 w-3" />
                  {tSearch(place.type)}
                </span>
                <h1 className="font-display text-display-sm tracking-tightest display-tight mt-2 font-bold">
                  {place.name}
                </h1>
                <p className="text-subtle mt-1 font-mono text-xs uppercase tracking-[0.18em]">
                  {place.countryCode}
                  {place.address?.city ? ` · ${place.address.city}` : ''}
                  {place.externalIds?.ibnr ? ` · IBNR ${place.externalIds.ibnr}` : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                aria-label="Favourite"
                className="focus-ring text-muted inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] transition-colors hover:text-rose-500"
              >
                <Heart className="h-4 w-4" />
              </button>
              <button
                aria-label="Notify"
                className="focus-ring text-muted inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] transition-colors hover:text-[rgb(var(--text))]"
              >
                <BellRing className="h-4 w-4" />
              </button>
              <button
                aria-label="Share"
                className="focus-ring text-muted inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] transition-colors hover:text-[rgb(var(--text))]"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            <QuickActionCard
              href={`/plan?to=${encodeURIComponent(place.id)}`}
              label={tNav('plan')}
              sub="to this stop"
              Icon={ArrowRight}
              tone="brand"
            />
            <QuickActionCard
              href={`/map?focus=${encodeURIComponent(place.id)}`}
              label={tNav('map')}
              sub="show on map"
              Icon={MapPin}
              tone="amber"
            />
            <QuickActionCard
              href={`/assistant?context=${encodeURIComponent(place.id)}`}
              label={tNav('assistant')}
              sub="ask about this stop"
              Icon={Sparkles}
              tone="violet"
            />
          </div>
        </div>
      </header>

      {/* ---- Map + Departures ---------------------------------------- */}
      <div className="grid gap-6 lg:grid-cols-[1fr_440px]">
        <section>
          <header className="mb-4">
            <span className="chip-brand">
              <MapPin className="h-3 w-3" />
              Location
            </span>
            <h2 className="font-display text-display-sm tracking-tightest display-tight mt-3 font-bold">
              Around here
            </h2>
          </header>
          <div className="relative h-[440px] overflow-hidden rounded-3xl border border-[rgb(var(--border))] shadow-md">
            <MapLibreMap
              center={place.coordinates}
              zoom={15}
              markers={[
                {
                  id: place.id,
                  coordinates: place.coordinates,
                  color: '#0d9488',
                  label: place.name,
                },
              ]}
              className="h-full w-full"
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[rgb(var(--bg))]/40 to-transparent" />
          </div>
        </section>

        <aside className="space-y-4">
          <header>
            <span className="chip-amber">
              <Train className="h-3 w-3" />
              Departures
            </span>
            <h2 className="font-display text-display-sm tracking-tightest display-tight mt-3 font-bold">
              Live board
            </h2>
          </header>
          <DeparturesBoard stopId={place.id} />
        </aside>
      </div>
    </div>
  );
}

function QuickActionCard({
  href,
  label,
  sub,
  Icon,
  tone,
}: {
  href: string;
  label: string;
  sub: string;
  Icon: typeof ArrowRight;
  tone: 'brand' | 'amber' | 'violet';
}) {
  const toneClasses =
    tone === 'brand'
      ? 'from-brand-500 to-brand-700'
      : tone === 'amber'
        ? 'from-accent-400 to-accent-600'
        : 'from-violet-500 to-fuchsia-600';

  return (
    <Link
      href={href}
      className="surface-elevated hover:shadow-card focus-ring group relative isolate flex items-center justify-between gap-3 overflow-hidden rounded-2xl p-4 transition-all hover:-translate-y-0.5"
    >
      <div className="min-w-0">
        <div className="text-sm font-bold">{label}</div>
        <div className="text-subtle text-xs">{sub}</div>
      </div>
      <span
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm transition-transform group-hover:scale-105 ${toneClasses}`}
      >
        <Icon className="h-4 w-4" />
      </span>
    </Link>
  );
}
