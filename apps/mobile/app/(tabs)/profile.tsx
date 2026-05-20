import { ScrollView, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  CloudDownload,
  Heart,
  KeyRound,
  Moon,
  Sparkles,
  Sun,
  Trash2,
  User,
  Settings2,
  Palette,
  Languages,
  BellRing,
  ShieldCheck,
  Mail,
  ArrowRight,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/lib/auth-store';
import { useRecentStore } from '@/lib/recent-store';
import { usePrefsStore, type NotificationChannels } from '@/lib/prefs-store';
import { Toggle } from '@/components/Toggle';
import { registerForPush } from '@/lib/push';
import { api } from '@/lib/api';
import { localeMetadata } from '@wayra/i18n';
import { SUPPORTED_LOCALES } from '@wayra/shared';
import type { Locale, Theme } from '@wayra/types';
import { useTranslation } from 'react-i18next';
import { Ticket, Chip, Button, ScreenHeader } from '@/components/ui';

const channelLabels: Record<keyof NotificationChannels, string> = {
  delay: 'Delays',
  cancellation: 'Cancellations',
  platformChange: 'Platform changes',
  departureSoon: 'Departure soon',
  tightTransfer: 'Tight transfer',
  disruptionOnFavorite: 'Disruption on favourites',
  priceChange: 'Price changes',
  offlineDataStale: 'Offline data stale',
};

export default function ProfileScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const auth = useAuthStore();
  const recents = useRecentStore();
  const prefs = usePrefsStore();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}>
        <ScreenHeader
          chip="Account"
          chipIcon={<Settings2 color={theme.brand} size={10} />}
          chipTone="brand"
          title={t('nav.settings')}
        />

        {/* Account ticket */}
        <Ticket accent padding="lg">
          {auth.user ? (
            <Pressable
              onPress={() => router.push('/me')}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 20,
                  backgroundColor: theme.brand,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: theme.brand,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 10,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 22 }}>
                  {(auth.user.displayName ?? auth.user.email ?? '?').slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: theme.text,
                    fontWeight: '800',
                    fontSize: 18,
                    letterSpacing: -0.4,
                  }}
                >
                  {auth.user.displayName ?? 'Welcome'}
                </Text>
                <Text style={{ color: theme.textSubtle, fontSize: 12, marginTop: 2 }}>
                  {auth.user.email}
                </Text>
              </View>
              <ChevronRight color={theme.textSubtle} size={18} />
            </Pressable>
          ) : (
            <View style={{ gap: 12 }}>
              <View>
                <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16 }}>
                  Not signed in
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>
                  Sign in to sync favourites, saved trips and notifications across devices.
                </Text>
              </View>
              <Button
                label="Sign in"
                onPress={() => router.push('/login')}
                iconLeft={<KeyRound color="#fff" size={14} />}
                iconRight={<ArrowRight color="#fff" size={14} />}
              />
            </View>
          )}
        </Ticket>

        {/* Appearance */}
        <Section title="Appearance" Icon={Palette} tone="amber">
          <Row label="Theme">
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {(['light', 'dark', 'system'] as Theme[]).map((tk) => {
                const active = prefs.themeOverride === tk;
                return (
                  <Pressable
                    key={tk}
                    onPress={() => prefs.setTheme(tk)}
                    style={{
                      flexDirection: 'row',
                      gap: 4,
                      alignItems: 'center',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: active ? theme.brand : theme.surfaceMuted,
                    }}
                  >
                    {tk === 'light' && <Sun color={active ? '#fff' : theme.text} size={12} />}
                    {tk === 'dark' && <Moon color={active ? '#fff' : theme.text} size={12} />}
                    {tk === 'system' && <Sparkles color={active ? '#fff' : theme.text} size={12} />}
                    <Text
                      style={{
                        color: active ? '#fff' : theme.text,
                        fontSize: 11,
                        fontWeight: '800',
                      }}
                    >
                      {tk}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Row>

          <Row label="Language" Icon={Languages}>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 4,
                justifyContent: 'flex-end',
                maxWidth: 220,
              }}
            >
              {SUPPORTED_LOCALES.map((loc) => {
                const active = prefs.localeOverride === loc;
                return (
                  <Pressable
                    key={loc}
                    onPress={() => prefs.setLocale(loc as Locale)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: active ? theme.brand : theme.surfaceMuted,
                    }}
                  >
                    <Text
                      style={{
                        color: active ? '#fff' : theme.text,
                        fontSize: 10,
                        fontWeight: '800',
                      }}
                    >
                      {localeMetadata[loc as Locale].nativeLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Row>
        </Section>

        {/* Notifications */}
        <Section title="Notifications" Icon={BellRing} tone="amber">
          <Toggle
            label="Push"
            hint="Notifications for delays and disruptions."
            value={prefs.pushEnabled}
            onChange={async (v) => {
              prefs.setPushEnabled(v);
              if (v) await registerForPush();
              if (auth.token) {
                try {
                  await api.setNotificationPrefs({ pushEnabled: v });
                } catch {
                  /* offline */
                }
              }
            }}
          />
          <Toggle
            label="Email"
            hint="Daily digest and weekly summary."
            value={prefs.emailEnabled}
            onChange={async (v) => {
              prefs.setEmailEnabled(v);
              if (auth.token) {
                try {
                  await api.setNotificationPrefs({ emailEnabled: v });
                } catch {
                  /* ignore */
                }
              }
            }}
          />

          <View
            style={{
              marginTop: 8,
              padding: 12,
              borderRadius: 14,
              backgroundColor: theme.surfaceMuted,
              borderColor: theme.border,
              borderWidth: 1,
              gap: 8,
            }}
          >
            <Text
              style={{
                color: theme.textSubtle,
                fontSize: 10,
                fontWeight: '800',
                letterSpacing: 1.4,
                textTransform: 'uppercase',
              }}
            >
              Channels
            </Text>
            {(Object.keys(channelLabels) as Array<keyof NotificationChannels>).map((k) => (
              <Toggle
                key={k}
                label={channelLabels[k]}
                value={prefs.channels[k]}
                onChange={(v) => prefs.setChannel(k, v)}
              />
            ))}
          </View>
        </Section>

        {/* Data & privacy */}
        <Section title="Data & privacy" Icon={ShieldCheck} tone="brand">
          <Row
            label={`Recent searches`}
            hint={`${recents.recents.length} saved locally`}
            Icon={Mail}
          >
            <Pressable
              disabled={recents.recents.length === 0}
              onPress={() => recents.clear()}
              style={{
                flexDirection: 'row',
                gap: 4,
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: 1,
                opacity: recents.recents.length === 0 ? 0.4 : 1,
              }}
            >
              <Trash2 color={theme.textMuted} size={12} />
              <Text style={{ color: theme.text, fontSize: 11, fontWeight: '800' }}>Clear</Text>
            </Pressable>
          </Row>

          <RowLink
            label="Offline regions"
            hint="Downloaded cities for offline routing"
            Icon={CloudDownload}
            onPress={() => router.push('/offline')}
          />
          <RowLink
            label="Favourites"
            hint="Manage saved places and trips"
            Icon={Heart}
            onPress={() => router.push(auth.user ? '/me' : '/login')}
          />
        </Section>

        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <Chip label="Wayra v0.6 · OSM · GTFS-RT · MapLibre" tone="surface" size="sm" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  Icon,
  tone,
  children,
}: {
  title: string;
  Icon: typeof Settings2;
  tone: 'brand' | 'amber';
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const bg = tone === 'brand' ? theme.brand : theme.accent;
  return (
    <Ticket padding="none">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          padding: 16,
          borderBottomColor: theme.border,
          borderBottomWidth: 1,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon color="#fff" size={14} />
        </View>
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.3 }}>
          {title}
        </Text>
      </View>
      <View style={{ padding: 16, gap: 14 }}>{children}</View>
    </Ticket>
  );
}

function Row({
  label,
  hint,
  Icon,
  children,
}: {
  label: string;
  hint?: string;
  Icon?: typeof Settings2;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flex: 1 }}>
        {Icon && <Icon color={theme.textMuted} size={14} />}
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>{label}</Text>
          {hint && (
            <Text style={{ color: theme.textSubtle, fontSize: 11, marginTop: 2 }}>{hint}</Text>
          )}
        </View>
      </View>
      {children}
    </View>
  );
}

function RowLink({
  label,
  hint,
  Icon,
  onPress,
}: {
  label: string;
  hint?: string;
  Icon: typeof Settings2;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: theme.surfaceMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon color={theme.textMuted} size={14} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>{label}</Text>
        {hint && (
          <Text style={{ color: theme.textSubtle, fontSize: 11, marginTop: 2 }}>{hint}</Text>
        )}
      </View>
      <ChevronRight color={theme.textSubtle} size={16} />
    </Pressable>
  );
}
