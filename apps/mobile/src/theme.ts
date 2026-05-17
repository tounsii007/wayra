import { colors, radii, spacing, typography } from '@wayra/ui';
import { useColorScheme } from 'react-native';

export interface Theme {
  bg: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  brand: string;
  accent: { teal: string; violet: string; sunset: string };
  status: typeof colors.status;
  radii: typeof radii;
  spacing: typeof spacing;
  typography: typeof typography;
}

const light: Theme = {
  bg: colors.light.bg,
  surface: colors.light.surface,
  surfaceMuted: colors.light.surfaceMuted,
  border: colors.light.border,
  text: colors.light.text,
  textMuted: colors.light.textMuted,
  textSubtle: colors.light.textSubtle,
  brand: colors.brand[500],
  accent: colors.accent,
  status: colors.status,
  radii,
  spacing,
  typography,
};

const dark: Theme = {
  ...light,
  bg: colors.dark.bg,
  surface: colors.dark.surface,
  surfaceMuted: colors.dark.surfaceMuted,
  border: colors.dark.border,
  text: colors.dark.text,
  textMuted: colors.dark.textMuted,
  textSubtle: colors.dark.textSubtle,
};

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}
