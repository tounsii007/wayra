import { Text, View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '@/theme';

type Tone = 'brand' | 'amber' | 'surface' | 'success' | 'danger' | 'neutral';

/**
 * Small uppercase pill — used for labels above headings and decorative
 * chips throughout the app.
 */
export function Chip({
  label,
  tone = 'brand',
  icon,
  style,
  size = 'md',
}: {
  label: string;
  tone?: Tone;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md';
}) {
  const theme = useTheme();

  const palettes: Record<Tone, { bg: string; fg: string; border?: string }> = {
    brand: { bg: theme.brandSoft, fg: theme.brandStrong },
    amber: { bg: theme.accentSoft, fg: theme.accentStrong },
    surface: { bg: theme.surface, fg: theme.textMuted, border: theme.border },
    success: { bg: theme.status.onTime + '20', fg: theme.status.onTime },
    danger: { bg: theme.status.severe + '20', fg: theme.status.severe },
    neutral: { bg: theme.surfaceMuted, fg: theme.textMuted },
  };
  const p = palettes[tone];

  const dims = size === 'sm' ? { px: 8, py: 2, font: 10 } : { px: 10, py: 4, font: 11 };

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: dims.px,
          paddingVertical: dims.py,
          borderRadius: 999,
          backgroundColor: p.bg,
          borderWidth: p.border ? 1 : 0,
          borderColor: p.border,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      {icon}
      <Text
        style={{
          color: p.fg,
          fontWeight: '800',
          fontSize: dims.font,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
