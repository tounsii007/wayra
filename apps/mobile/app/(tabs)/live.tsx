import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useTranslation } from 'react-i18next';
import type { Disruption } from '@wayra/types';
import { api } from '@/lib/api';

const severityTone = (sev: Disruption['severity']) =>
  sev === 'critical' ? '#991b1b' : sev === 'major' ? '#dc2626' : sev === 'minor' ? '#f59e0b' : '#0ea5e9';

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
      <View style={{ padding: 20, paddingBottom: 8 }}>
        <Text style={{ color: theme.text, fontSize: 24, fontWeight: '800' }}>
          {t('home.sections.liveStatus')}
        </Text>
        <Text style={{ color: theme.textMuted, marginTop: 4, fontSize: 13 }}>
          Active disruptions across our networks.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.brand} style={{ marginTop: 24 }} />
      ) : error ? (
        <Text style={{ paddingHorizontal: 20, color: theme.status.severe, fontSize: 13 }}>{error}</Text>
      ) : (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 10 }}
          data={items}
          keyExtractor={(d) => d.id}
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
            <Text style={{ color: theme.textMuted, fontSize: 13, padding: 12 }}>
              No active disruptions.
            </Text>
          }
          renderItem={({ item }) => (
            <View
              style={{
                borderLeftWidth: 4,
                borderLeftColor: severityTone(item.severity),
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: 14,
                padding: 14,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: theme.text, fontWeight: '800', flex: 1 }} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text
                  style={{
                    color: severityTone(item.severity),
                    fontSize: 10,
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                  }}
                >
                  {item.severity}
                </Text>
              </View>
              {item.description && (
                <Text style={{ color: theme.textMuted, marginTop: 4, fontSize: 13 }}>{item.description}</Text>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
