import { View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '@/theme';

/**
 * The signature "ticket" surface — a paper-warm card with soft border,
 * subtle layered shadow, and a 20px rounded radius.  Used everywhere a
 * web app would say `.ticket`.
 */
export function Ticket({
  children,
  style,
  accent,
  padding = 'lg',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Render a 3px gradient accent bar at the top */
  accent?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
}) {
  const theme = useTheme();
  const pad = padding === 'none' ? 0 : theme.spacing[padding];

  return (
    <View
      style={[
        {
          backgroundColor: theme.bgElevated,
          borderRadius: theme.radii.ticket,
          borderWidth: 1,
          borderColor: theme.border,
          overflow: 'hidden',
          shadowColor: theme.isDark ? '#000' : '#0f172a',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: theme.isDark ? 0.35 : 0.08,
          shadowRadius: 24,
          elevation: 3,
        },
        style,
      ]}
    >
      {accent && (
        <View
          style={{
            height: 3,
            flexDirection: 'row',
          }}
        >
          <View style={{ flex: 1, backgroundColor: theme.brand }} />
          <View style={{ flex: 1, backgroundColor: theme.accent }} />
          <View style={{ flex: 1, backgroundColor: theme.brand }} />
        </View>
      )}
      <View style={{ padding: pad }}>{children}</View>
    </View>
  );
}
