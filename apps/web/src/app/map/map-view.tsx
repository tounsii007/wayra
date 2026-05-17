'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Filter, Search } from 'lucide-react';
import { sampleSuggestions } from '@/data/sample-suggestions';
import { COUNTRY_DEFAULT_CENTER, MVP_COUNTRIES } from '@wayra/shared';
import type { CountryCode, TransitMode } from '@wayra/types';
import { cn } from '@/lib/utils';

const MapLibreMap = dynamic(
  () => import('@/components/maplibre-map').then((m) => m.MapLibreMap),
  { ssr: false, loading: () => <div className="skeleton h-full w-full rounded-3xl" /> },
);

const MODE_COLORS: Record<string, string> = {
  station: '#EC0016',
  metro_station: '#1d4fd1',
  tram_stop: '#7c3aed',
  bus_stop: '#0ea5a5',
  stop: '#0ea5a5',
  airport: '#f59e0b',
};

const MODE_LABELS: Record<string, string> = {
  station: 'Train',
  metro_station: 'Metro',
  tram_stop: 'Tram',
  bus_stop: 'Bus',
  airport: 'Airport',
};

export function MapView() {
  const router = useRouter();
  const [country, setCountry] = useState<CountryCode>('DE');
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    station: true,
    metro_station: true,
    tram_stop: true,
    bus_stop: true,
    airport: true,
  });

  const center = COUNTRY_DEFAULT_CENTER[country];
  const markers = sampleSuggestions
    .filter((p) => p.countryCode === country)
    .filter((p) => enabled[p.type as keyof typeof enabled] ?? true)
    .map((p) => ({
      id: p.id,
      coordinates: p.coordinates,
      color: MODE_COLORS[p.type] ?? '#2563eb',
      label: p.name,
    }));

  return (
    <div className="relative h-full rounded-3xl overflow-hidden surface">
      {/* Filter rail */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-start justify-between gap-2 p-3">
        <div className="pointer-events-auto inline-flex gap-1 rounded-full glass-strong p-1 shadow-card">
          {MVP_COUNTRIES.map((c) => (
            <button
              key={c}
              onClick={() => setCountry(c)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-bold tracking-wide transition-colors',
                country === c ? 'bg-brand-500 text-white' : 'text-muted hover:text-[rgb(var(--text))]',
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="pointer-events-auto inline-flex flex-wrap gap-1 rounded-2xl glass-strong p-1.5 shadow-card">
          <span className="self-center pl-2 text-xs font-semibold uppercase tracking-wide text-subtle">
            <Filter className="mr-1 inline h-3 w-3" />
            Modes
          </span>
          {Object.entries(MODE_LABELS).map(([key, label]) => {
            const on = enabled[key] ?? true;
            return (
              <button
                key={key}
                onClick={() => setEnabled((s) => ({ ...s, [key]: !s[key] }))}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors',
                  on
                    ? 'bg-[rgb(var(--surface))] text-[rgb(var(--text))] shadow-sm'
                    : 'text-subtle',
                )}
              >
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: on ? MODE_COLORS[key] : 'currentColor' }}
                />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <MapLibreMap
        center={{ lat: center.lat, lng: center.lng }}
        zoom={center.zoom}
        markers={markers}
        fitToContent
        onMarkerClick={(m) => router.push(`/stops/${encodeURIComponent(m.id)}`)}
        className="h-full w-full"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-4">
        <a
          href="/search"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full glass-strong px-4 py-2.5 text-sm font-semibold shadow-card focus-ring"
        >
          <Search className="h-4 w-4" />
          Search stops, lines, addresses
        </a>
      </div>
    </div>
  );
}
