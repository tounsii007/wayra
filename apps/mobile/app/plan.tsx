import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  AlertTriangle,
  Zap,
  Euro,
  Repeat,
  Footprints,
  Accessibility,
  Train,
} from 'lucide-react-native';
import type { Locale, PlanRouteRequest, Route } from '@wayra/types';
import { useTheme } from '@/theme';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { RouteCard } from '@/components/RouteCard';
import { DemoBadge } from '@/components/DemoBadge';
import { Ticket, Chip } from '@/components/ui';

type Pref = 'fastest' | 'cheapest' | 'fewest_transfers' | 'least_walking' | 'accessible';

const PREF_META: Record<
  Pref,
  { Icon: typeof Zap; tone: 'brand' | 'amber' | 'violet' | 'emerald' | 'rose' }
> = {
  fastest: { Icon: Zap, tone: 'amber' },
  cheapest: { Icon: Euro, tone: 'emerald' },
  fewest_transfers: { Icon: Repeat, tone: 'violet' },
  least_walking: { Icon: Footprints, tone: 'brand' },
  accessible: { Icon: Accessibility, tone: 'rose' },
};

export default function PlanScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { from, to } = useLocalSearchParams<{ from?: string; to?: string }>();
  const [pref, setPref] = useState<Pref>('fastest');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!from || !to) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotice(null);
    const body: PlanRouteRequest = {
      from: { placeId: from },
      to: { placeId: to },
      preferences: [pref === 'accessible' ? 'accessible' : pref],
      ...(pref === 'accessible' ? { wheelchair: true } : {}),
    };
    api
      .plan(body)
      .then((res) => {
        setRoutes(res.routes);
        setNotice(res.notice ?? null);
      })
      .catch((e: Error) => setNotice(e.message))
      .finally(() => setLoading(false));
  }, [from, to, pref]);

  const sorted = [...routes];
  if (pref === 'cheapest') sorted.sort((a, b) => (a.fare?.amount ?? 1e9) - (b.fare?.amount ?? 1e9));
  else if (pref === 'fewest_transfers') sorted.sort((a, b) => a.transfers - b.transfers);
  else if (pref === 'least_walking') sorted.sort((a, b) => a.walkingMeters - b.walkingMeters);
  else sorted.sort((a, b) => a.durationSeconds - b.durationSeconds);

  const toneColor = (tone: (typeof PREF_META)[Pref]['tone']) =>
    tone === 'brand'
      ? theme.brand
      : tone === 'amber'
        ? theme.accent
        : tone === 'violet'
          ? theme.accentLegacy.violet
          : tone === 'emerald'
            ? theme.status.onTime
            : theme.status.severe;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <Stack.Screen options={{ title: t('nav.plan'), headerShown: false }} />

      <View style={{ padding: 20, paddingBottom: 12, gap: 12 }}>
        <Chip label="Departures" tone="brand" icon={<Train color={theme.brand} size={10} />} />
        <Text
          style={{
            color: theme.text,
            fontSize: 30,
            fontWeight: '800',
            letterSpacing: -1,
          }}
        >
          {loading ? 'Searching…' : sorted.length > 0 ? `${sorted.length} options` : 'No routes'}
        </Text>
      </View>

      {/* Pref filter — horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 12,
          gap: 6,
        }}
      >
        {(Object.keys(PREF_META) as Pref[]).map((p) => {
          const meta = PREF_META[p];
          const active = pref === p;
          const c = toneColor(meta.tone);
          return (
            <Pressable
              key={p}
              onPress={() => setPref(p)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: active ? c : theme.bgElevated,
                borderColor: active ? c : theme.border,
                borderWidth: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <meta.Icon color={active ? '#fff' : theme.textMuted} size={12} />
              <Text
                style={{
                  color: active ? '#fff' : theme.text,
                  fontSize: 11,
                  fontWeight: '800',
                }}
              >
                {t(`route.preferences.${p}`)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}>
        {!from || !to ? (
          <EmptyState message={t('errors.noRoute')} />
        ) : loading ? (
          <View style={{ gap: 12 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <View
                key={i}
                style={{
                  height: 168,
                  borderRadius: 20,
                  backgroundColor: theme.surfaceMuted,
                  opacity: 0.6,
                }}
              />
            ))}
          </View>
        ) : sorted.length === 0 ? (
          <EmptyState message={notice ?? t('errors.noRoute')} />
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <DemoBadge label="Estimated" />
              <Text style={{ color: theme.textSubtle, fontSize: 11 }}>
                Synthesised — OTP integration coming soon.
              </Text>
            </View>
            {sorted.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => router.push(`/trip/${encodeURIComponent(r.id)}`)}
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
              >
                <RouteCard route={r} locale={i18n.language as Locale} />
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyState({ message }: { message: string }) {
  const theme = useTheme();
  return (
    <Ticket padding="lg">
      <View style={{ alignItems: 'center', gap: 10, paddingVertical: 20 }}>
        <AlertTriangle color={theme.status.delay} size={32} />
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>No route</Text>
        <Text
          style={{
            color: theme.textMuted,
            textAlign: 'center',
            fontSize: 13,
            paddingHorizontal: 12,
          }}
        >
          {message}
        </Text>
      </View>
    </Ticket>
  );
}
