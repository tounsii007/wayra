import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

export default function ProfileScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <Text style={{ color: theme.text, fontSize: 24, fontWeight: '800' }}>Settings</Text>
        {['Theme', 'Language', 'Notifications', 'Offline regions', 'Saved routes'].map((label) => (
          <View
            key={label}
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderWidth: 1,
              borderRadius: 14,
              padding: 16,
            }}
          >
            <Text style={{ color: theme.text, fontWeight: '700' }}>{label}</Text>
            <Text style={{ color: theme.textSubtle, marginTop: 4, fontSize: 12 }}>
              Coming in v0.2
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
