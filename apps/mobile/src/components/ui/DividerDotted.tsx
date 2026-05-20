import { View } from 'react-native';
import { useTheme } from '@/theme';

/**
 * Dotted horizontal divider — emulates the perforated edge of a ticket.
 * Implemented as a row of small circles since RN doesn't support
 * dashed background-images.
 */
export function DividerDotted({ vertical }: { vertical?: boolean }) {
  const theme = useTheme();
  const dots = Array.from({ length: vertical ? 24 : 40 });
  return (
    <View
      style={{
        flexDirection: vertical ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: vertical ? '100%' : 1,
        width: vertical ? 1 : '100%',
      }}
    >
      {dots.map((_, i) => (
        <View
          key={i}
          style={{
            width: 3,
            height: 3,
            borderRadius: 999,
            backgroundColor: theme.border,
          }}
        />
      ))}
    </View>
  );
}
