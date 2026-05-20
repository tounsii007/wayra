import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/theme';
import { MapLibreView } from '@/components/MapLibreView';
import { COUNTRY_DEFAULT_CENTER, MVP_COUNTRIES } from '@wayra/shared';
import type { CountryCode, Place } from '@wayra/types';
import { api } from '@/lib/api';

const MODE_COLORS: Record<string, string> = {
  station: '#EC0016',
  metro_station: '#1d4fd1',
  tram_stop: '#7c3aed',
  bus_stop: '#0ea5a5',
  airport: '#f59e0b',
};

const MODE_LABELS: Record<string, string> = {
  station: 'Rail',
  metro_station: 'Metro',
  tram_stop: 'Tram',
  bus_stop: 'Bus',
  airport: 'Air',
};

export default function MapScreen() {
  const theme = useTheme();
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
    api
      .nearby(center.lat, center.lng, 1_500_000, 50)
      .then((r) => setPlaces(r.stops))
      .catch(() => setPlaces([]));
  }, [country, center.lat, center.lng]);

  const markers = useMemo(
    () =>
      places
        .filter((p) => enabled[p.type] ?? true)
        .map((p) => ({
          id: p.id,
          coordinates: p.coordinates,
          color: MODE_COLORS[p.type] ?? '#2563eb',
        })),
    [places, enabled],
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <View
        style={{
          flexDirection: 'row',
          gap: 6,
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 8,
        }}
      >
        {MVP_COUNTRIES.map((c) => (
          <Pressable
            key={c}
            onPress={() => setCountry(c)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: country === c ? theme.brand : theme.surface,
              borderColor: theme.border,
              borderWidth: country === c ? 0 : 1,
            }}
          >
            <Text
              style={{
                color: country === c ? '#fff' : theme.text,
                fontSize: 12,
                fontWeight: '800',
              }}
            >
              {c}
            </Text>
          </Pressable>
        ))}
      </View>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 6,
          paddingHorizontal: 16,
          paddingBottom: 8,
        }}
      >
        {Object.entries(MODE_LABELS).map(([key, label]) => {
          const on = enabled[key] ?? true;
          return (
            <Pressable
              key={key}
              onPress={() => setEnabled((s) => ({ ...s, [key]: !s[key] }))}
              style={{
                flexDirection: 'row',
                gap: 6,
                alignItems: 'center',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: on ? theme.surface : theme.surfaceMuted,
                borderColor: theme.border,
                borderWidth: on ? 1 : 0,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: on ? MODE_COLORS[key] : theme.textSubtle,
                }}
              />
              <Text
                style={{
                  color: on ? theme.text : theme.textSubtle,
                  fontSize: 11,
                  fontWeight: '700',
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1, backgroundColor: theme.surfaceMuted }}>
        <MapLibreView
          center={{ lat: center.lat, lng: center.lng }}
          zoom={center.zoom}
          markers={markers}
          cluster
          showUserLocation
          onMarkerPress={(id) => router.push(`/stop/${encodeURIComponent(id)}`)}
        />
      </View>
    </SafeAreaView>
  );
}
