import {
  MapView,
  Camera,
  ShapeSource,
  CircleLayer,
} from '@maplibre/maplibre-react-native';
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

interface Props {
  center: Coordinates;
  zoom?: number;
  markers?: MarkerInput[];
}

/**
 * Lightweight wrapper around the MapLibre Native React Native bindings.
 *
 * The v10 package (@maplibre/maplibre-react-native) accepts a JSON-string
 * style and no longer exposes setTelemetryEnabled — telemetry was a
 * Mapbox-only concept and was dropped when the fork forked.
 */
export function MapLibreView({ center, zoom = 12, markers = [] }: Props) {
  const fc = useMemo(
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

  return (
    <MapView
      style={{ flex: 1 }}
      mapStyle={OSM_STYLE}
      logoEnabled={false}
      attributionEnabled
    >
      <Camera
        centerCoordinate={[center.lng, center.lat]}
        zoomLevel={zoom}
        animationMode="flyTo"
      />
      <ShapeSource id="wayra-markers" shape={fc}>
        <CircleLayer
          id="wayra-markers-circle"
          style={{
            circleRadius: 7,
            circleColor: ['get', 'color'],
            circleStrokeWidth: 3,
            circleStrokeColor: '#ffffff',
          }}
        />
      </ShapeSource>
    </MapView>
  );
}
