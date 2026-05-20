import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  BookmarkPlus,
  Check,
  Clock,
  Footprints,
  Leaf,
  Share2,
  Ticket as TicketIcon,
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
import { Ticket, Button, Chip } from '@/components/ui';

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
      <Stack.Screen options={{ headerShown: false }} />

      {loading ? (
        <ActivityIndicator color={theme.brand} style={{ marginTop: 32 }} />
      ) : !route ? (
        <View style={{ padding: 20 }}>
          <Ticket padding="lg">
            <Text style={{ color: theme.textMuted }}>Trip not found.</Text>
          </Ticket>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Map header */}
          <View style={{ height: 240, position: 'relative' }}>
            <MapLibreView
              center={route.legs[0]!.from.coordinates}
              zoom={9}
              markers={[
                {
                  id: 'start',
                  coordinates: route.legs[0]!.from.coordinates,
                  color: theme.brand,
                },
                {
                  id: 'end',
                  coordinates: route.legs.at(-1)!.to.coordinates,
                  color: theme.accent,
                },
              ]}
              polylines={[
                {
                  id: route.id,
                  coordinates: route.legs.flatMap((l) => [
                    [l.from.coordinates.lng, l.from.coordinates.lat] as [number, number],
                    [l.to.coordinates.lng, l.to.coordinates.lat] as [number, number],
                  ]),
                  color: theme.brand,
                  width: 5,
                },
              ]}
            />
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
          </View>

          {/* Trip ticket */}
          <View
            style={{
              padding: 20,
              gap: 16,
              marginTop: -22,
              backgroundColor: theme.bg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
          >
            <Ticket accent padding="lg">
              <Chip
                label="Trip ticket"
                tone="amber"
                icon={<TicketIcon color={theme.accent} size={10} />}
              />

              {/* Big times */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  gap: 10,
                  marginTop: 12,
                }}
              >
                <Text
                  style={{
                    color: theme.text,
                    fontSize: 36,
                    fontWeight: '800',
                    letterSpacing: -1.2,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {formatTime(route.departureTime, locale)}
                </Text>
                <ArrowRight color={theme.textMuted} size={20} />
                <Text
                  style={{
                    color: theme.text,
                    fontSize: 36,
                    fontWeight: '800',
                    letterSpacing: -1.2,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {formatTime(route.arrivalTime, locale)}
                </Text>
              </View>

              {/* From → To */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <View
                  style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: theme.brand }}
                />
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>
                  {route.legs[0]!.from.name}
                </Text>
                <Text style={{ color: theme.textSubtle, fontSize: 11, marginHorizontal: 4 }}>
                  →
                </Text>
                <View
                  style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: theme.accent }}
                />
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>
                  {route.legs.at(-1)!.to.name}
                </Text>
              </View>

              {/* Stats pills */}
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginTop: 12,
                }}
              >
                <StatPill
                  bg={theme.surfaceMuted}
                  text={theme.text}
                  icon={<Clock color={theme.text} size={12} />}
                  label={formatDuration(route.durationSeconds, locale)}
                />
                {route.fare && (
                  <StatPill
                    bg={theme.brandSoft}
                    text={theme.brandStrong}
                    label={formatFare(route.fare.amount, route.fare.currency, locale)}
                  />
                )}
                <StatPill
                  bg={theme.surfaceMuted}
                  text={theme.textMuted}
                  label={route.transfers === 0 ? 'Direct' : `${route.transfers} transfers`}
                />
                <StatPill
                  bg={theme.surfaceMuted}
                  text={theme.textMuted}
                  icon={<Footprints color={theme.textMuted} size={11} />}
                  label={`${Math.round(route.walkingMeters)} m`}
                />
              </View>

              {/* Actions */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                <View style={{ flex: 1 }}>
                  <Button
                    label={saved ? 'Saved' : 'Save trip'}
                    onPress={save}
                    disabled={saved}
                    variant={saved ? 'surface' : 'primary'}
                    iconLeft={
                      saved ? (
                        <Check color={theme.status.onTime} size={14} />
                      ) : (
                        <BookmarkPlus color="#fff" size={14} />
                      )
                    }
                    fullWidth
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label="Share"
                    variant="surface"
                    onPress={share}
                    iconLeft={<Share2 color={theme.text} size={14} />}
                    fullWidth
                  />
                </View>
              </View>
            </Ticket>

            {/* Legs */}
            <View>
              <Chip label="Itinerary" tone="brand" icon={<Train color={theme.brand} size={10} />} />
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
                {route.legs.length} {route.legs.length === 1 ? 'leg' : 'legs'}
              </Text>

              <View style={{ gap: 10 }}>
                {route.legs.map((leg, i) => (
                  <LegRow key={i} leg={leg} locale={locale} />
                ))}
              </View>
            </View>

            {route.co2SavedGrams !== undefined && route.co2SavedGrams > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  gap: 14,
                  alignItems: 'center',
                  padding: 16,
                  borderRadius: 20,
                  backgroundColor: theme.bgElevated,
                  borderColor: theme.border,
                  borderWidth: 1,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: theme.status.onTime + '20',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Leaf color={theme.status.onTime} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.status.onTime,
                      fontWeight: '800',
                      fontSize: 16,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {formatCO2(route.co2SavedGrams, locale)}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
                    CO₂ saved vs driving solo.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function StatPill({
  bg,
  text,
  icon,
  label,
}: {
  bg: string;
  text: string;
  icon?: React.ReactNode;
  label: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: bg,
      }}
    >
      {icon}
      <Text
        style={{
          color: text,
          fontWeight: '800',
          fontSize: 12,
          fontVariant: ['tabular-nums'],
        }}
      >
        {label}
      </Text>
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
          padding: 14,
          borderRadius: 18,
          backgroundColor: theme.bgElevated,
          borderColor: theme.border,
          borderWidth: 1,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: theme.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Footprints color={theme.textMuted} size={16} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontWeight: '800', fontSize: 13 }}>Walk</Text>
          <Text style={{ color: theme.textSubtle, fontSize: 11 }}>
            {Math.round(leg.distanceMeters)} m
          </Text>
        </View>
        <Text
          style={{
            color: theme.textMuted,
            fontSize: 11,
            fontWeight: '700',
            fontVariant: ['tabular-nums'],
          }}
        >
          {formatTime(leg.departureTime, locale)} → {formatTime(leg.arrivalTime, locale)}
        </Text>
      </View>
    );
  }
  if (leg.mode.kind === 'transit') {
    const delayMin = Math.round((leg.delaySeconds ?? 0) / 60);
    const color = leg.mode.line.color ?? theme.brand;
    return (
      <View
        style={{
          backgroundColor: theme.bgElevated,
          borderColor: theme.border,
          borderWidth: 1,
          borderRadius: 18,
          overflow: 'hidden',
          flexDirection: 'row',
        }}
      >
        {/* Left line-color stripe */}
        <View style={{ width: 5, backgroundColor: color }} />
        <View style={{ flex: 1, flexDirection: 'row', gap: 12, padding: 14 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Train color="#fff" size={16} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text
                style={{
                  color: theme.text,
                  fontWeight: '800',
                  fontSize: 15,
                  letterSpacing: -0.2,
                }}
              >
                {leg.mode.line.shortName}
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700' }}>
                → {leg.mode.trip.headsign}
              </Text>
            </View>

            <View style={{ marginTop: 8, gap: 6 }}>
              <StopLine
                name={leg.from.name}
                time={formatTime(leg.departureTime, locale)}
                color={color}
              />
              <View
                style={{
                  marginLeft: 4,
                  height: 12,
                  borderLeftWidth: 2,
                  borderLeftColor: color,
                  borderStyle: 'dashed',
                  width: 0,
                }}
              />
              <StopLine
                name={leg.to.name}
                time={formatTime(leg.arrivalTime, locale)}
                color={color}
              />
            </View>

            {delayMin > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  alignSelf: 'flex-start',
                  marginTop: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                  backgroundColor: theme.status.delay + '20',
                }}
              >
                <Text
                  style={{
                    color: theme.status.delay,
                    fontSize: 10,
                    fontWeight: '800',
                  }}
                >
                  +{delayMin} min
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }
  return null;
}

function StopLine({ name, time, color }: { name: string; time: string; color: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          backgroundColor: color,
        }}
      />
      <Text
        style={{ flex: 1, color: theme.text, fontWeight: '700', fontSize: 13 }}
        numberOfLines={1}
      >
        {name}
      </Text>
      <Text
        style={{
          color: theme.textMuted,
          fontSize: 12,
          fontWeight: '800',
          fontVariant: ['tabular-nums'],
        }}
      >
        {time}
      </Text>
    </View>
  );
}
