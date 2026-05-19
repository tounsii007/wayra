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
  Ticket,
  Train,
} from 'lucide-react-native';
import type { Place } from '@wayra/types';
import { useTheme } from '@/theme';
import { PlacesAutocomplete } from '@/components/PlacesAutocomplete';
import { DemoBadge } from '@/components/DemoBadge';
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
    api.networkStatus().then((r) => setStatus(r.items.slice(0, 3))).catch(() => undefined);
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
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ paddingTop: 8 }}>
          <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '700' }}>
            {t('brand.tagline')}
          </Text>
          <Text
            style={{
              color: theme.text,
              fontSize: 30,
              fontWeight: '800',
              marginTop: 6,
              lineHeight: 36,
            }}
          >
            {t('home.hero.title')}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 22,
            padding: 12,
            gap: 10,
            zIndex: 10,
          }}
        >
          <View style={{ zIndex: 30 }}>
            <PlacesAutocomplete
              value={from}
              onChange={setFrom}
              placeholder={t('home.hero.fromPlaceholder')}
              testID="home-from"
            />
          </View>
          <View style={{ alignItems: 'center' }}>
            <Pressable
              onPress={swap}
              hitSlop={10}
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                backgroundColor: theme.surfaceMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowDownUp color={theme.text} size={14} />
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
          <Pressable
            onPress={plan}
            disabled={!from || !to}
            style={{
              backgroundColor: theme.brand,
              borderRadius: 999,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: !from || !to ? 0.5 : 1,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>{t('home.hero.plan')}</Text>
            <ArrowRight color="#fff" size={16} />
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <Pressable
              onPress={() => router.push('/search')}
              style={{ flexDirection: 'row', gap: 6, alignItems: 'center', paddingVertical: 6 }}
            >
              <Search color={theme.brand} size={14} />
              <Text style={{ color: theme.brand, fontSize: 12, fontWeight: '700' }}>
                Open full search
              </Text>
            </Pressable>
            <UseLocationButton onCoords={(c) => router.push(`/search?lat=${c.lat}&lng=${c.lng}`)} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {[
            { label: t('home.quickActions.home'), Icon: Home, action: () => router.push('/me') },
            { label: t('home.quickActions.work'), Icon: Briefcase, action: () => router.push('/me') },
            { label: t('home.quickActions.findStation'), Icon: Train, action: () => router.push('/search') },
            { label: t('home.quickActions.findStop'), Icon: Bus, action: () => router.push('/search') },
            { label: t('home.quickActions.compareFares'), Icon: Ticket, action: () => router.push('/plan') },
          ].map(({ label, Icon, action }) => (
            <Pressable
              key={label}
              onPress={action}
              style={{
                flexBasis: '47%',
                flexGrow: 1,
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: 16,
                padding: 14,
                gap: 8,
              }}
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
                <Icon color="#fff" size={18} />
              </View>
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800', flex: 1 }}>
            {t('home.sections.liveStatus')}
          </Text>
          <DemoBadge />
        </View>
        {status.length === 0 ? (
          <View
            style={{
              padding: 16,
              borderRadius: 14,
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderWidth: 1,
            }}
          >
            <Text style={{ color: theme.textMuted, fontSize: 13 }}>
              Status unavailable — backend not reachable.
            </Text>
          </View>
        ) : (
          status.map((it) => (
            <View
              key={it.city}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: 14,
                padding: 14,
              }}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  backgroundColor:
                    it.status === 'ok'
                      ? theme.status.onTime
                      : it.status === 'minor'
                        ? theme.status.delay
                        : theme.status.severe,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '800' }}>{it.city}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 12 }}>{it.note}</Text>
              </View>
            </View>
          ))
        )}
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
      style={{ flexDirection: 'row', gap: 6, alignItems: 'center', paddingVertical: 6 }}
    >
      {busy ? (
        <Loader2 color={theme.brand} size={14} />
      ) : (
        <Locate color={theme.brand} size={14} />
      )}
      <Text style={{ color: theme.brand, fontSize: 12, fontWeight: '700' }}>
        {t('home.hero.useCurrentLocation')}
      </Text>
    </Pressable>
  );
}
