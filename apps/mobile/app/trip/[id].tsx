import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import {
  ArrowRight,
  BookmarkPlus,
  Clock,
  Footprints,
  Leaf,
  Share2,
  Train,
} from 'lucide-react-native';
import { formatCO2, formatDuration, formatFare, formatTime } from '@wayra/shared';
import type { Locale, Route } from '@wayra/types';
import { useTheme } from '@/theme';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { MapLibreView } from '@/components/MapLibreView';
import { tap } from '@/lib/haptics';
import { newMutationId, useOfflineQueue } from '@/lib/offline-queue';

export default function TripScreen() {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useAuthStore((s) => s.token);
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const locale = i18n.language as Locale;

  useEffect(() => {
    if (!id) return;
    api
      .route(id)
      .then(setRoute)
      .catch(() => setRoute(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function save() {
    if (!route) return;
    if (!token) {
      router.push('/login');
      return;
    }
    const body = {
      label: `${route.legs[0]!.from.name} → ${route.legs.at(-1)!.to.name}`,
      data: { route },
      notify: true,
    };
    try {
      await api.saveRoute(body);
      tap('success');
    } catch {
      // Offline — queue the mutation so it replays when network returns.
      useOfflineQueue.getState().enqueue({
        id: newMutationId(),
        path: '/api/me/routes',
        method: 'POST',
        body,
        auth: true,
      });
      tap('warning');
    }
    setSaved(true);
  }

  async function share() {
    if (!route) return;
    await Share.share({
      title: 'Wayra trip',
      message: `${formatTime(route.departureTime, locale)} → ${formatTime(route.arrivalTime, locale)} · ${formatDuration(route.durationSeconds, locale)}`,
    });
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <Stack.Screen options={{ title: 'Trip' }} />
      {loading ? (
        <ActivityIndicator color={theme.brand} style={{ marginTop: 32 }} />
      ) : !route ? (
        <Text style={{ padding: 16, color: theme.textMuted }}>Trip not found.</Text>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 0, gap: 0 }}>
          <View style={{ height: 220 }}>
            <MapLibreView
              center={route.legs[0]!.from.coordinates}
              zoom={9}
              markers={[
                {
                  id: 'start',
                  coordinates: route.legs[0]!.from.coordinates,
                  color: '#2563eb',
                },
                {
                  id: 'end',
                  coordinates: route.legs.at(-1)!.to.coordinates,
                  color: '#7c3aed',
                },
              ]}
              polylines={[
                {
                  id: route.id,
                  coordinates: route.legs.flatMap((l) => [
                    [l.from.coordinates.lng, l.from.coordinates.lat] as [number, number],
                    [l.to.coordinates.lng, l.to.coordinates.lat] as [number, number],
                  ]),
                  color: '#2563eb',
                  width: 5,
                },
              ]}
            />
          </View>
          <View style={{ padding: 16, gap: 12 }}>
            <View
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: 18,
                padding: 16,
                gap: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: theme.text, fontSize: 26, fontWeight: '800' }}>
                  {formatTime(route.departureTime, locale)}
                </Text>
                <ArrowRight color={theme.textMuted} size={16} />
                <Text style={{ color: theme.text, fontSize: 26, fontWeight: '800' }}>
                  {formatTime(route.arrivalTime, locale)}
                </Text>
              </View>
              <View
                style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}
              >
                <Pill color={theme.surfaceMuted} text={theme.text}>
                  <Clock color={theme.text} size={12} />{' '}
                  {formatDuration(route.durationSeconds, locale)}
                </Pill>
                {route.fare && (
                  <Pill color={theme.brand + '20'} text={theme.brand}>
                    {formatFare(route.fare.amount, route.fare.currency, locale)}
                  </Pill>
                )}
                <Pill color={theme.surfaceMuted} text={theme.textMuted}>
                  {route.transfers === 0 ? 'direct' : `${route.transfers} transfers`}
                </Pill>
                <Pill color={theme.surfaceMuted} text={theme.textMuted}>
                  <Footprints color={theme.textMuted} size={11} /> {Math.round(route.walkingMeters)}{' '}
                  m
                </Pill>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <Pressable
                  onPress={save}
                  disabled={saved}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    gap: 6,
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 999,
                    backgroundColor: saved ? theme.surfaceMuted : theme.brand,
                    opacity: saved ? 0.6 : 1,
                  }}
                >
                  <BookmarkPlus color={saved ? theme.textMuted : '#fff'} size={14} />
                  <Text style={{ color: saved ? theme.textMuted : '#fff', fontWeight: '800' }}>
                    {saved ? 'Saved' : 'Save trip'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={share}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    gap: 6,
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 999,
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    borderWidth: 1,
                  }}
                >
                  <Share2 color={theme.text} size={14} />
                  <Text style={{ color: theme.text, fontWeight: '800' }}>Share</Text>
                </Pressable>
              </View>
            </View>

            <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16, marginTop: 8 }}>
              Legs
            </Text>
            {route.legs.map((leg, i) => (
              <LegRow key={i} leg={leg} locale={locale} />
            ))}

            {route.co2SavedGrams !== undefined && route.co2SavedGrams > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  gap: 8,
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  borderWidth: 1,
                }}
              >
                <Leaf color={theme.status.onTime} size={16} />
                <Text style={{ color: theme.text }}>
                  <Text style={{ fontWeight: '800', color: theme.status.onTime }}>
                    {formatCO2(route.co2SavedGrams, locale)}
                  </Text>{' '}
                  CO₂ saved vs driving solo.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Pill({
  children,
  color,
  text,
}: {
  children: React.ReactNode;
  color: string;
  text: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: color,
      }}
    >
      <Text style={{ color: text, fontWeight: '700', fontSize: 12 }}>{children}</Text>
    </View>
  );
}

function LegRow({ leg, locale }: { leg: Route['legs'][number]; locale: Locale }) {
  const theme = useTheme();
  if (leg.mode.kind === 'walk') {
    return (
      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          alignItems: 'center',
          padding: 12,
          borderRadius: 14,
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderWidth: 1,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: theme.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Footprints color={theme.textMuted} size={14} />
        </View>
        <Text style={{ flex: 1, color: theme.text, fontSize: 13 }}>
          Walk · {Math.round(leg.distanceMeters)} m
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: 12 }}>
          {formatTime(leg.departureTime, locale)} → {formatTime(leg.arrivalTime, locale)}
        </Text>
      </View>
    );
  }
  if (leg.mode.kind === 'transit') {
    const delayMin = Math.round((leg.delaySeconds ?? 0) / 60);
    return (
      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          padding: 12,
          borderRadius: 14,
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderWidth: 1,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: leg.mode.line.color ?? theme.brand,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Train color="#fff" size={14} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontWeight: '800' }}>
            {leg.mode.line.shortName} → {leg.mode.trip.headsign}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
            {leg.from.name} · {formatTime(leg.departureTime, locale)}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 12 }}>
            {leg.to.name} · {formatTime(leg.arrivalTime, locale)}
          </Text>
          {delayMin > 0 && (
            <Text
              style={{ color: theme.status.delay, fontSize: 11, fontWeight: '800', marginTop: 4 }}
            >
              +{delayMin} min
            </Text>
          )}
        </View>
      </View>
    );
  }
  return null;
}
