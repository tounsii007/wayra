'use client';

import dynamic from 'next/dynamic';
import { sampleSuggestions } from '@/data/sample-suggestions';

const MapLibreMap = dynamic(
  () => import('@/components/maplibre-map').then((m) => m.MapLibreMap),
  { ssr: false, loading: () => <div className="skeleton h-[420px] w-full rounded-3xl" /> },
);

/**
 * Landing-page map teaser: a real interactive MapLibre map zoomed out to
 * Europe + North Africa with our MVP city markers. Lazy-loaded so the LCP
 * hero stays fast.
 */
export function MapPreview() {
  const markers = sampleSuggestions
    .filter((p) => p.type === 'station')
    .slice(0, 10)
    .map((p) => ({
      id: p.id,
      coordinates: p.coordinates,
      color: '#2563eb',
      label: p.name,
    }));

  return (
    <div className="relative h-[420px] overflow-hidden rounded-3xl border border-[rgb(var(--border))] shadow-card">
      <MapLibreMap
        center={{ lat: 45, lng: 8 }}
        zoom={3.6}
        markers={markers}
        interactive={false}
        className="h-full w-full"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgb(var(--bg))]/60 via-transparent to-transparent" />
      <div className="pointer-events-none absolute left-5 top-5 inline-flex items-center gap-2 rounded-full glass-strong px-3 py-1 text-xs font-semibold shadow-sm">
        <span className="inline-block h-2 w-2 animate-pulse-soft rounded-full bg-status-onTime" />
        Live network preview
      </div>
    </div>
  );
}
