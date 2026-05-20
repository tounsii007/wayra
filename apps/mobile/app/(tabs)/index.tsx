import { useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowDownUp,
  ArrowRight,
  Briefcase,
  Bus,
  Home,
  Loader2,
  Locate,
  Search,
  Ticket as TicketIcon,
  Train,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react-native';
import type { Place } from '@wayra/types';
import { useTheme } from '@/theme';
import { PlacesAutocomplete } from '@/components/PlacesAutocomplete';
import { DemoBadge } from '@/components/DemoBadge';
import { Ticket, Button, Chip, Stat, ScreenHeader, SectionHeader, Pip } from '@/components/ui';
import { api } from '@/lib/api';
import { useGeolocation } from '@/hooks/useGeolocation';

interface StatusItem {
  city: string;
  status: 'ok' | 'minor' | 'major';
  note: string;
}

export default function HomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [from, setFrom] = useState<Place | null>(null);
  const [to, setTo] = useState<Place | null>(null);
  const [status, setStatus] = useState<StatusItem[]>([]);

  useEffect(() => {
    api
      .networkStatus()
      .then((r) => setStatus(r.items.slice(0, 3)))
      .catch(() => undefined);
  }, []);

  function plan() {
    const params = new URLSearchParams();
    if (from) params.set('from', from.id);
    if (to) params.set('to', to.id);
    router.push(`/plan?${params.toString()}`);
  }

  function swap() {
    setFrom(to);
    setTo(from);
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ---- Hero -------------------------------------------------- */}
        <ScreenHeader
          chip={t('brand.tagline')}
          chipIcon={<Pip size={6} color={theme.status.onTime} />}
          chipTone="amber"
          title={t('home.hero.title')}
        />

        {/* ---- Search ticket ---------------------------------------- */}
        <Ticket accent padding="md" style={{ zIndex: 10 }}>
          <View style={{ gap: 10 }}>
            <View style={{ zIndex: 30 }}>
              <PlacesAutocomplete
                value={from}
                onChange={setFrom}
                placeholder={t('home.hero.fromPlaceholder')}
                testID="home-from"
              />
            </View>

            {/* Swap coin */}
            <View style={{ alignItems: 'center', marginTop: -2, marginBottom: -2 }}>
              <Pressable
                onPress={swap}
                hitSlop={12}
                style={({ pressed }) => ({
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  backgroundColor: theme.bgElevated,
                  borderWidth: 1,
                  borderColor: theme.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ scale: pressed ? 0.92 : 1 }],
                  shadowColor: '#0f172a',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  elevation: 2,
                })}
              >
                <ArrowDownUp color={theme.textMuted} size={14} />
              </Pressable>
            </View>

            <View style={{ zIndex: 20 }}>
              <PlacesAutocomplete
                value={to}
                onChange={setTo}
                placeholder={t('home.hero.toPlaceholder')}
                testID="home-to"
              />
            </View>

            <Button
              label={t('home.hero.plan')}
              onPress={plan}
              disabled={!from || !to}
              iconRight={<ArrowRight color="#fff" size={16} />}
              fullWidth
              style={{ marginTop: 8 }}
            />

            <View style={{ flexDirection: 'row', gap: 16, justifyContent: 'space-between' }}>
              <Pressable
                onPress={() => router.push('/search')}
                style={{ flexDirection: 'row', gap: 6, alignItems: 'center', paddingVertical: 4 }}
              >
                <Search color={theme.brand} size={14} />
                <Text style={{ color: theme.brand, fontSize: 12, fontWeight: '700' }}>
                  Full search
                </Text>
              </Pressable>
              <UseLocationButton
                onCoords={(c) => router.push(`/search?lat=${c.lat}&lng=${c.lng}`)}
              />
            </View>
          </View>
        </Ticket>

        {/* ---- Quick actions ---------------------------------------- */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {[
            {
              label: t('home.quickActions.home'),
              sub: 'Get me home',
              Icon: Home,
              tone: 'brand' as const,
              action: () => router.push('/me'),
            },
            {
              label: t('home.quickActions.work'),
              sub: 'Daily commute',
              Icon: Briefcase,
              tone: 'amber' as const,
              action: () => router.push('/me'),
            },
            {
              label: t('home.quickActions.findStation'),
              sub: 'Search stations',
              Icon: Train,
              tone: 'brand' as const,
              action: () => router.push('/search'),
            },
            {
              label: t('home.quickActions.findStop'),
              sub: 'Nearby stops',
              Icon: Bus,
              tone: 'violet' as const,
              action: () => router.push('/search'),
            },
          ].map(({ label, sub, Icon, tone, action }) => {
            const bg =
              tone === 'brand'
                ? theme.brand
                : tone === 'amber'
                  ? theme.accent
                  : theme.accentLegacy.violet;
            return (
              <Pressable
                key={label}
                onPress={action}
                style={({ pressed }) => ({
                  flexBasis: '47%',
                  flexGrow: 1,
                  backgroundColor: theme.bgElevated,
                  borderColor: theme.border,
                  borderWidth: 1,
                  borderRadius: 18,
                  padding: 14,
                  gap: 12,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  shadowColor: '#0f172a',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                })}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    backgroundColor: bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: bg,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.4,
                    shadowRadius: 6,
                  }}
                >
                  <Icon color="#fff" size={18} />
                </View>
                <View>
                  <Text style={{ color: theme.text, fontWeight: '800', fontSize: 13 }}>
                    {label}
                  </Text>
                  <Text style={{ color: theme.textSubtle, fontSize: 11, marginTop: 2 }}>{sub}</Text>
                </View>
              </Pressable>
            );
          })}

          {/* Wide compare-fares tile */}
          <Pressable
            onPress={() => router.push('/plan')}
            style={({ pressed }) => ({
              flexBasis: '100%',
              backgroundColor: theme.bgElevated,
              borderColor: theme.border,
              borderWidth: 1,
              borderRadius: 18,
              padding: 16,
              gap: 4,
              flexDirection: 'row',
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
              shadowColor: '#0f172a',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            })}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                backgroundColor: theme.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TicketIcon color="#fff" size={18} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14 }}>
                {t('home.quickActions.compareFares')}
              </Text>
              <Text style={{ color: theme.textSubtle, fontSize: 11, marginTop: 2 }}>
                Compare prices across operators
              </Text>
            </View>
            <ArrowRight color={theme.textSubtle} size={16} />
          </Pressable>
        </View>

        {/* ---- Live status section ---------------------------------- */}
        <View style={{ gap: 12 }}>
          <SectionHeader
            chip="Realtime"
            chipIcon={<Pip size={5} color={theme.status.onTime} />}
            chipTone="brand"
            title={t('home.sections.liveStatus')}
            ctaLabel="See all"
            onCta={() => router.push('/(tabs)/live')}
          />

          {status.length === 0 ? (
            <Ticket padding="md">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Loader2 color={theme.textSubtle} size={14} />
                <Text style={{ color: theme.textMuted, fontSize: 13 }}>
                  Status unavailable — backend not reachable.
                </Text>
              </View>
            </Ticket>
          ) : (
            <View
              style={{
                backgroundColor: theme.ink[900],
                borderRadius: 14,
                padding: 6,
                gap: 2,
                borderWidth: 1,
                borderColor: theme.ink[800],
              }}
            >
              {status.map((it, i) => {
                const tone =
                  it.status === 'ok'
                    ? theme.status.onTime
                    : it.status === 'minor'
                      ? theme.status.delay
                      : theme.status.severe;
                const Icon = it.status === 'ok' ? CheckCircle2 : AlertTriangle;
                return (
                  <View
                    key={it.city + i}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      borderRadius: 10,
                    }}
                  >
                    <Pip color={tone} size={8} />
                    <Icon color={tone} size={16} />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: theme.accent,
                          fontWeight: '800',
                          fontSize: 14,
                          letterSpacing: -0.2,
                        }}
                      >
                        {it.city}
                      </Text>
                      <Text style={{ color: theme.accent + 'aa', fontSize: 11, marginTop: 1 }}>
                        {it.note}
                      </Text>
                    </View>
                  </View>
                );
              })}
              <View style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
                <DemoBadge label="Live · GTFS-RT" />
              </View>
            </View>
          )}
        </View>

        {/* ---- Stats teaser ----------------------------------------- */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 12,
            paddingHorizontal: 4,
          }}
        >
          <Stat label="Countries" value="11" unit="+" tone="brand" />
          <Stat label="Cities" value="420" unit="+" tone="amber" />
          <Stat label="Stops" value="180k" unit="+" tone="brand" />
        </View>

        {/* ---- Footer tagline -------------------------------------- */}
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <Chip
            label="Mediterranean transit · re-imagined"
            tone="surface"
            icon={<Sparkles color={theme.textSubtle} size={10} />}
            size="sm"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function UseLocationButton({ onCoords }: { onCoords: (c: { lat: number; lng: number }) => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { state, request } = useGeolocation();
  const busy = state.status === 'requesting';
  return (
    <Pressable
      onPress={async () => {
        const coords = await request();
        if (coords) onCoords(coords);
      }}
      style={{ flexDirection: 'row', gap: 6, alignItems: 'center', paddingVertical: 4 }}
    >
      {busy ? <Loader2 color={theme.brand} size={14} /> : <Locate color={theme.brand} size={14} />}
      <Text style={{ color: theme.brand, fontSize: 12, fontWeight: '700' }}>
        {t('home.hero.useCurrentLocation')}
      </Text>
    </Pressable>
  );
}
