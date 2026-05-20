import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { AlertTriangle, ShieldAlert, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { requireBiometric } from '@/lib/biometric';
import { tap } from '@/lib/haptics';
import { Ticket, Chip } from '@/components/ui';

export default function DeleteAccountScreen() {
  const theme = useTheme();
  const clear = useAuthStore((s) => s.clear);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    setError(null);
    const ok = await requireBiometric('Confirm with biometrics to delete your account');
    if (!ok) {
      setError('Biometric check cancelled.');
      return;
    }
    setBusy(true);
    try {
      await api.deleteAccount({ password });
      tap('warning');
      clear();
      router.replace('/');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ padding: 20, gap: 18 }}>
        {/* Back */}
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <ArrowLeft color={theme.text} size={18} />
          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>Back</Text>
        </Pressable>

        {/* Header */}
        <View>
          <Chip
            label="Danger zone"
            tone="danger"
            icon={<ShieldAlert color={theme.status.severe} size={10} />}
          />
          <Text
            style={{
              color: theme.text,
              fontSize: 28,
              fontWeight: '800',
              letterSpacing: -0.8,
              marginTop: 10,
            }}
          >
            Delete account
          </Text>
        </View>

        {/* Warning */}
        <Ticket padding="lg">
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: theme.status.severe + '20',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle color={theme.status.severe} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: theme.status.severe,
                  fontWeight: '800',
                  fontSize: 14,
                }}
              >
                This action cannot be undone
              </Text>
              <Text
                style={{
                  color: theme.textMuted,
                  fontSize: 12,
                  lineHeight: 18,
                  marginTop: 4,
                }}
              >
                Deletes your account, favourites, saved trips, push subscriptions and any
                notification preferences. Data is wiped immediately and irrecoverably.
              </Text>
            </View>
          </View>
        </Ticket>

        {/* Password confirm */}
        <View>
          <Text
            style={{
              color: theme.textSubtle,
              fontSize: 10,
              fontWeight: '800',
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Confirm with password
          </Text>
          <View
            style={{
              backgroundColor: theme.bgElevated,
              borderColor: theme.border,
              borderWidth: 1,
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              paddingLeft: 12,
            }}
          >
            <ShieldAlert color={theme.textSubtle} size={16} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.textSubtle}
              secureTextEntry
              style={{ flex: 1, color: theme.text, padding: 12, fontSize: 14 }}
            />
          </View>
        </View>

        {error && (
          <View
            style={{
              backgroundColor: theme.status.severe + '12',
              borderColor: theme.status.severe + '40',
              borderWidth: 1,
              padding: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: theme.status.severe, fontSize: 13 }}>{error}</Text>
          </View>
        )}

        <Pressable
          onPress={confirmDelete}
          disabled={busy || !password}
          style={({ pressed }) => ({
            paddingVertical: 14,
            borderRadius: 999,
            backgroundColor: theme.status.severe,
            alignItems: 'center',
            opacity: busy || !password ? 0.4 : pressed ? 0.85 : 1,
            shadowColor: theme.status.severe,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 14,
            elevation: 4,
          })}
        >
          {busy ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '800', letterSpacing: -0.2 }}>
              Delete forever
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={{ alignSelf: 'center', paddingVertical: 8 }}
        >
          <Text
            style={{
              color: theme.textMuted,
              fontWeight: '700',
              fontSize: 13,
              letterSpacing: 0.4,
            }}
          >
            Cancel
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
