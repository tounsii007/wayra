import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import type { Locale, PlanRouteRequest, Route } from '@wayra/types';
import { useTheme } from '@/theme';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { RouteCard } from '@/components/RouteCard';
import { DemoBadge } from '@/components/DemoBadge';

type Pref = 'fastest' | 'cheapest' | 'fewest_transfers' | 'least_walking' | 'accessible';

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

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <Stack.Screen options={{ title: t('nav.plan') }} />

      <View
        style={{
          flexDirection: 'row',
          gap: 6,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 8,
        }}
      >
        {(['fastest', 'cheapest', 'fewest_transfers', 'least_walking', 'accessible'] as const).map(
          (p) => (
            <Pressable
              key={p}
              onPress={() => setPref(p)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: pref === p ? theme.brand : theme.surface,
                borderColor: theme.border,
                borderWidth: pref === p ? 0 : 1,
              }}
            >
              <Text
                style={{
                  color: pref === p ? '#fff' : theme.textMuted,
                  fontSize: 11,
                  fontWeight: '800',
                }}
              >
                {t(`route.preferences.${p}`)}
              </Text>
            </Pressable>
          ),
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        {!from || !to ? (
          <EmptyState message={t('errors.noRoute')} />
        ) : loading ? (
          <ActivityIndicator color={theme.brand} style={{ marginTop: 24 }} />
        ) : sorted.length === 0 ? (
          <EmptyState message={notice ?? t('errors.noRoute')} />
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <DemoBadge label="Estimated" />
              <Text style={{ color: theme.textSubtle, fontSize: 11 }}>
                Synthesised — see roadmap for OTP integration.
              </Text>
            </View>
            {sorted.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => router.push(`/trip/${encodeURIComponent(r.id)}`)}
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
    <View
      style={{
        alignItems: 'center',
        padding: 24,
        gap: 8,
        backgroundColor: theme.surface,
        borderColor: theme.border,
        borderWidth: 1,
        borderRadius: 16,
      }}
    >
      <AlertTriangle color={theme.status.delay} size={28} />
      <Text style={{ color: theme.textMuted, textAlign: 'center', fontSize: 13 }}>{message}</Text>
    </View>
  );
}
