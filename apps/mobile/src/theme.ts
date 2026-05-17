import { colors, radii, spacing, typography } from '@wayra/ui';
import { useColorScheme } from 'react-native';
import { usePrefsStore } from './lib/prefs-store';

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
  isDark: boolean;
}

const base = {
  brand: colors.brand[500],
  accent: colors.accent,
  status: colors.status,
  radii,
  spacing,
  typography,
};

const light: Theme = {
  ...base,
  bg: colors.light.bg,
  surface: colors.light.surface,
  surfaceMuted: colors.light.surfaceMuted,
  border: colors.light.border,
  text: colors.light.text,
  textMuted: colors.light.textMuted,
  textSubtle: colors.light.textSubtle,
  isDark: false,
};

const dark: Theme = {
  ...base,
  bg: colors.dark.bg,
  surface: colors.dark.surface,
  surfaceMuted: colors.dark.surfaceMuted,
  border: colors.dark.border,
  text: colors.dark.text,
  textMuted: colors.dark.textMuted,
  textSubtle: colors.dark.textSubtle,
  isDark: true,
};

export function useTheme(): Theme {
  const system = useColorScheme();
  const override = usePrefsStore((s) => s.themeOverride);
  const effective = override === 'system' ? system : override;
  return effective === 'dark' ? dark : light;
}
