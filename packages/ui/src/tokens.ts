/**
 * Wayra design tokens — shared between web (Tailwind) and mobile (RN).
 *
 * Visual language: "Mediterranean Transit".
 *   • brand   — deep ocean teal (replaces the old generic blue)
 *   • accent  — saffron amber (warm complementary, North-African feel)
 *   • gold    — sparing highlight
 *   • ink     — deep navy near-black (dark mode + departure-board)
 *   • cream   — warm off-white (light backgrounds, editorial feel)
 */

export const colors = {
  // Primary — Ocean Teal
  brand: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6', // primary
    600: '#0d9488', // hero accent / CTAs
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
    950: '#042f2e',
  },
  // Accent — Saffron / Amber
  accent: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    // Named aliases retained for legacy callers
    teal: '#0d9488',
    violet: '#7c3aed',
    sunset: '#d97706',
    gold: '#fbbf24',
    coral: '#fb7185',
  },
  // Semantic status colors
  status: {
    onTime: '#10b981',
    delay: '#f59e0b',
    severe: '#ef4444',
    info: '#0ea5e9',
    cancelled: '#7f1d1d',
  },
  // Ink (deep navy) scale — used for text in light mode and surfaces in dark
  ink: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  // Cream / paper — editorial warm off-white
  cream: {
    50: '#fdfbf6',
    100: '#fbf7ee',
    200: '#f5ecd9',
    300: '#ecdcb8',
  },
  // Per-mode roles
  light: {
    bg: '#fdfbf6', // cream-50 — paper
    bgElevated: '#ffffff',
    surface: '#ffffff',
    surfaceMuted: '#fbf7ee', // cream-100
    surfaceSunken: '#f5ecd9',
    border: '#e8e0cf',
    borderStrong: '#d4c8b2',
    text: '#0f172a',
    textMuted: '#475569',
    textSubtle: '#64748b',
  },
  dark: {
    bg: '#020617', // ink-950
    bgElevated: '#0f172a',
    surface: '#0f172a',
    surfaceMuted: '#1e293b',
    surfaceSunken: '#0b1121',
    border: '#334155',
    borderStrong: '#475569',
    text: '#f8fafc',
    textMuted: '#cbd5e1',
    textSubtle: '#94a3b8',
  },
} as const;

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 36,
  ticket: 20,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
    display: ['"Bricolage Grotesque"', 'Inter', 'system-ui', 'sans-serif'],
    mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
    arabic: ['Cairo', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
  },
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 22,
    '2xl': 26,
    '3xl': 32,
    '4xl': 40,
    '5xl': 52,
    '6xl': 64,
  },
  letterSpacing: {
    tightest: -0.8,
    tighter: -0.4,
    tight: -0.2,
    normal: 0,
    wide: 0.2,
    wider: 0.5,
    widest: 1.4,
  },
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(15, 23, 42, 0.04)',
  md: '0 4px 14px rgba(15, 23, 42, 0.10)',
  lg: '0 12px 32px rgba(15, 23, 42, 0.16)',
  glow: '0 10px 40px rgba(13, 148, 136, 0.45)',
  glowAmber: '0 10px 40px rgba(217, 119, 6, 0.40)',
} as const;

export const motion = {
  durations: { fast: 150, normal: 220, slow: 360 },
  easings: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    emphasized: 'cubic-bezier(0.3, 0, 0, 1)',
    arrive: 'cubic-bezier(0.16, 1, 0.3, 1)',
    depart: 'cubic-bezier(0.65, 0, 0.35, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;
