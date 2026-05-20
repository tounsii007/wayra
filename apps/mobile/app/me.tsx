import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import {
  Heart,
  LogOut,
  Sparkles,
  Trash2,
  Home,
  Briefcase,
  MapPin,
  Bookmark,
  Train,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { Ticket, Chip, Stat } from '@/components/ui';

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

  const initial = (user.displayName ?? user.email ?? '?').slice(0, 1).toUpperCase();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <Stack.Screen options={{ title: 'Profile', headerShown: false }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 18 }}>
        {/* Identity ticket */}
        <Ticket accent padding="lg">
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 22,
                  backgroundColor: theme.brand,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: theme.brand,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.45,
                  shadowRadius: 14,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 28 }}>{initial}</Text>
                {/* Online pip */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 16,
                    height: 16,
                    borderRadius: 999,
                    backgroundColor: theme.status.onTime,
                    borderWidth: 3,
                    borderColor: theme.bgElevated,
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Chip
                  label="Traveler"
                  tone="brand"
                  size="sm"
                  icon={<Sparkles color={theme.brand} size={10} />}
                />
                <Text
                  style={{
                    color: theme.text,
                    fontWeight: '800',
                    fontSize: 20,
                    letterSpacing: -0.4,
                    marginTop: 6,
                  }}
                >
                  {user.displayName ?? 'Welcome'}
                </Text>
                <Text
                  style={{
                    color: theme.textSubtle,
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 1.2,
                    textTransform: 'uppercase',
                    marginTop: 2,
                  }}
                >
                  {user.email}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                clear();
                router.replace('/');
              }}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 999,
                borderColor: theme.border,
                borderWidth: 1,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <LogOut color={theme.textMuted} size={14} />
            </Pressable>
          </View>

          {/* Stats row */}
          <View
            style={{
              flexDirection: 'row',
              gap: 16,
              justifyContent: 'space-between',
              marginTop: 18,
              paddingTop: 14,
              borderTopColor: theme.border,
              borderTopWidth: 1,
            }}
          >
            <Stat label="Favourites" value={loading ? '—' : String(favs.length)} tone="brand" />
            <Stat label="Saved trips" value={loading ? '—' : String(routes.length)} tone="amber" />
            <Stat label="Member" value="2024" tone="text" />
          </View>
        </Ticket>

        {/* Favourites */}
        <View style={{ gap: 12 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <Chip
                label="Saved places"
                tone="amber"
                icon={<Heart color={theme.accent} size={10} />}
              />
              <Text
                style={{
                  color: theme.text,
                  fontSize: 22,
                  fontWeight: '800',
                  letterSpacing: -0.6,
                  marginTop: 10,
                }}
              >
                Favourites
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={{ gap: 8 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    height: 64,
                    borderRadius: 18,
                    backgroundColor: theme.surfaceMuted,
                    opacity: 0.6,
                  }}
                />
              ))}
            </View>
          ) : favs.length === 0 ? (
            <Ticket padding="lg">
              <View style={{ alignItems: 'center', gap: 6 }}>
                <Heart color={theme.status.severe} size={28} />
                <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14 }}>
                  No favourites yet
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center' }}>
                  Save Home, Work or any place to find it quickly later.
                </Text>
              </View>
            </Ticket>
          ) : (
            favs.map((f) => {
              const Icon = f.kind === 'home' ? Home : f.kind === 'work' ? Briefcase : MapPin;
              const bg =
                f.kind === 'home'
                  ? theme.brand
                  : f.kind === 'work'
                    ? theme.accent
                    : theme.accentLegacy.violet;
              return (
                <View
                  key={f.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 14,
                    borderRadius: 18,
                    backgroundColor: theme.bgElevated,
                    borderColor: theme.border,
                    borderWidth: 1,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: bg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon color="#fff" size={18} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14 }}>
                      {f.label ?? f.placeId ?? '—'}
                    </Text>
                    <Text
                      style={{
                        color: theme.textSubtle,
                        fontSize: 10,
                        letterSpacing: 1.2,
                        textTransform: 'uppercase',
                        fontWeight: '800',
                        marginTop: 2,
                      }}
                    >
                      {f.kind}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => removeFavorite(f.id)}
                    hitSlop={10}
                    style={{ padding: 8 }}
                  >
                    <Trash2 color={theme.textSubtle} size={16} />
                  </Pressable>
                </View>
              );
            })
          )}
        </View>

        {/* Saved trips */}
        <View style={{ gap: 12 }}>
          <View>
            <Chip
              label="Saved trips"
              tone="brand"
              icon={<Bookmark color={theme.brand} size={10} />}
            />
            <Text
              style={{
                color: theme.text,
                fontSize: 22,
                fontWeight: '800',
                letterSpacing: -0.6,
                marginTop: 10,
              }}
            >
              Recent routes
            </Text>
          </View>

          {!loading && routes.length === 0 && (
            <Ticket padding="lg">
              <View style={{ alignItems: 'center', gap: 6 }}>
                <Bookmark color={theme.brand} size={28} />
                <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14 }}>
                  No saved trips
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center' }}>
                  Plan a trip and tap Save to add it here.
                </Text>
              </View>
            </Ticket>
          )}

          {routes.map((r) => (
            <Pressable
              key={r.id}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                borderRadius: 18,
                backgroundColor: theme.bgElevated,
                borderColor: theme.border,
                borderWidth: 1,
                opacity: pressed ? 0.85 : 1,
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
                <Train color="#fff" size={18} />
              </View>
              <Text
                style={{ color: theme.text, fontWeight: '800', flex: 1, fontSize: 14 }}
                numberOfLines={1}
              >
                {r.label ?? '—'}
              </Text>
              <ChevronRight color={theme.textSubtle} size={16} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
