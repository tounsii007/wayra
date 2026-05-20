'use client';

import dynamic from 'next/dynamic';
import { Map as MapIcon, ArrowUpRight, Radio } from 'lucide-react';
import Link from 'next/link';
import { sampleSuggestions } from '@/data/sample-suggestions';

const MapLibreMap = dynamic(() => import('@/components/maplibre-map').then((m) => m.MapLibreMap), {
  ssr: false,
  loading: () => <div className="skeleton h-[420px] w-full rounded-3xl" />,
});

/**
 * Landing-page map teaser — full-bleed MapLibre with editorial overlays:
 *   • Live network preview pill (top-left)
 *   • Hero stat / coverage caption (bottom-left)
 *   • "Open full map" CTA (top-right)
 *   • Subtle gradient mask at the bottom so the page below blends in.
 */
export function MapPreview() {
  const markers = sampleSuggestions
    .filter((p) => p.type === 'station')
    .slice(0, 12)
    .map((p) => ({
      id: p.id,
      coordinates: p.coordinates,
      color: '#0d9488',
      label: p.name,
    }));

  return (
    <div className="relative h-[460px] overflow-hidden rounded-[28px] border border-[rgb(var(--border))] shadow-lg sm:h-[520px]">
      <MapLibreMap
        center={{ lat: 45, lng: 8 }}
        zoom={3.6}
        markers={markers}
        interactive={false}
        className="h-full w-full"
      />

      {/* Bottom gradient fade for legibility */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[rgb(var(--bg))]/85 via-[rgb(var(--bg))]/30 to-transparent" />
      {/* Top gradient fade */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[rgb(var(--bg))]/40 to-transparent" />

      {/* Top-left live pill */}
      <div className="glass-strong pointer-events-none absolute left-5 top-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm">
        <span className="live-pip text-status-onTime" />
        <span className="ml-1">Live network preview</span>
      </div>

      {/* Top-right CTA */}
      <Link
        href="/map"
        className="glass-strong focus-ring group absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5"
      >
        <MapIcon className="h-3.5 w-3.5" />
        Open full map
        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </Link>

      {/* Bottom-left caption */}
      <div className="absolute bottom-5 left-5 right-5 z-10 sm:right-auto sm:max-w-md">
        <h3 className="font-display text-balance text-2xl font-bold tracking-tight">
          From Berlin to Tunis,{' '}
          <span className="from-brand-600 to-accent-600 bg-gradient-to-r bg-clip-text text-transparent">
            one map
          </span>
        </h3>
        <p className="text-muted mt-1 text-sm">
          Real-time vehicle positions, disruptions, and routing across 11 countries.
        </p>
        <div className="text-subtle mt-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em]">
          <Radio className="h-3 w-3" />
          <span>34 live feeds active</span>
          <span aria-hidden>·</span>
          <span>{markers.length} stations shown</span>
        </div>
      </div>
    </div>
  );
}
