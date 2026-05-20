'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { type Map as MlMap, type LngLatLike } from 'maplibre-gl';
import { useTheme } from 'next-themes';
import 'maplibre-gl/dist/maplibre-gl.css';

import type { Coordinates, Place } from '@wayra/types';

export interface MapMarker {
  id: string;
  coordinates: Coordinates;
  /** Optional brand color for the dot */
  color?: string;
  label?: string;
}

export interface MapRouteLine {
  id: string;
  coordinates: Array<[number, number]>; // [lng, lat]
  color?: string;
  width?: number;
}

export interface ClusteredLayer {
  /** Stable id used for the GeoJSON source + layers */
  id: string;
  points: MapMarker[];
  clusterRadius?: number;
  clusterMaxZoom?: number;
}

interface Props {
  center: Coordinates;
  zoom?: number;
  markers?: MapMarker[];
  routes?: MapRouteLine[];
  /** Clustered point layers — preferred over `markers` for >100 points. */
  clusters?: ClusteredLayer[];
  /** Auto-fit to markers/routes on first render */
  fitToContent?: boolean;
  className?: string;
  onMarkerClick?: (m: MapMarker) => void;
  onClusterPointClick?: (layerId: string, pointId: string) => void;
  interactive?: boolean;
}

const TILES = {
  light: 'https://api.maptiler.com/maps/streets-v2/style.json?key=PASTE_MAPTILER_KEY_HERE',
  dark: 'https://api.maptiler.com/maps/streets-v2-dark/style.json?key=PASTE_MAPTILER_KEY_HERE',
};

/** Fallback raster style — works without any API key (OSM tiles, attribution required). */
const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

