import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useTranslation } from 'react-i18next';

export default function LiveScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <Text style={{ color: theme.text, fontSize: 24, fontWeight: '800' }}>
          {t('home.sections.liveStatus')}
        </Text>
        <Text style={{ color: theme.textMuted }}>
          Real-time disruptions feed (MVP demo).
        </Text>

        {[
          {
            title: 'S1 leichte Verzögerung',
            body: 'Aufgrund eines Signalproblems verkehrt die S1 mit bis zu 8 Minuten Verspätung.',
            tone: theme.status.delay,
          },
          {
            title: 'Grève SNCF — TER',
            body: 'Le trafic TER Île-de-France est perturbé.',
            tone: theme.status.severe,
          },
          {
            title: 'Métro Tunis · Ligne 1',
            body: 'Service nominal.',
            tone: theme.status.onTime,
          },
        ].map((it) => (
          <View
            key={it.title}
            style={{
              borderLeftWidth: 4,
              borderLeftColor: it.tone,
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderWidth: 1,
              borderRadius: 14,
              padding: 14,
            }}
          >
            <Text style={{ color: theme.text, fontWeight: '800' }}>{it.title}</Text>
            <Text style={{ color: theme.textMuted, marginTop: 4, fontSize: 13 }}>{it.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
