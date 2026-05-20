import { Pressable, Text, View, ViewStyle, StyleProp, ActivityIndicator } from 'react-native';
import { useTheme } from '@/theme';

type Variant = 'primary' | 'amber' | 'surface' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

/**
 * Primary mobile action button.  Variants line up with the web design
 * system: primary (teal), amber (saffron), surface (paper) and ghost
 * (no fill).
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  disabled,
  loading,
  style,
  fullWidth,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  const sizeMap: Record<Size, { h: number; px: number; font: number }> = {
    sm: { h: 32, px: 14, font: 12 },
    md: { h: 40, px: 18, font: 14 },
    lg: { h: 48, px: 22, font: 15 },
  };
  const s = sizeMap[size];

  const palette: Record<Variant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: theme.brand, fg: theme.textOnBrand },
    amber: { bg: theme.accent, fg: theme.textOnBrand },
    surface: { bg: theme.surface, fg: theme.text, border: theme.border },
    ghost: { bg: 'transparent', fg: theme.text },
  };
  const p = palette[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          height: s.h,
          paddingHorizontal: s.px,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderRadius: 999,
          backgroundColor: p.bg,
          borderWidth: p.border ? 1 : 0,
          borderColor: p.border,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          // Faux shadow for filled variants
          ...(variant === 'primary'
            ? {
                shadowColor: theme.brand,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.45,
                shadowRadius: 14,
                elevation: 4,
              }
            : variant === 'amber'
              ? {
                  shadowColor: theme.accent,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.4,
                  shadowRadius: 14,
                  elevation: 4,
                }
              : {}),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={p.fg} />
      ) : (
        <>
          {iconLeft && <View>{iconLeft}</View>}
          <Text
            style={{
              color: p.fg,
              fontWeight: '700',
              fontSize: s.font,
              letterSpacing: -0.2,
            }}
          >
            {label}
          </Text>
          {iconRight && <View>{iconRight}</View>}
        </>
      )}
    </Pressable>
  );
}
