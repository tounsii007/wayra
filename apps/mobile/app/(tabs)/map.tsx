import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Filter } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { MapLibreView } from '@/components/MapLibreView';
import { COUNTRY_DEFAULT_CENTER, MVP_COUNTRIES } from '@wayra/shared';
import type { CountryCode, Place } from '@wayra/types';
import { api } from '@/lib/api';

// Brand-aligned colors
const MODE_COLORS: Record<string, string> = {
  station: '#0d9488',
  metro_station: '#0f766e',
  tram_stop: '#7c3aed',
  bus_stop: '#d97706',
  airport: '#fbbf24',
};

const MODE_LABELS: Record<string, string> = {
  station: 'Rail',
  metro_station: 'Metro',
  tram_stop: 'Tram',
  bus_stop: 'Bus',
  airport: 'Air',
};

const FLAGS: Partial<Record<CountryCode, string>> = {
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
          color: MODE_COLORS[p.type] ?? theme.brand,
        })),
    [places, enabled, theme.brand],
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Country picker — horizontally scrolling chip cluster */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          gap: 6,
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 6,
        }}
      >
        {MVP_COUNTRIES.map((c) => {
          const active = country === c;
          return (
            <Pressable
              key={c}
              onPress={() => setCountry(c)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: active ? theme.brand : theme.bgElevated,
                borderColor: active ? theme.brand : theme.border,
                borderWidth: 1,
                flexDirection: 'row',
                gap: 6,
                alignItems: 'center',
                ...(active && {
                  shadowColor: theme.brand,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 3,
                }),
              }}
            >
              <Text style={{ fontSize: 14 }}>{FLAGS[c]}</Text>
              <Text
                style={{
                  color: active ? '#fff' : theme.text,
                  fontSize: 11,
                  fontWeight: '800',
                  letterSpacing: 0.6,
                }}
              >
                {c}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Mode filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          gap: 6,
          paddingHorizontal: 16,
          paddingBottom: 8,
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', marginRight: 4 }}>
          <Filter color={theme.textSubtle} size={12} />
          <Text
            style={{
              color: theme.textSubtle,
              fontSize: 10,
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: 1.2,
            }}
          >
            Modes
          </Text>
        </View>
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
                backgroundColor: on ? theme.bgElevated : 'transparent',
                borderColor: theme.border,
                borderWidth: 1,
                opacity: on ? 1 : 0.5,
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
      </ScrollView>

      {/* Map */}
      <View style={{ flex: 1, backgroundColor: theme.surfaceMuted, position: 'relative' }}>
        <MapLibreView
          center={{ lat: center.lat, lng: center.lng }}
          zoom={center.zoom}
          markers={markers}
          cluster
          showUserLocation
          onMarkerPress={(id) => router.push(`/stop/${encodeURIComponent(id)}`)}
        />

        {/* Bottom stat badge */}
        <View
          style={{
            position: 'absolute',
            left: 16,
            bottom: 16,
            backgroundColor: theme.bgElevated + 'ee',
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          <View>
            <Text
              style={{
                color: theme.textSubtle,
                fontSize: 9,
                fontWeight: '800',
                letterSpacing: 1.4,
                textTransform: 'uppercase',
              }}
            >
              Showing
            </Text>
            <Text
              style={{
                color: theme.text,
                fontSize: 16,
                fontWeight: '800',
                fontVariant: ['tabular-nums'],
              }}
            >
              {markers.length} stops
            </Text>
          </View>
          <View style={{ width: 1, height: 28, backgroundColor: theme.border }} />
          <View>
            <Text
              style={{
                color: theme.textSubtle,
                fontSize: 9,
                fontWeight: '800',
                letterSpacing: 1.4,
                textTransform: 'uppercase',
              }}
            >
              Country
            </Text>
            <Text style={{ color: theme.text, fontSize: 14, fontWeight: '800' }}>
              {FLAGS[country]} {country}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
