import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Lock, Mail, User } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

type Mode = 'login' | 'signup';

export default function LoginScreen() {
  const theme = useTheme();
  const setSession = useAuthStore((s) => s.setSession);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const result =
        mode === 'signup'
          ? await api.signup({ email, password, displayName: name || undefined })
          : await api.login({ email, password });
      setSession(result.accessToken, result.user, result.refreshToken);
      router.replace('/(tabs)/profile');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <Stack.Screen options={{ title: 'Sign in' }} />
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ color: theme.text, fontSize: 24, fontWeight: '800' }}>Welcome to Wayra</Text>
        <Text style={{ color: theme.textMuted, fontSize: 13 }}>
          Sign in to sync favorites, saved routes and notifications across devices.
        </Text>

        <View
          style={{
            flexDirection: 'row',
            backgroundColor: theme.surfaceMuted,
            borderRadius: 999,
            padding: 4,
            marginTop: 8,
          }}
        >
          {(['login', 'signup'] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: mode === m ? theme.surface : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: mode === m ? theme.text : theme.textMuted, fontWeight: '700' }}>
                {m === 'login' ? 'Sign in' : 'Create account'}
              </Text>
            </Pressable>
          ))}
        </View>

        {mode === 'signup' && (
          <Field icon={<User color={theme.textSubtle} size={16} />}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Display name"
              placeholderTextColor={theme.textSubtle}
              autoComplete="name"
              style={{ flex: 1, color: theme.text, padding: 12 }}
            />
          </Field>
        )}

        <Field icon={<Mail color={theme.textSubtle} size={16} />}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={theme.textSubtle}
            autoComplete="email"
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ flex: 1, color: theme.text, padding: 12 }}
          />
        </Field>

        <Field icon={<Lock color={theme.textSubtle} size={16} />}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={mode === 'signup' ? 'Choose a password (≥8 chars)' : 'Password'}
            placeholderTextColor={theme.textSubtle}
            secureTextEntry
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            style={{ flex: 1, color: theme.text, padding: 12 }}
          />
        </Field>

        {error && (
          <View
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: theme.status.severe + '15',
            }}
          >
            <Text style={{ color: theme.status.severe, fontSize: 13 }}>{error}</Text>
          </View>
        )}

        <Pressable
          onPress={submit}
          disabled={busy}
          style={{
            flexDirection: 'row',
            gap: 8,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 14,
            borderRadius: 999,
            backgroundColor: theme.brand,
            opacity: busy ? 0.6 : 1,
            marginTop: 4,
          }}
        >
          {busy && <ActivityIndicator color="#fff" size="small" />}
          <Text style={{ color: '#fff', fontWeight: '800' }}>
            {mode === 'signup' ? 'Create account' : 'Sign in'}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.replace('/(tabs)')}>
          <Text
            style={{
              color: theme.textSubtle,
              fontSize: 12,
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            Continue without account
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.surfaceMuted,
        borderRadius: 14,
        paddingLeft: 12,
      }}
    >
      {icon}
      {children}
    </View>
  );
}
