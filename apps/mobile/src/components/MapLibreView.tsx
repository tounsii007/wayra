import MapLibreGL, {
  MapView,
  Camera,
  ShapeSource,
  CircleLayer,
} from 'react-native-maplibre-gl';
import { useEffect, useMemo } from 'react';
import type { Coordinates } from '@wayra/types';

MapLibreGL.setAccessToken(null);

const OSM_STYLE = {
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

export function MapLibreView({ center, zoom = 12, markers = [] }: Props) {
  useEffect(() => {
    // No telemetry from MapLibre on Android by default — explicit just in case.
    MapLibreGL.setTelemetryEnabled(false);
  }, []);

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
      // @ts-expect-error MapLibre style spec accepts raw object
      mapStyle={OSM_STYLE}
      logoEnabled={false}
      attributionEnabled
    >
      <Camera centerCoordinate={[center.lng, center.lat]} zoomLevel={zoom} animationMode="flyTo" />
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
