import type * as React from 'react';
import {
  MapView,
  Camera,
  ShapeSource,
  CircleLayer,
  LineLayer,
  SymbolLayer,
} from '@maplibre/maplibre-react-native';
import * as MapLibreRN from '@maplibre/maplibre-react-native';

// `UserLocation` is exported by the runtime module but isn't in the
// shipped typings. Pull it through the namespace and cast.
const UserLocation: React.ComponentType<{ visible?: boolean; animated?: boolean }> =
  (MapLibreRN as unknown as { UserLocation: React.ComponentType<{ visible?: boolean; animated?: boolean }> })
    .UserLocation ?? (() => null);
import { useMemo } from 'react';
import type { Coordinates } from '@wayra/types';

const OSM_STYLE = JSON.stringify({
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
});

export interface MarkerInput {
  id: string;
  coordinates: Coordinates;
  color?: string;
}

export interface PolylineInput {
  id: string;
  coordinates: Array<[number, number]>; // [lng, lat]
  color?: string;
  width?: number;
}

interface Props {
  center: Coordinates;
  zoom?: number;
  markers?: MarkerInput[];
  polylines?: PolylineInput[];
  /** Render the user-location pulse from CoreLocation / Android Fused */
  showUserLocation?: boolean;
  /** Cluster the markers above this many */
  cluster?: boolean;
  onMarkerPress?: (id: string) => void;
}

/**
 * MapLibre wrapper used by the mobile app.
 *
 * Supports markers, polyline overlays (for trip details), point
 * clustering (turn on for >50 stops), and a live user-location dot.
 */
export function MapLibreView({
  center,
  zoom = 12,
  markers = [],
  polylines = [],
  cluster = false,
  showUserLocation = false,
  onMarkerPress,
}: Props) {
  const markerFc = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: markers.map((m) => ({
        type: 'Feature' as const,
        properties: { id: m.id, color: m.color ?? '#2563eb' },
        geometry: {
          type: 'Point' as const,
          coordinates: [m.coordinates.lng, m.coordinates.lat],
        },
      })),
    }),
    [markers],
  );

  const lineFc = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: polylines.map((p) => ({
        type: 'Feature' as const,
        properties: { id: p.id, color: p.color ?? '#2563eb', width: p.width ?? 5 },
        geometry: { type: 'LineString' as const, coordinates: p.coordinates },
      })),
    }),
    [polylines],
  );

  return (
    <MapView style={{ flex: 1 }} mapStyle={OSM_STYLE} logoEnabled={false} attributionEnabled>
      <Camera centerCoordinate={[center.lng, center.lat]} zoomLevel={zoom} animationMode="flyTo" />

      {polylines.length > 0 && (
        <ShapeSource id="wayra-lines" shape={lineFc}>
          <LineLayer
            id="wayra-lines-casing"
            style={{
              lineColor: '#ffffff',
              lineWidth: ['+', ['get', 'width'], 4],
              lineOpacity: 0.85,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
          <LineLayer
            id="wayra-lines-fill"
            style={{
              lineColor: ['get', 'color'],
              lineWidth: ['get', 'width'],
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </ShapeSource>
      )}

      <ShapeSource
        id="wayra-markers"
        shape={markerFc}
        // Cluster props are accepted by the underlying native module but
        // the v10 RN typings don't expose them yet. Cast through unknown.
        {...((cluster
          ? { cluster: true, clusterRadius: 48, clusterMaxZoom: 14 }
          : {}) as unknown as Record<string, never>)}
        onPress={(e: { features?: Array<{ properties?: Record<string, unknown> }> }) => {
          const f = e?.features?.[0];
          if (!f) return;
          if ((f.properties as { cluster?: boolean } | undefined)?.cluster) return;
          const id = (f.properties as { id?: string } | undefined)?.id;
          if (id && onMarkerPress) onMarkerPress(id);
        }}
      >
        {cluster && (
          <>
            <CircleLayer
              id="wayra-clusters"
              filter={['has', 'point_count']}
              style={{
                circleColor: '#2563eb',
                circleRadius: ['step', ['get', 'point_count'], 14, 10, 20, 50, 26, 200, 34],
                circleStrokeWidth: 3,
                circleStrokeColor: '#ffffff',
                circleOpacity: 0.92,
              }}
            />
            <SymbolLayer
              id="wayra-cluster-count"
              filter={['has', 'point_count']}
              style={{
                textField: '{point_count_abbreviated}',
                textSize: 12,
                textColor: '#ffffff',
              }}
            />
          </>
        )}
        <CircleLayer
          id="wayra-markers-circle"
          filter={cluster ? ['!', ['has', 'point_count']] : undefined}
          style={{
            circleRadius: 7,
            circleColor: ['get', 'color'],
            circleStrokeWidth: 3,
            circleStrokeColor: '#ffffff',
          }}
        />
      </ShapeSource>

      {showUserLocation && <UserLocation visible animated />}
    </MapView>
  );
}
