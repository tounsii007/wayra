import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Search, X, MapPin } from 'lucide-react-native';
import type { PlaceSuggestion } from '@wayra/types';
import { useTheme } from '@/theme';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';

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

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <Stack.Screen options={{ title: 'Search' }} />
      <View style={{ padding: 16, gap: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 16,
            paddingHorizontal: 12,
          }}
        >
          <Search color={theme.textSubtle} size={18} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder={t('search.placeholder')}
            placeholderTextColor={theme.textSubtle}
            style={{ flex: 1, color: theme.text, padding: 12, fontSize: 15 }}
          />
          {query && (
            <Pressable onPress={() => setQuery('')} hitSlop={10}>
              <X color={theme.textSubtle} size={16} />
            </Pressable>
          )}
        </View>
      </View>

      {loading && results.length === 0 ? (
        <ActivityIndicator color={theme.brand} style={{ marginTop: 24 }} />
      ) : results.length === 0 ? (
        <Text style={{ padding: 16, color: theme.textMuted, fontSize: 13 }}>
          {query ? t('search.noResults') : 'Type a city, station or address.'}
        </Text>
      ) : (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 8 }}
          data={results}
          keyExtractor={(s) => s.place.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/stop/${encodeURIComponent(item.place.id)}`)}
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
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: theme.brand + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MapPin color={theme.brand} size={14} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '700' }}>{item.place.name}</Text>
                <Text style={{ color: theme.textSubtle, fontSize: 12 }}>
                  {item.place.type} · {item.place.countryCode}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
