'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { MapPin, Sparkles, Heart, ArrowRight } from 'lucide-react';
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
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      {/* Header + map */}
      <section className="space-y-4">
        <header className="flex items-center gap-3">
          <span className="bg-brand-500 shadow-glow inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">{place.name}</h1>
            <p className="text-subtle text-xs">
              {tSearch(place.type)} · {place.countryCode}
              {place.address?.city ? ` · ${place.address.city}` : ''}
            </p>
          </div>
          <div className="ms-auto flex gap-2">
            <button className="surface focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full">
              <Heart className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="h-[360px] overflow-hidden rounded-3xl">
          <MapLibreMap
            center={place.coordinates}
            zoom={15}
            markers={[
              {
                id: place.id,
                coordinates: place.coordinates,
                color: '#2563eb',
                label: place.name,
              },
            ]}
            className="h-full w-full"
          />
        </div>

        {/* Action row */}
        <div className="grid gap-2 sm:grid-cols-3">
          <Link
            href={`/plan?to=${encodeURIComponent(place.id)}`}
            className="surface hover:shadow-card group flex items-center justify-between rounded-2xl p-4 transition-shadow"
          >
            <div>
              <div className="text-sm font-semibold">{tNav('plan')}</div>
              <div className="text-subtle text-xs">to this stop</div>
            </div>
            <ArrowRight className="text-brand-500 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href={`/map?focus=${encodeURIComponent(place.id)}`}
            className="surface hover:shadow-card group flex items-center justify-between rounded-2xl p-4 transition-shadow"
          >
            <div>
              <div className="text-sm font-semibold">{tNav('map')}</div>
              <div className="text-subtle text-xs">show on map</div>
            </div>
            <MapPin className="text-brand-500 h-5 w-5" />
          </Link>
          <Link
            href={`/assistant?context=${encodeURIComponent(place.id)}`}
            className="surface hover:shadow-card group flex items-center justify-between rounded-2xl p-4 transition-shadow"
          >
            <div>
              <div className="text-sm font-semibold">{tNav('assistant')}</div>
              <div className="text-subtle text-xs">ask about this stop</div>
            </div>
            <Sparkles className="text-brand-500 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Departures */}
      <aside className="space-y-3">
        <h2 className="text-lg font-semibold">Live departures</h2>
        <DeparturesBoard stopId={place.id} />
      </aside>
    </div>
  );
}
