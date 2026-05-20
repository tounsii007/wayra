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

const channelLabels: Record<keyof NotificationChannels, string> = {
  delay: 'Delays',
  cancellation: 'Cancellations',
  platformChange: 'Platform changes',
  departureSoon: 'Departure soon',
  tightTransfer: 'Tight transfer',
  disruptionOnFavorite: 'Disruption on favorites',
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
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <Text style={{ color: theme.text, fontSize: 26, fontWeight: '800' }}>
          {t('nav.settings')}
        </Text>

        <Section title="Account">
          {auth.user ? (
            <Pressable
              onPress={() => router.push('/me')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: theme.brand,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User color="#fff" size={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '800' }}>
                  {auth.user.displayName ?? 'Signed in'}
                </Text>
                <Text style={{ color: theme.textSubtle, fontSize: 12 }}>{auth.user.email}</Text>
              </View>
              <Heart color={theme.status.severe} size={14} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.push('/login')}
              style={{
                flexDirection: 'row',
                gap: 8,
                alignItems: 'center',
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: theme.brand,
                alignSelf: 'flex-start',
              }}
            >
              <KeyRound color="#fff" size={14} />
              <Text style={{ color: '#fff', fontWeight: '800' }}>Sign in</Text>
            </Pressable>
          )}
        </Section>

        <Section title="Appearance">
          <Row label="Theme">
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['light', 'dark', 'system'] as Theme[]).map((tk) => (
                <Pressable
                  key={tk}
                  onPress={() => prefs.setTheme(tk)}
                  style={{
                    flexDirection: 'row',
                    gap: 4,
                    alignItems: 'center',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: prefs.themeOverride === tk ? theme.brand : theme.surfaceMuted,
                  }}
                >
                  {tk === 'light' && (
                    <Sun color={prefs.themeOverride === tk ? '#fff' : theme.text} size={11} />
                  )}
                  {tk === 'dark' && (
                    <Moon color={prefs.themeOverride === tk ? '#fff' : theme.text} size={11} />
                  )}
                  {tk === 'system' && (
                    <Sparkles color={prefs.themeOverride === tk ? '#fff' : theme.text} size={11} />
                  )}
                  <Text
                    style={{
                      color: prefs.themeOverride === tk ? '#fff' : theme.text,
                      fontSize: 11,
                      fontWeight: '800',
                    }}
                  >
                    {tk}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Row>
          <Row label="Language">
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 4,
                justifyContent: 'flex-end',
                maxWidth: 200,
              }}
            >
              {SUPPORTED_LOCALES.map((loc) => (
                <Pressable
                  key={loc}
                  onPress={() => prefs.setLocale(loc as Locale)}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor:
                      prefs.localeOverride === loc ? theme.brand : theme.surfaceMuted,
                  }}
                >
                  <Text
                    style={{
                      color: prefs.localeOverride === loc ? '#fff' : theme.text,
                      fontSize: 10,
                      fontWeight: '800',
                    }}
                  >
                    {localeMetadata[loc as Locale].nativeLabel}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Row>
        </Section>

        <Section title="Notifications">
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
                  /* offline: local prefs still toggled */
                }
              }
            }}
          />
          <Toggle
            label="Email"
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
          <Text
            style={{
              color: theme.textSubtle,
              fontSize: 10,
              fontWeight: '800',
              letterSpacing: 0.6,
              marginTop: 6,
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
        </Section>

        <Section title="Data & privacy">
          <Row label={`Recent searches (${recents.recents.length})`}>
            <Pressable
              disabled={recents.recents.length === 0}
              onPress={() => recents.clear()}
              style={{
                flexDirection: 'row',
                gap: 4,
                alignItems: 'center',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: theme.surfaceMuted,
                opacity: recents.recents.length === 0 ? 0.4 : 1,
              }}
            >
              <Trash2 color={theme.text} size={11} />
              <Text style={{ color: theme.text, fontSize: 11, fontWeight: '800' }}>Clear</Text>
            </Pressable>
          </Row>
          <Pressable
            onPress={() => router.push('/offline')}
            style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 8 }}
          >
            <CloudDownload color={theme.text} size={16} />
            <Text style={{ color: theme.text, fontWeight: '700', flex: 1 }}>Offline regions</Text>
            <Text style={{ color: theme.brand, fontWeight: '800', fontSize: 12 }}>Manage</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push(auth.user ? '/me' : '/login')}
            style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 8 }}
          >
            <Heart color={theme.status.severe} size={16} />
            <Text style={{ color: theme.text, fontWeight: '700', flex: 1 }}>Favorites</Text>
            <Text style={{ color: theme.brand, fontWeight: '800', fontSize: 12 }}>Open</Text>
          </Pressable>
        </Section>

        <Text
          style={{
            color: theme.textSubtle,
            fontSize: 11,
            paddingVertical: 12,
            textAlign: 'center',
          }}
        >
          Wayra v0.4 · Data: OSM, GTFS / GTFS-RT, MapLibre tiles.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
        gap: 10,
      }}
    >
      <Text
        style={{
          color: theme.textSubtle,
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
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
      <Text style={{ color: theme.text, fontWeight: '700', flex: 1 }}>{label}</Text>
      {children}
    </View>
  );
}
