import { useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { CloudDownload, Trash2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/theme';

interface Region {
  id: string;
  name: string;
  countryCode: string;
  sizeBytes: number;
  version: string;
}

const KEY = 'wayra:offline';

export default function OfflineScreen() {
  const theme = useTheme();
  const [regions, setRegions] = useState<Region[] | null>(null);
  const [downloaded, setDownloaded] = useState<Record<string, { at: string; pct: number }>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v) setDownloaded(JSON.parse(v));
    });
    const base = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
    fetch(`${base}/api/offline/regions`)
      .then((r) => r.json())
      .then((j) => setRegions(j.data?.regions ?? []))
      .catch((e: Error) => {
        setError(e.message);
        setRegions([]);
      });
  }, []);

  function start(id: string) {
    setDownloaded((d) => ({ ...d, [id]: { at: new Date().toISOString(), pct: 0 } }));
    let pct = 0;
    const t = setInterval(() => {
      pct = Math.min(100, pct + 15);
      setDownloaded((d) => {
        const next = { ...d, [id]: { at: new Date().toISOString(), pct } };
        AsyncStorage.setItem(KEY, JSON.stringify(next));
        return next;
      });
      if (pct >= 100) clearInterval(t);
    }, 250);
  }

  function remove(id: string) {
    setDownloaded((d) => {
      const next = { ...d };
      delete next[id];
      AsyncStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <Stack.Screen options={{ title: 'Offline' }} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <Text style={{ color: theme.text, fontSize: 24, fontWeight: '800' }}>Offline regions</Text>
        <Text style={{ color: theme.textMuted }}>
          Download a city to navigate without internet.
        </Text>

        {error && (
          <Text style={{ color: theme.status.severe, fontSize: 13 }}>Failed to load: {error}</Text>
        )}

        {regions === null && <ActivityIndicator color={theme.brand} style={{ marginTop: 24 }} />}

        {regions?.map((r) => {
          const st = downloaded[r.id];
          return (
            <View
              key={r.id}
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: 16,
                padding: 14,
                gap: 10,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16 }}>{r.name}</Text>
                  <Text style={{ color: theme.textSubtle, fontSize: 12 }}>
                    {r.countryCode} · {(r.sizeBytes / 1024 / 1024).toFixed(0)} MB
                  </Text>
                </View>
                {!st && (
                  <Pressable
                    onPress={() => start(r.id)}
                    style={{
                      flexDirection: 'row',
                      gap: 6,
                      backgroundColor: theme.brand,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 999,
                    }}
                  >
                    <CloudDownload color="white" size={14} />
                    <Text style={{ color: 'white', fontWeight: '800', fontSize: 12 }}>Download</Text>
                  </Pressable>
                )}
                {st && st.pct >= 100 && (
                  <Pressable onPress={() => remove(r.id)} hitSlop={8}>
                    <Trash2 color={theme.textSubtle} size={18} />
                  </Pressable>
                )}
                {st && st.pct < 100 && (
                  <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '700' }}>
                    {st.pct}%
                  </Text>
                )}
              </View>
              {st && st.pct < 100 && (
                <View style={{ height: 4, borderRadius: 4, backgroundColor: theme.surfaceMuted }}>
                  <View
                    style={{
                      width: `${st.pct}%`,
                      height: '100%',
                      borderRadius: 4,
                      backgroundColor: theme.brand,
                    }}
                  />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