export function MapLibreMap({
  center,
  zoom = 11,
  markers = [],
  routes = [],
  clusters = [],
  fitToContent = false,
  className,
  onMarkerClick,
  onClusterPointClick,
  interactive = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markerRefs = useRef<maplibregl.Marker[]>([]);
  const { resolvedTheme } = useTheme();

  // Initialize once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
    const style = apiKey
      ? (resolvedTheme === 'dark' ? TILES.dark : TILES.light).replace(
          'PASTE_MAPTILER_KEY_HERE',
          apiKey,
        )
      : OSM_STYLE;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: [center.lng, center.lat],
      zoom,
      interactive,
      attributionControl: { compact: true },
    });

    if (interactive) {
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-right');
      map.addControl(new maplibregl.GeolocateControl({ trackUserLocation: false }), 'top-right');
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-style on theme change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
    if (!apiKey) return;
    const next = (resolvedTheme === 'dark' ? TILES.dark : TILES.light).replace(
      'PASTE_MAPTILER_KEY_HERE',
      apiKey,
    );
    map.setStyle(next);
  }, [resolvedTheme]);

  // Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markerRefs.current.forEach((m) => m.remove());
    markerRefs.current = [];

    for (const m of markers) {
      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('aria-label', m.label ?? 'marker');
      el.className = 'wayra-marker';
      el.style.cssText = `
        width: 18px; height: 18px; border-radius: 999px;
        background: ${m.color ?? '#2563eb'};
        border: 3px solid white;
        box-shadow: 0 4px 14px rgba(15,23,42,0.35);
        cursor: ${onMarkerClick ? 'pointer' : 'default'};
        transition: transform 120ms ease;
      `;
      if (onMarkerClick) {
        el.addEventListener('mouseenter', () => (el.style.transform = 'scale(1.15)'));
        el.addEventListener('mouseleave', () => (el.style.transform = 'scale(1)'));
        el.addEventListener('click', () => onMarkerClick(m));
      }

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([m.coordinates.lng, m.coordinates.lat] satisfies LngLatLike)
        .addTo(map);

      if (m.label) {
        marker.setPopup(new maplibregl.Popup({ offset: 18, closeButton: false }).setText(m.label));
      }
      markerRefs.current.push(marker);
    }
  }, [markers, onMarkerClick]);

  // Routes (GeoJSON LineStrings)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      const fc: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: routes.map((r) => ({
          type: 'Feature',
          properties: { id: r.id, color: r.color ?? '#2563eb', width: r.width ?? 5 },
          geometry: { type: 'LineString', coordinates: r.coordinates },
        })),
      };

      const src = map.getSource('wayra-routes') as maplibregl.GeoJSONSource | undefined;
      if (src) {
        src.setData(fc);
      } else {
        map.addSource('wayra-routes', { type: 'geojson', data: fc });
        map.addLayer({
          id: 'wayra-routes-casing',
          type: 'line',
          source: 'wayra-routes',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#ffffff',
            'line-width': ['+', ['get', 'width'], 4],
            'line-opacity': 0.8,
          },
        });
        map.addLayer({
          id: 'wayra-routes-line',
          type: 'line',
          source: 'wayra-routes',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': ['get', 'color'], 'line-width': ['get', 'width'] },
        });
      }
    };

    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [routes]);

  // Clustered layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      for (const c of clusters) {
        const fc: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: c.points.map((p) => ({
            type: 'Feature',
            properties: { id: p.id, color: p.color ?? '#2563eb', label: p.label ?? '' },
            geometry: { type: 'Point', coordinates: [p.coordinates.lng, p.coordinates.lat] },
          })),
        };
        const src = map.getSource(c.id) as maplibregl.GeoJSONSource | undefined;
        if (src) {
          src.setData(fc);
        } else {
          map.addSource(c.id, {
            type: 'geojson',
            data: fc,
            cluster: true,
            clusterRadius: c.clusterRadius ?? 48,
            clusterMaxZoom: c.clusterMaxZoom ?? 14,
          });
          map.addLayer({
            id: `${c.id}-clusters`,
            type: 'circle',
            source: c.id,
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': '#2563eb',
              'circle-radius': ['step', ['get', 'point_count'], 14, 10, 20, 50, 26, 200, 34],
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 3,
              'circle-opacity': 0.92,
            },
          });
          map.addLayer({
            id: `${c.id}-cluster-count`,
            type: 'symbol',
            source: c.id,
            filter: ['has', 'point_count'],
            layout: {
              'text-field': '{point_count_abbreviated}',
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-size': 12,
            },
            paint: { 'text-color': '#ffffff' },
          });
          map.addLayer({
            id: `${c.id}-points`,
            type: 'circle',
            source: c.id,
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': ['get', 'color'],
              'circle-radius': 8,
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 3,
            },
          });

          map.on('click', `${c.id}-clusters`, (e) => {
            const features = map.queryRenderedFeatures(e.point, { layers: [`${c.id}-clusters`] });
            const clusterId = features[0]?.properties?.cluster_id;
            if (clusterId === undefined) return;
            const src2 = map.getSource(c.id) as maplibregl.GeoJSONSource;
            src2.getClusterExpansionZoom(clusterId).then((zoom) => {
              if (typeof zoom === 'number') {
                map.easeTo({
                  center: (features[0]!.geometry as GeoJSON.Point).coordinates as [number, number],
                  zoom,
                });
              }
            });
          });
          map.on('click', `${c.id}-points`, (e) => {
            const f = e.features?.[0];
            if (!f) return;
            const id = String(f.properties?.id ?? '');
            onClusterPointClick?.(c.id, id);
          });
          map.on(
            'mouseenter',
            `${c.id}-clusters`,
            () => (map.getCanvas().style.cursor = 'pointer'),
          );
          map.on('mouseleave', `${c.id}-clusters`, () => (map.getCanvas().style.cursor = ''));
          map.on('mouseenter', `${c.id}-points`, () => (map.getCanvas().style.cursor = 'pointer'));
          map.on('mouseleave', `${c.id}-points`, () => (map.getCanvas().style.cursor = ''));
        }
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [clusters, onClusterPointClick]);

  // Fit to content
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fitToContent) return;
    const all: Array<[number, number]> = [
      ...markers.map((m) => [m.coordinates.lng, m.coordinates.lat] as [number, number]),
      ...routes.flatMap((r) => r.coordinates),
    ];
    if (all.length === 0) return;
    const bounds = all.reduce((b, p) => b.extend(p), new maplibregl.LngLatBounds(all[0]!, all[0]!));
    map.fitBounds(bounds, { padding: 60, duration: 700, maxZoom: 13 });
  }, [fitToContent, markers, routes]);

  return <div ref={containerRef} className={className ?? 'h-full w-full rounded-3xl'} />;
}

/** Convenience: build a marker from a Place */
export function placeToMarker(p: Place, color?: string): MapMarker {
  return {
    id: p.id,
    coordinates: p.coordinates,
    color,
    label: p.name,
  };
}
