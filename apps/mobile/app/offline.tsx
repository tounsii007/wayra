import { useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  CloudDownload,
  Trash2,
  HardDrive,
  CheckCircle2,
  MapPin,
  Loader2,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/theme';
import { Ticket, Button, ScreenHeader, Chip } from '@/components/ui';

interface Region {
  id: string;
  name: string;
  countryCode: string;
  sizeBytes: number;
  version: string;
}

const KEY = 'wayra:offline';

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
}

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

  const totalBytes = regions
    ? Object.entries(downloaded).reduce((acc, [id, st]) => {
        if (st.pct < 100) return acc;
        const r = regions.find((x) => x.id === id);
        return acc + (r?.sizeBytes ?? 0);
      }, 0)
    : 0;
  const countDone = Object.values(downloaded).filter((s) => s.pct >= 100).length;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <Stack.Screen options={{ title: 'Offline', headerShown: false }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 18 }}>
        <ScreenHeader
          chip="Storage"
          chipIcon={<CloudDownload color={theme.brand} size={10} />}
          chipTone="brand"
          title="Offline"
          highlight="regions"
          lead="Download cities to navigate without internet — Paris métro tunnels, Berlin U-Bahn, Tunis."
        />

        {/* Storage summary */}
        <Ticket padding="lg">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 18,
                backgroundColor: theme.brand,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HardDrive color="#fff" size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: theme.textSubtle,
                  fontSize: 10,
                  fontWeight: '800',
                  letterSpacing: 1.4,
                  textTransform: 'uppercase',
                }}
              >
                Downloaded
              </Text>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 18,
                  fontWeight: '800',
                  letterSpacing: -0.4,
                  marginTop: 2,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {countDone} region{countDone === 1 ? '' : 's'} · {humanSize(totalBytes)}
              </Text>
            </View>
          </View>
        </Ticket>

        {error && (
          <Ticket padding="md">
            <Text style={{ color: theme.status.severe, fontSize: 13 }}>
              Failed to load: {error}
            </Text>
          </Ticket>
        )}

        {/* Region list */}
        {regions === null ? (
          <View style={{ gap: 8 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <View
                key={i}
                style={{
                  height: 96,
                  borderRadius: 20,
                  backgroundColor: theme.surfaceMuted,
                  opacity: 0.6,
                }}
              />
            ))}
          </View>
        ) : (
          regions.map((r) => {
            const st = downloaded[r.id];
            const done = st && st.pct >= 100;
            return (
              <View
                key={r.id}
                style={{
                  backgroundColor: theme.bgElevated,
                  borderColor: theme.border,
                  borderWidth: 1,
                  borderRadius: 20,
                  overflow: 'hidden',
                  shadowColor: '#0f172a',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.06,
                  shadowRadius: 10,
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 16,
                    gap: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 16,
                        backgroundColor: theme.brand,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CloudDownload color="#fff" size={20} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: theme.text,
                          fontWeight: '800',
                          fontSize: 16,
                          letterSpacing: -0.3,
                        }}
                      >
                        {r.name}
                      </Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          marginTop: 2,
                        }}
                      >
                        <MapPin color={theme.textSubtle} size={10} />
                        <Text
                          style={{
                            color: theme.textSubtle,
                            fontSize: 10,
                            fontWeight: '800',
                            letterSpacing: 1.2,
                            textTransform: 'uppercase',
                          }}
                        >
                          {r.countryCode} · {humanSize(r.sizeBytes)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {!st && (
                    <Button
                      label="Download"
                      onPress={() => start(r.id)}
                      iconLeft={<CloudDownload color="#fff" size={12} />}
                      size="sm"
                    />
                  )}
                  {done && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Chip
                        label="Ready"
                        tone="success"
                        size="sm"
                        icon={<CheckCircle2 color={theme.status.onTime} size={10} />}
                      />
                      <Pressable onPress={() => remove(r.id)} hitSlop={10} style={{ padding: 6 }}>
                        <Trash2 color={theme.textSubtle} size={16} />
                      </Pressable>
                    </View>
                  )}
                  {st && !done && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Loader2 color={theme.brand} size={14} />
                      <Text
                        style={{
                          color: theme.textMuted,
                          fontSize: 12,
                          fontWeight: '800',
                          fontVariant: ['tabular-nums'],
                        }}
                      >
                        {st.pct}%
                      </Text>
                    </View>
                  )}
                </View>

                {st && !done && (
                  <View
                    style={{
                      borderTopColor: theme.border,
                      borderTopWidth: 1,
                      padding: 12,
                    }}
                  >
                    <View
                      style={{
                        height: 6,
                        borderRadius: 999,
                        backgroundColor: theme.surfaceMuted,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          width: `${st.pct}%`,
                          height: '100%',
                          backgroundColor: theme.brand,
                          borderRadius: 999,
                        }}
                      />
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
