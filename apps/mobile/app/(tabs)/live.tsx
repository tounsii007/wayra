import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, RadioTower } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useTranslation } from 'react-i18next';
import type { Disruption } from '@wayra/types';
import { api } from '@/lib/api';
import { ScreenHeader, Ticket, Chip, Pip } from '@/components/ui';

const severityTone = (sev: Disruption['severity'], theme: ReturnType<typeof useTheme>) =>
  sev === 'critical'
    ? theme.status.cancelled
    : sev === 'major'
      ? theme.status.severe
      : sev === 'minor'
        ? theme.status.delay
        : theme.status.info;

export default function LiveScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [items, setItems] = useState<Disruption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await api.disruptions();
      setItems(res.disruptions);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ padding: 20, paddingBottom: 12 }}>
        <ScreenHeader
          chip="Realtime"
          chipIcon={<RadioTower color={theme.brand} size={10} />}
          chipTone="brand"
          title={t('home.sections.liveStatus')}
          lead="Active disruptions and platform changes across our networks. Pull down to refresh."
        />
      </View>

      <FlatList
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 12 }}
        data={loading ? Array.from({ length: 4 }).map((_, i) => ({ id: `sk-${i}` }) as any) : items}
        keyExtractor={(d: any) => d.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor={theme.brand}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <Ticket padding="lg">
              <View style={{ alignItems: 'center', gap: 8, paddingVertical: 12 }}>
                <Pip color={theme.status.onTime} size={10} />
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>
                  All clear
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center' }}>
                  No active disruptions reported in the last hour.
                </Text>
              </View>
            </Ticket>
          ) : null
        }
        ListHeaderComponent={
          error ? (
            <Ticket padding="md">
              <Text style={{ color: theme.status.severe, fontSize: 13 }}>{error}</Text>
            </Ticket>
          ) : null
        }
        renderItem={({ item }) => {
          if (loading) {
            return (
              <View
                style={{
                  height: 96,
                  borderRadius: 20,
                  backgroundColor: theme.surfaceMuted,
                  opacity: 0.6,
                }}
              />
            );
          }
          const d = item as Disruption;
          const sevColor = severityTone(d.severity, theme);
          return (
            <View
              style={{
                backgroundColor: theme.bgElevated,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: 20,
                overflow: 'hidden',
                flexDirection: 'row',
                shadowColor: '#0f172a',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 10,
                elevation: 2,
              }}
            >
              {/* Severity stripe */}
              <View style={{ width: 6, backgroundColor: sevColor }} />
              <View style={{ flex: 1, padding: 16, gap: 8 }}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      backgroundColor: sevColor + '20',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AlertTriangle color={sevColor} size={16} />
                  </View>
                  <Text
                    style={{
                      color: theme.text,
                      fontWeight: '800',
                      fontSize: 15,
                      flex: 1,
                      letterSpacing: -0.2,
                    }}
                    numberOfLines={2}
                  >
                    {d.title}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  <Chip
                    label={d.severity}
                    size="sm"
                    tone={
                      d.severity === 'critical' || d.severity === 'major'
                        ? 'danger'
                        : d.severity === 'minor'
                          ? 'amber'
                          : 'brand'
                    }
                  />
                </View>
                {d.description && (
                  <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 19 }}>
                    {d.description}
                  </Text>
                )}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
