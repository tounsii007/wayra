import { Sparkles } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { useTheme } from '@/theme';

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
        backgroundColor: theme.accent.violet + '22',
      }}
    >
      <Sparkles color={theme.accent.violet} size={10} />
      <Text
        style={{
          color: theme.accent.violet,
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
