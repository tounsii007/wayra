import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { MapPin, X, Clock } from 'lucide-react-native';
import type { Place, PlaceSuggestion } from '@wayra/types';
import { useTheme } from '@/theme';
import { useRecentStore } from '@/lib/recent-store';
import { api } from '@/lib/api';

interface Props {
  value: Place | null;
  onChange: (place: Place | null) => void;
  placeholder: string;
  testID?: string;
}

export function PlacesAutocomplete({ value, onChange, placeholder, testID }: Props) {
  const theme = useTheme();
  const [query, setQuery] = useState(value?.name ?? '');
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const recents = useRecentStore((s) => s.recents);
  const pushRecent = useRecentStore((s) => s.push);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value?.name ?? '');
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.search(query, { limit: 8 });
        setSuggestions(res.suggestions);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 160);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function pick(p: Place | null) {
    onChange(p);
    setQuery(p?.name ?? '');
    setOpen(false);
    if (p) pushRecent(p);
  }

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.surfaceMuted,
          borderRadius: 14,
          paddingHorizontal: 12,
        }}
      >
        <MapPin color={theme.textSubtle} size={18} />
        <TextInput
          testID={testID}
          value={query}
          onChangeText={(v) => {
            setQuery(v);
            setOpen(true);
            if (v === '') onChange(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          placeholderTextColor={theme.textSubtle}
          style={{
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 8,
            color: theme.text,
            fontSize: 15,
          }}
        />
        {(query.length > 0 || value) && (
          <Pressable onPress={() => pick(null)} hitSlop={10}>
            <X color={theme.textSubtle} size={16} />
          </Pressable>
        )}
      </View>

      {open && (query.length > 0 || recents.length > 0) && (
        <View
          style={{
            position: 'absolute',
            top: 56,
            left: 0,
            right: 0,
            zIndex: 20,
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 16,
            maxHeight: 280,
            overflow: 'hidden',
          }}
        >
          {loading && suggestions.length === 0 && (
            <View style={{ padding: 12, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <ActivityIndicator color={theme.brand} size="small" />
              <Text style={{ color: theme.textMuted, fontSize: 13 }}>Searching…</Text>
            </View>
          )}
          {!loading && suggestions.length === 0 && query.length === 0 && recents.length > 0 && (
            <View>
              <Text
                style={{
                  paddingHorizontal: 12,
                  paddingTop: 10,
                  fontSize: 10,
                  fontWeight: '800',
                  letterSpacing: 0.6,
                  color: theme.textSubtle,
                  textTransform: 'uppercase',
                }}
              >
                Recent
              </Text>
              <FlatList
                data={recents}
                keyboardShouldPersistTaps="handled"
                keyExtractor={(p) => p.id}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => pick(item)}
                    style={{ flexDirection: 'row', gap: 10, padding: 12 }}
                  >
                    <Clock color={theme.textSubtle} size={14} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>
                        {item.name}
                      </Text>
                      <Text style={{ color: theme.textSubtle, fontSize: 11 }}>{item.countryCode}</Text>
                    </View>
                  </Pressable>
                )}
              />
            </View>
          )}
          {!loading && suggestions.length === 0 && query.length > 0 && (
            <Text style={{ padding: 12, color: theme.textMuted, fontSize: 13 }}>No matches.</Text>
          )}
          {suggestions.length > 0 && (
            <FlatList
              data={suggestions}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(s) => s.place.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => pick(item.place)}
                  style={{ flexDirection: 'row', gap: 10, padding: 12 }}
                >
                  <MapPin color={theme.brand} size={14} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>
                      {item.place.name}
                    </Text>
                    <Text style={{ color: theme.textSubtle, fontSize: 11 }}>
                      {item.place.type} · {item.place.countryCode}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}
