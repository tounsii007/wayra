import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { AlertTriangle, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { requireBiometric } from '@/lib/biometric';
import { tap } from '@/lib/haptics';

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
      <Stack.Screen options={{ title: 'Delete account' }} />
      <View style={{ padding: 20, gap: 14 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: theme.status.severe + '12',
            padding: 14,
            borderRadius: 14,
          }}
        >
          <AlertTriangle color={theme.status.severe} size={20} />
          <Text style={{ color: theme.status.severe, flex: 1, fontWeight: '700', fontSize: 13 }}>
            This wipes your account, favorites, saved routes and notification subscriptions.
            Cannot be undone.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 14,
            padding: 4,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <ShieldAlert color={theme.textSubtle} size={16} style={{ marginLeft: 10 }} />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Confirm with your password"
            placeholderTextColor={theme.textSubtle}
            secureTextEntry
            style={{ flex: 1, color: theme.text, padding: 12 }}
          />
        </View>

        {error && (
          <Text style={{ color: theme.status.severe, fontSize: 13 }}>{error}</Text>
        )}

        <Pressable
          onPress={confirmDelete}
          disabled={busy || !password}
          style={{
            paddingVertical: 14,
            borderRadius: 999,
            backgroundColor: theme.status.severe,
            alignItems: 'center',
            opacity: busy || !password ? 0.5 : 1,
          }}
        >
          {busy ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '800' }}>Delete forever</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.back()} style={{ alignSelf: 'center', paddingVertical: 8 }}>
          <Text style={{ color: theme.textMuted, fontWeight: '700' }}>Cancel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
