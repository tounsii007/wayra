import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Lock, Mail, User, Eye, EyeOff, KeyRound, ArrowRight, Sparkles } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Ticket, Button, Chip } from '@/components/ui';

type Mode = 'login' | 'signup';

export default function LoginScreen() {
  const theme = useTheme();
  const setSession = useAuthStore((s) => s.setSession);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
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
      <Stack.Screen options={{ title: 'Sign in', headerShown: false }} />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 18 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand intro */}
        <View style={{ alignItems: 'center', paddingTop: 12, gap: 12 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: theme.brand,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: theme.brand,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
            }}
          >
            <Sparkles color="#fff" size={28} />
          </View>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Chip label="Welcome" tone="amber" icon={<Sparkles color={theme.accent} size={10} />} />
            <Text
              style={{
                color: theme.text,
                fontSize: 28,
                fontWeight: '800',
                letterSpacing: -1,
                textAlign: 'center',
              }}
            >
              {mode === 'login' ? 'Welcome back' : 'Join Wayra'}
            </Text>
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 14,
                textAlign: 'center',
                paddingHorizontal: 20,
                lineHeight: 20,
              }}
            >
              {mode === 'login'
                ? 'Sign in to sync your trips and favourites.'
                : 'Create an account to save trips and get delay alerts.'}
            </Text>
          </View>
        </View>

        {/* Auth ticket */}
        <Ticket accent padding="lg">
          <View style={{ gap: 14 }}>
            {/* Mode toggle */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: theme.surfaceMuted,
                borderRadius: 999,
                padding: 4,
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
                    backgroundColor: mode === m ? theme.bgElevated : 'transparent',
                    alignItems: 'center',
                    ...(mode === m && {
                      shadowColor: '#0f172a',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 4,
                      elevation: 2,
                    }),
                  }}
                >
                  <Text
                    style={{
                      color: mode === m ? theme.text : theme.textMuted,
                      fontWeight: '700',
                      fontSize: 13,
                    }}
                  >
                    {m === 'login' ? 'Sign in' : 'Create account'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Fields */}
            {mode === 'signup' && (
              <Field icon={<User color={theme.textSubtle} size={16} />} label="Display name">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={theme.textSubtle}
                  autoComplete="name"
                  style={{ flex: 1, color: theme.text, padding: 12, fontSize: 14 }}
                />
              </Field>
            )}

            <Field icon={<Mail color={theme.textSubtle} size={16} />} label="Email">
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={theme.textSubtle}
                autoComplete="email"
                keyboardType="email-address"
                autoCapitalize="none"
                style={{ flex: 1, color: theme.text, padding: 12, fontSize: 14 }}
              />
            </Field>

            <Field icon={<Lock color={theme.textSubtle} size={16} />} label="Password">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={mode === 'signup' ? '≥ 8 characters' : '••••••••'}
                placeholderTextColor={theme.textSubtle}
                secureTextEntry={!showPw}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                style={{ flex: 1, color: theme.text, padding: 12, fontSize: 14 }}
              />
              <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={10} style={{ padding: 8 }}>
                {showPw ? (
                  <EyeOff color={theme.textSubtle} size={14} />
                ) : (
                  <Eye color={theme.textSubtle} size={14} />
                )}
              </Pressable>
            </Field>

            {error && (
              <View
                style={{
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: theme.status.severe + '15',
                  borderColor: theme.status.severe + '40',
                  borderWidth: 1,
                }}
              >
                <Text style={{ color: theme.status.severe, fontSize: 13 }}>{error}</Text>
              </View>
            )}

            <Button
              label={mode === 'signup' ? 'Create account' : 'Sign in'}
              onPress={submit}
              loading={busy}
              iconRight={!busy ? <ArrowRight color="#fff" size={14} /> : undefined}
              fullWidth
            />

            {/* Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
              <Text
                style={{
                  color: theme.textSubtle,
                  fontSize: 10,
                  fontWeight: '800',
                  letterSpacing: 1.4,
                  textTransform: 'uppercase',
                }}
              >
                or
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
            </View>

            <Button
              label="Sign in with a passkey"
              variant="surface"
              iconLeft={<KeyRound color={theme.text} size={14} />}
              fullWidth
            />
          </View>
        </Ticket>

        {/* Skip */}
        <Pressable onPress={() => router.replace('/(tabs)')}>
          <Text
            style={{
              color: theme.textSubtle,
              fontSize: 12,
              fontWeight: '700',
              textAlign: 'center',
            }}
          >
            Continue without account →
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
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
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.bgElevated,
          borderColor: theme.border,
          borderWidth: 1,
          borderRadius: 14,
          paddingLeft: 12,
        }}
      >
        {icon}
        {children}
      </View>
    </View>
  );
}
