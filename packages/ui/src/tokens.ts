/**
 * Design tokens shared between web (Tailwind) and mobile (React Native).
 * Web consumes via the Tailwind preset; mobile imports directly.
 */

export const colors = {
  // Brand — blue → teal → violet gradient story
  brand: {
    50: '#eef4ff',
    100: '#dde9ff',
    200: '#b8d2ff',
    300: '#85b1ff',
    400: '#4f87ff',
    500: '#2563eb', // primary
    600: '#1d4fd1',
    700: '#1840a8',
    800: '#163682',
    900: '#142e69',
  },
  accent: {
    teal: '#0ea5a5',
    violet: '#7c3aed',
    sunset: '#f59e0b',
  },
  // Semantic status colors
  status: {
    onTime: '#16a34a',       // green
    delay: '#f59e0b',        // amber
    severe: '#dc2626',       // red
    info: '#0ea5e9',         // sky
    cancelled: '#991b1b',
  },
  // Neutral scales
  light: {
    bg: '#fafbff',
    surface: '#ffffff',
    surfaceMuted: '#f3f5fb',
    border: '#e4e7ee',
    text: '#0b1220',
    textMuted: '#5b6478',
    textSubtle: '#8a93a6',
  },
  dark: {
    bg: '#0a0e1a',
    surface: '#111727',
    surfaceMuted: '#161d31',
    border: '#222a40',
    text: '#f5f7fb',
    textMuted: '#9aa3b8',
    textSubtle: '#6d7691',
  },
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 22,
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
} as const;

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
    arabic: ['Cairo', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
    display: ['Inter', 'system-ui', 'sans-serif'],
  },
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(15, 23, 42, 0.04)',
  md: '0 4px 12px rgba(15, 23, 42, 0.08)',
  lg: '0 12px 32px rgba(15, 23, 42, 0.12)',
  glow: '0 8px 40px rgba(37, 99, 235, 0.25)',
} as const;

export const motion = {
  durations: { fast: 150, normal: 220, slow: 360 },
  easings: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    emphasized: 'cubic-bezier(0.3, 0, 0, 1)',
  },
} as const;
