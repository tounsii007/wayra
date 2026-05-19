import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '@/theme';
import { MapLibreView } from '@/components/MapLibreView';
import { useEffect, useState } from 'react';
import type { Departure } from '@wayra/types';

/**
 * Mobile stop details: map preview + live departures fetched via REST.
 * Production wires the same WebSocket as the web app to receive live updates.
 */
export default function StopDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const base = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
    (async () => {
      try {
        const stopRes = await fetch(`${base}/api/stations/${encodeURIComponent(id)}`);
        const stop = (await stopRes.json()) as { data?: { name: string } };
        setName(stop.data?.name ?? id);
      } catch {
        setName(id);
      }
      try {
        const depRes = await fetch(
          `${base}/api/realtime/departures?stopId=${encodeURIComponent(id)}&limit=10`,
        );
        const dep = (await depRes.json()) as {
          data?: { departures: Departure[] };
        };
        setDepartures(dep.data?.departures ?? []);
      } catch {
        setDepartures([]);
      }
    })();
  }, [id]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <Stack.Screen options={{ title: name ?? 'Stop' }} />
      <View style={{ height: 240 }}>
        <MapLibreView
          center={{ lat: 52.52, lng: 13.405 }}
          zoom={14}
          markers={[
            {
              id: id ?? 'stop',
              coordinates: { lat: 52.52, lng: 13.405 },
              color: '#2563eb',
            },
          ]}
        />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800' }}>
          {name ?? id}
        </Text>

        <View style={{ flexDirection: 'row', gap: 8, marginVertical: 8 }}>
          <Pressable
            onPress={() => router.push(`/plan?to=${encodeURIComponent(id ?? '')}`)}
            style={{
              flex: 1,
              flexDirection: 'row',
              gap: 6,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 12,
              borderRadius: 999,
              backgroundColor: theme.brand,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>Plan to here</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push(`/plan?from=${encodeURIComponent(id ?? '')}`)}
            style={{
              flex: 1,
              flexDirection: 'row',
              gap: 6,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 12,
              borderRadius: 999,
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderWidth: 1,
            }}
          >
            <Text style={{ color: theme.text, fontWeight: '800' }}>From here</Text>
          </Pressable>
        </View>

        <Text style={{ color: theme.textMuted, marginBottom: 6 }}>Live departures</Text>
        {departures.length === 0 && (
          <Text style={{ color: theme.textSubtle, fontSize: 13 }}>
            No departures in the current window.
          </Text>
        )}
        {departures.map((d) => {
          const delayMin = Math.round((d.delaySeconds ?? 0) / 60);
          const tone =
            d.cancelled
              ? theme.status.cancelled
              : delayMin === 0
                ? theme.status.onTime
                : delayMin <= 5
                  ? theme.status.delay
                  : theme.status.severe;
          return (
            <View
              key={`${d.tripId}-${d.scheduledTime}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: 14,
                padding: 12,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: d.line.color ?? '#2563eb',
                }}
              >
                <Text style={{ color: 'white', fontWeight: '800', fontSize: 12 }}>
                  {d.line.shortName}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '700' }}>{d.headsign}</Text>
                {d.platform ? (
                  <Text style={{ color: theme.textSubtle, fontSize: 12 }}>
                    Gleis {d.platform}
                  </Text>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16 }}>
                  {new Date(d.predictedTime ?? d.scheduledTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                {delayMin !== 0 && (
                  <Text style={{ color: tone, fontWeight: '700', fontSize: 12 }}>
                    {delayMin > 0 ? `+${delayMin}` : delayMin}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
