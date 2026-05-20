import { Sparkles } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { useTheme } from '@/theme';

/**
 * "Demo data" pill — surfaces wherever the data is mocked.  Uses the
 * accent (saffron amber) palette so it reads as informational, not
 * critical.
 */
export function DemoBadge({ label = 'Demo data' }: { label?: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
        backgroundColor: theme.accentSoft,
        borderWidth: 1,
        borderColor: theme.accent + '60',
      }}
    >
      <Sparkles color={theme.accent} size={10} />
      <Text
        style={{
          color: theme.accentStrong,
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 1.4,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
