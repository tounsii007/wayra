'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Filter, Search, Layers, Compass, Maximize2 } from 'lucide-react';
import { sampleSuggestions } from '@/data/sample-suggestions';
import { COUNTRY_DEFAULT_CENTER, MVP_COUNTRIES } from '@wayra/shared';
import type { CountryCode, Place } from '@wayra/types';
import { cn } from '@/lib/utils';

const MapLibreMap = dynamic(() => import('@/components/maplibre-map').then((m) => m.MapLibreMap), {
  ssr: false,
  loading: () => <div className="skeleton h-full w-full rounded-3xl" />,
});

// New brand-aligned palette
const MODE_COLORS: Record<string, string> = {
  station: '#0d9488',
  metro_station: '#0f766e',
  tram_stop: '#7c3aed',
  bus_stop: '#d97706',
  stop: '#d97706',
  airport: '#fbbf24',
};

const MODE_LABELS: Record<string, string> = {
  station: 'Train',
  metro_station: 'Metro',
  tram_stop: 'Tram',
  bus_stop: 'Bus',
  airport: 'Airport',
};

const FLAGS: Record<CountryCode, string> = {
  DE: '🇩🇪',
  FR: '🇫🇷',
  TN: '🇹🇳',
  AT: '🇦🇹',
  CH: '🇨🇭',
  BE: '🇧🇪',
  NL: '🇳🇱',
  IT: '🇮🇹',
  ES: '🇪🇸',
  MA: '🇲🇦',
  DZ: '🇩🇿',
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
  const [places, setPlaces] = useState<Place[]>([]);

  const center = COUNTRY_DEFAULT_CENTER[country];

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `${base}/api/stops/nearby?lat=${center.lat}&lng=${center.lng}&radiusMeters=1500000&limit=200`,
          { signal: ctrl.signal },
        );
        const json = (await res.json()) as {
          data?: { stops: Place[] };
          error?: { message: string };
        };
        if (json.error || !json.data) throw new Error(json.error?.message ?? 'no data');
        setPlaces(json.data.stops);
      } catch {
        setPlaces(sampleSuggestions.filter((p) => p.countryCode === country));
      }
    })();
    return () => ctrl.abort();
  }, [country, center.lat, center.lng]);

  const visible = places.filter((p) => enabled[p.type] ?? true);
  const points = visible.map((p) => ({
    id: p.id,
    coordinates: p.coordinates,
    color: MODE_COLORS[p.type] ?? '#0d9488',
    label: p.name,
  }));

  return (
    <div className="shadow-card relative h-full overflow-hidden rounded-3xl border border-[rgb(var(--border))]">
      {/* ---- Top overlay row -------------------------------------- */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-start justify-between gap-2 p-3">
        {/* Country picker — pill cluster */}
        <div className="glass-strong pointer-events-auto inline-flex gap-1 rounded-full p-1 shadow-md">
          {MVP_COUNTRIES.map((c) => (
            <button
              key={c}
              onClick={() => setCountry(c)}
              aria-pressed={country === c}
              className={cn(
                'focus-ring inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold tracking-wide transition-all',
                country === c
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-muted hover:text-[rgb(var(--text))]',
              )}
            >
              <span aria-hidden>{FLAGS[c]}</span>
              <span className="hidden sm:inline">{c}</span>
            </button>
          ))}
        </div>

        {/* Mode filter cluster */}
        <div className="glass-strong pointer-events-auto inline-flex flex-wrap items-center gap-1 rounded-2xl p-1.5 shadow-md">
          <span className="text-subtle ml-2 mr-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em]">
            <Filter className="h-3 w-3" />
            Modes
          </span>
          {Object.entries(MODE_LABELS).map(([key, label]) => {
            const on = enabled[key] ?? true;
            return (
              <button
                key={key}
                onClick={() => setEnabled((s) => ({ ...s, [key]: !s[key] }))}
                aria-pressed={on}
                className={cn(
                  'focus-ring inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-all',
                  on
                    ? 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text))] shadow-sm'
                    : 'text-subtle opacity-60',
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

      {/* ---- Right rail — utilities ------------------------------- */}
      <div className="pointer-events-none absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1.5">
        <RailButton Icon={Layers} label="Layers" />
        <RailButton Icon={Compass} label="Reset compass" />
        <RailButton Icon={Maximize2} label="Fit to view" />
      </div>

      {/* ---- Stats badge — bottom-left ---------------------------- */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-20">
        <div className="glass-strong inline-flex items-center gap-3 rounded-2xl px-4 py-2 shadow-md">
          <div>
            <div className="text-subtle font-mono text-[10px] uppercase tracking-[0.18em]">
              Showing
            </div>
            <div className="board-num text-sm font-bold">{visible.length} stops</div>
          </div>
          <div className="h-8 w-px bg-[rgb(var(--border))]" />
          <div>
            <div className="text-subtle font-mono text-[10px] uppercase tracking-[0.18em]">
              Country
            </div>
            <div className="text-sm font-bold">
              <span aria-hidden className="mr-1">
                {FLAGS[country]}
              </span>
              {country}
            </div>
          </div>
        </div>
      </div>

      <MapLibreMap
        center={{ lat: center.lat, lng: center.lng }}
        zoom={center.zoom}
        clusters={[{ id: 'stops', points }]}
        fitToContent
        onClusterPointClick={(_, id) => router.push(`/stops/${encodeURIComponent(id)}`)}
        className="h-full w-full"
      />

      {/* ---- Bottom-center search bar ----------------------------- */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center px-3">
        <a
          href="/search"
          className="glass-strong focus-ring pointer-events-auto inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-md transition-all hover:-translate-y-0.5"
        >
          <Search className="h-4 w-4" />
          Search stops, lines, addresses
        </a>
      </div>
    </div>
  );
}

function RailButton({ Icon, label }: { Icon: typeof Layers; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="glass-strong text-muted focus-ring pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-all hover:scale-105 hover:text-[rgb(var(--text))]"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
