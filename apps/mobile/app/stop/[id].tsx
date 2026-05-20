import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { ArrowLeft, Train, MapPin, Heart, Share2, Clock } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { MapLibreView } from '@/components/MapLibreView';
import { useEffect, useState } from 'react';
import type { Departure } from '@wayra/types';
import { Button, Chip, Pip } from '@/components/ui';

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
      <Stack.Screen options={{ headerShown: false }} />

      {/* Map header */}
      <View style={{ height: 260, position: 'relative' }}>
        <MapLibreView
          center={{ lat: 52.52, lng: 13.405 }}
          zoom={14}
          markers={[
            {
              id: id ?? 'stop',
              coordinates: { lat: 52.52, lng: 13.405 },
              color: theme.brand,
            },
          ]}
        />

        {/* Back button */}
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            width: 40,
            height: 40,
            borderRadius: 999,
            backgroundColor: theme.bgElevated + 'ee',
            borderColor: theme.border,
            borderWidth: 1,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <ArrowLeft color={theme.text} size={18} />
        </Pressable>

        {/* Action buttons cluster — top right */}
        <View
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            flexDirection: 'row',
            gap: 8,
          }}
        >
          {[Heart, Share2].map((Icon, i) => (
            <Pressable
              key={i}
              hitSlop={10}
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                backgroundColor: theme.bgElevated + 'ee',
                borderColor: theme.border,
                borderWidth: 1,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#0f172a',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Icon color={theme.text} size={16} />
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}
        style={{
          marginTop: -22,
          backgroundColor: theme.bg,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
      >
        {/* Header info */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 20,
              backgroundColor: theme.brand,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Train color="#fff" size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <Chip
              label="Station"
              tone="brand"
              icon={<Train color={theme.brand} size={10} />}
              size="sm"
            />
            <Text
              style={{
                color: theme.text,
                fontSize: 22,
                fontWeight: '800',
                marginTop: 6,
                letterSpacing: -0.6,
              }}
            >
              {name ?? id}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Button
              label="Plan to here"
              onPress={() => router.push(`/plan?to=${encodeURIComponent(id ?? '')}`)}
              fullWidth
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="From here"
              variant="surface"
              onPress={() => router.push(`/plan?from=${encodeURIComponent(id ?? '')}`)}
              fullWidth
            />
          </View>
        </View>

        {/* Departures board */}
        <View>
          <Chip label="Departures" tone="amber" icon={<Clock color={theme.accent} size={10} />} />
          <Text
            style={{
              color: theme.text,
              fontSize: 22,
              fontWeight: '800',
              letterSpacing: -0.6,
              marginTop: 8,
              marginBottom: 12,
            }}
          >
            Live board
          </Text>

          {/* Dark "board" container */}
          <View
            style={{
              backgroundColor: theme.ink[900],
              borderColor: theme.ink[800],
              borderWidth: 1,
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {/* Top status strip */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 12,
                borderBottomColor: theme.ink[800],
                borderBottomWidth: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Pip color={theme.status.onTime} size={6} />
                <Text
                  style={{
                    color: theme.accent,
                    fontSize: 10,
                    fontWeight: '800',
                    letterSpacing: 1.4,
                    textTransform: 'uppercase',
                  }}
                >
                  Live departures
                </Text>
              </View>
              <Text
                style={{
                  color: theme.accent + '99',
                  fontSize: 10,
                  fontWeight: '800',
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  fontVariant: ['tabular-nums'],
                }}
              >
                {id?.split(':').slice(-1)[0]?.toUpperCase()}
              </Text>
            </View>

            {departures.length === 0 ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 20,
                }}
              >
                <Clock color={theme.accent + 'aa'} size={18} />
                <Text style={{ color: theme.accent + 'aa', fontSize: 13 }}>
                  No departures in the current window.
                </Text>
              </View>
            ) : (
              departures.map((d, idx) => {
                const delayMin = Math.round((d.delaySeconds ?? 0) / 60);
                const tone = d.cancelled
                  ? theme.status.cancelled
                  : delayMin === 0
                    ? theme.status.onTime
                    : delayMin <= 5
                      ? theme.status.delay
                      : theme.status.severe;
                const time = new Date(d.predictedTime ?? d.scheduledTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <View
                    key={`${d.tripId}-${d.scheduledTime}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      ...(idx < departures.length - 1 && {
                        borderBottomColor: theme.ink[800],
                        borderBottomWidth: 1,
                      }),
                    }}
                  >
                    {/* Line badge */}
                    <View
                      style={{
                        minWidth: 48,
                        paddingHorizontal: 8,
                        height: 32,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: d.line.color ?? theme.brand,
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
                        {d.line.shortName}
                      </Text>
                    </View>

                    {/* Destination */}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: theme.accent,
                          fontWeight: '800',
                          fontSize: 13,
                          letterSpacing: -0.2,
                        }}
                        numberOfLines={1}
                      >
                        {d.headsign}
                      </Text>
                      {d.platform && (
                        <Text
                          style={{
                            color: theme.accent + '99',
                            fontSize: 10,
                            fontWeight: '800',
                            letterSpacing: 1.2,
                            textTransform: 'uppercase',
                          }}
                        >
                          Gleis {d.platform}
                        </Text>
                      )}
                    </View>

                    {/* Time + delay */}
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text
                        style={{
                          color: theme.accent,
                          fontWeight: '800',
                          fontSize: 18,
                          fontVariant: ['tabular-nums'],
                          textDecorationLine: d.cancelled ? 'line-through' : undefined,
                        }}
                      >
                        {time}
                      </Text>
                      {delayMin !== 0 && (
                        <Text
                          style={{
                            color: tone,
                            fontWeight: '800',
                            fontSize: 11,
                            fontVariant: ['tabular-nums'],
                          }}
                        >
                          {delayMin > 0 ? `+${delayMin}m` : `${delayMin}m`}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
