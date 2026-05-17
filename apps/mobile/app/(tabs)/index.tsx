import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Locate, Train, Bus, Briefcase, Home, Ticket } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { SearchField } from '@/components/SearchField';

export default function HomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        {/* Hero */}
        <View style={{ paddingTop: 8 }}>
          <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '600' }}>
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

        {/* Search card */}
        <View
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 22,
            padding: 12,
            gap: 8,
          }}
        >
          <SearchField icon="from" placeholder={t('home.hero.fromPlaceholder')} />
          <SearchField icon="to" placeholder={t('home.hero.toPlaceholder')} />
          <Pressable
            style={{
              backgroundColor: theme.brand,
              borderRadius: 999,
              paddingVertical: 12,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              marginTop: 4,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>{t('home.hero.plan')}</Text>
            <ArrowRight color="white" size={16} />
          </Pressable>
          <Pressable
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              alignSelf: 'flex-start',
              paddingHorizontal: 4,
              paddingVertical: 6,
            }}
          >
            <Locate color={theme.brand} size={14} />
            <Text style={{ color: theme.brand, fontWeight: '600', fontSize: 12 }}>
              {t('home.hero.useCurrentLocation')}
            </Text>
          </Pressable>
        </View>

        {/* Quick actions */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {[
            { label: t('home.quickActions.home'), Icon: Home },
            { label: t('home.quickActions.work'), Icon: Briefcase },
            { label: t('home.quickActions.findStation'), Icon: Train },
            { label: t('home.quickActions.findStop'), Icon: Bus },
            { label: t('home.quickActions.compareFares'), Icon: Ticket },
          ].map(({ label, Icon }) => (
            <View
              key={label}
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
                <Icon color="white" size={18} />
              </View>
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Live status section */}
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700', marginTop: 8 }}>
          {t('home.sections.liveStatus')}
        </Text>
        <View style={{ gap: 8 }}>
          {[
            { city: 'Berlin', note: 'S-Bahn pünktlich', tone: theme.status.onTime },
            { city: 'Paris', note: 'Ligne 4 — micro-perturbation', tone: theme.status.delay },
            { city: 'Tunis', note: 'Métro 1 — léger retard', tone: theme.status.delay },
          ].map((it) => (
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
                  backgroundColor: it.tone,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '700' }}>{it.city}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 12 }}>{it.note}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
