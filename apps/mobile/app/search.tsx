import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Search, X, MapPin, ChevronRight, Train } from 'lucide-react-native';
import type { PlaceSuggestion } from '@wayra/types';
import { useTheme } from '@/theme';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { Ticket, Chip } from '@/components/ui';

export default function SearchScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.search(query, { limit: 20 });
        setResults(res.suggestions);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 160);
    return () => clearTimeout(timer);
  }, [query]);

  const examples = ['Frankfurt Hbf', 'Paris Gare du Nord', 'Tunis Marine', 'Milano Centrale'];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <Stack.Screen options={{ title: 'Search', headerShown: false }} />

      <View style={{ padding: 20, paddingBottom: 12, gap: 12 }}>
        <Chip label="Explore" tone="brand" icon={<Search color={theme.brand} size={10} />} />
        <Text
          style={{
            color: theme.text,
            fontSize: 28,
            fontWeight: '800',
            letterSpacing: -0.8,
          }}
        >
          Find any <Text style={{ color: theme.brand }}>station</Text>
        </Text>
      </View>

      {/* Big search input */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.bgElevated,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 20,
            paddingLeft: 12,
            paddingRight: 8,
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.08,
            shadowRadius: 14,
            elevation: 3,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: theme.brand,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Search color="#fff" size={20} />
          </View>
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder={t('search.placeholder')}
            placeholderTextColor={theme.textSubtle}
            style={{
              flex: 1,
              color: theme.text,
              padding: 14,
              fontSize: 16,
              fontWeight: '600',
            }}
          />
          {loading && <ActivityIndicator color={theme.brand} size="small" />}
          {query && !loading && (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={10}
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X color={theme.textSubtle} size={16} />
            </Pressable>
          )}
        </View>
      </View>

      {!query ? (
        <View style={{ padding: 20 }}>
          <Ticket padding="lg">
            <View style={{ alignItems: 'center', gap: 10 }}>
              <Search color={theme.brand} size={28} />
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>
                Start typing
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center' }}>
                Find any station, stop or city
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 6,
                  justifyContent: 'center',
                  marginTop: 4,
                }}
              >
                {examples.map((name) => (
                  <Pressable
                    key={name}
                    onPress={() => setQuery(name)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 999,
                      borderColor: theme.border,
                      borderWidth: 1,
                      backgroundColor: theme.surface,
                    }}
                  >
                    <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700' }}>
                      {name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Ticket>
        </View>
      ) : results.length === 0 && !loading ? (
        <View style={{ padding: 20 }}>
          <Ticket padding="lg">
            <Text
              style={{
                color: theme.text,
                fontSize: 14,
                fontWeight: '800',
                textAlign: 'center',
              }}
            >
              No matches
            </Text>
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 12,
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              {t('search.noResults')}
            </Text>
          </Ticket>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 10 }}
          data={results}
          keyExtractor={(s) => s.place.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/stop/${encodeURIComponent(item.place.id)}`)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                gap: 12,
                padding: 14,
                borderRadius: 18,
                backgroundColor: theme.bgElevated,
                borderColor: theme.border,
                borderWidth: 1,
                alignItems: 'center',
                opacity: pressed ? 0.85 : 1,
                shadowColor: '#0f172a',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 10,
                elevation: 2,
              })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: theme.brand,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.place.type === 'station' || item.place.type === 'metro_station' ? (
                  <Train color="#fff" size={18} />
                ) : (
                  <MapPin color="#fff" size={18} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: theme.text,
                    fontWeight: '800',
                    fontSize: 14,
                    letterSpacing: -0.2,
                  }}
                >
                  {item.place.name}
                </Text>
                <Text
                  style={{
                    color: theme.textSubtle,
                    fontSize: 10,
                    fontWeight: '800',
                    letterSpacing: 1.2,
                    textTransform: 'uppercase',
                    marginTop: 2,
                  }}
                >
                  {item.place.type} · {item.place.countryCode}
                </Text>
              </View>
              <Text
                style={{
                  color: theme.textSubtle,
                  fontSize: 10,
                  fontWeight: '700',
                  fontVariant: ['tabular-nums'],
                }}
              >
                {Math.round(item.score * 100)}%
              </Text>
              <ChevronRight color={theme.textSubtle} size={16} />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
