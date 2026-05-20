import { colors, radii, spacing, typography, shadows, motion } from '@wayra/ui';
import { useColorScheme } from 'react-native';
import { usePrefsStore } from './lib/prefs-store';

/**
 * Wayra mobile theme.
 *
 * Pulls the Mediterranean-Transit design tokens out of @wayra/ui and
 * shapes them into a per-mode object you can pass through `useTheme()`
 * inside screens.  Tokens are intentionally rich so screens never have
 * to reach back into `colors.*` and risk drifting from the system.
 */
export interface Theme {
  // Backgrounds
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceMuted: string;
  surfaceSunken: string;

  // Lines
  border: string;
  borderStrong: string;

  // Text
  text: string;
  textMuted: string;
  textSubtle: string;
  textOnBrand: string;

  // Brand
  brand: string; // primary teal — adapts per mode
  brandStrong: string; // teal-700 in light, teal-300 in dark
  brandSoft: string; // teal-100 in light, teal-900 in dark
  accent: string; // amber — adapts per mode
  accentStrong: string;
  accentSoft: string;
  gold: string;

  // Status
  status: typeof colors.status;

  // Tone palettes for charts / leg pills
  ink: typeof colors.ink;
  cream: typeof colors.cream;
  brandScale: typeof colors.brand;
  accentScale: typeof colors.accent;

  // Tokens
  radii: typeof radii;
  spacing: typeof spacing;
  typography: typeof typography;
  shadows: typeof shadows;
  motion: typeof motion;

  // Legacy aliases (kept so old screens still compile)
  accentLegacy: { teal: string; violet: string; sunset: string };

  isDark: boolean;
}

const base = {
  status: colors.status,
  ink: colors.ink,
  cream: colors.cream,
  brandScale: colors.brand,
  accentScale: colors.accent,
  gold: colors.accent.gold,
  radii,
  spacing,
  typography,
  shadows,
  motion,
  accentLegacy: {
    teal: colors.accent.teal,
    violet: colors.accent.violet,
    sunset: colors.accent.sunset,
  },
};

const light: Theme = {
  ...base,
  bg: colors.light.bg,
  bgElevated: colors.light.bgElevated,
  surface: colors.light.surface,
  surfaceMuted: colors.light.surfaceMuted,
  surfaceSunken: colors.light.surfaceSunken,
  border: colors.light.border,
  borderStrong: colors.light.borderStrong,
  text: colors.light.text,
  textMuted: colors.light.textMuted,
  textSubtle: colors.light.textSubtle,
  textOnBrand: '#ffffff',
  brand: colors.brand[600], // teal-600
  brandStrong: colors.brand[700],
  brandSoft: colors.brand[100],
  accent: colors.accent[600], // amber-600
  accentStrong: colors.accent[700],
  accentSoft: colors.accent[100],
  isDark: false,
};

const dark: Theme = {
  ...base,
  bg: colors.dark.bg,
  bgElevated: colors.dark.bgElevated,
  surface: colors.dark.surface,
  surfaceMuted: colors.dark.surfaceMuted,
  surfaceSunken: colors.dark.surfaceSunken,
  border: colors.dark.border,
  borderStrong: colors.dark.borderStrong,
  text: colors.dark.text,
  textMuted: colors.dark.textMuted,
  textSubtle: colors.dark.textSubtle,
  textOnBrand: '#ffffff',
  brand: colors.brand[400], // brighter teal in dark
  brandStrong: colors.brand[300],
  brandSoft: colors.brand[900],
  accent: colors.accent[400], // brighter amber in dark
  accentStrong: colors.accent[300],
  accentSoft: colors.accent[900],
  isDark: true,
};

export function useTheme(): Theme {
  const system = useColorScheme();
  const override = usePrefsStore((s) => s.themeOverride);
  const effective = override === 'system' ? system : override;
  return effective === 'dark' ? dark : light;
}
