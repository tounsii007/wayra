import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Heart, LogOut, Sparkles, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';

interface Favorite {
  id: string;
  kind: 'home' | 'work' | 'custom';
  label: string | null;
  placeId: string | null;
}
interface SavedRoute {
  id: string;
  label: string | null;
}

export default function MeScreen() {
  const theme = useTheme();
  const { user, token, clear } = useAuthStore();
  const [favs, setFavs] = useState<Favorite[]>([]);
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    Promise.all([api.favorites(), api.savedRoutes()])
      .then(([f, r]) => {
        setFavs(f);
        setRoutes(r);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [token]);

  async function removeFavorite(id: string) {
    await api.removeFavorite(id);
    setFavs((x) => x.filter((f) => f.id !== id));
  }

  if (!user) return null;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <Stack.Screen options={{ title: 'Profile' }} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>
                {(user.displayName ?? user.email ?? '?').slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16 }}>
                {user.displayName ?? 'Traveler'}
              </Text>
              <Text style={{ color: theme.textSubtle, fontSize: 12 }}>{user.email}</Text>
            </View>
          </View>
          <Pressable
            onPress={() => {
              clear();
              router.replace('/');
            }}
            style={{
              flexDirection: 'row',
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderWidth: 1,
              alignItems: 'center',
            }}
          >
            <LogOut color={theme.text} size={14} />
            <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>Log out</Text>
          </Pressable>
        </View>

        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16, marginTop: 8 }}>
          Favorites
        </Text>
        {loading ? (
          <ActivityIndicator color={theme.brand} />
        ) : favs.length === 0 ? (
          <Text style={{ color: theme.textMuted, fontSize: 13 }}>
            No favorites yet. Save Home, Work or any place.
          </Text>
        ) : (
          favs.map((f) => (
            <View
              key={f.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                padding: 12,
                borderRadius: 14,
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: 1,
              }}
            >
              <Heart color={theme.status.severe} size={14} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '700' }}>
                  {f.label ?? f.placeId ?? '—'}
                </Text>
                <Text
                  style={{
                    color: theme.textSubtle,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                  }}
                >
                  {f.kind}
                </Text>
              </View>
              <Pressable onPress={() => removeFavorite(f.id)} hitSlop={10}>
                <Trash2 color={theme.textSubtle} size={16} />
              </Pressable>
            </View>
          ))
        )}

        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16, marginTop: 8 }}>
          Saved routes
        </Text>
        {!loading && routes.length === 0 && (
          <Text style={{ color: theme.textMuted, fontSize: 13 }}>
            No saved routes. Plan a trip and tap Save.
          </Text>
        )}
        {routes.map((r) => (
          <View
            key={r.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: 12,
              borderRadius: 14,
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderWidth: 1,
            }}
          >
            <Sparkles color={theme.brand} size={14} />
            <Text style={{ color: theme.text, fontWeight: '700', flex: 1 }}>{r.label ?? '—'}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
