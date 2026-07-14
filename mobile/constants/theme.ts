/** Tema UI — paletas dark/light alineadas con ASCENDX */

const shared = {
  primary: '#7c3aed',
  primaryLight: '#a78bfa',
  accent: '#00e5ff',
  brandMagenta: '#c026d3',
  brandCyan: '#00e5ff',
  brandPurple: '#8a2be2',
  success: '#34d399',
  warning: '#fbbf24',
  danger: '#f87171',
  income: '#34d399',
  expense: '#f87171',
} as const;

export const darkTheme = {
  colors: {
    ...shared,
    background: '#0a0a0f',
    surface: '#14141f',
    surfaceLight: '#1c1c2e',
    card: 'rgba(28, 28, 46, 0.85)',
    border: 'rgba(255, 255, 255, 0.08)',
    text: '#f4f4f5',
    textMuted: '#a1a1aa',
  },
  gradient: {
    brand: ['#8A2BE2', '#C026D3', '#00A3FF', '#00E5FF'] as const,
    authBg: ['#0a0a0f', '#1a0f2e', '#0a0a0f'] as const,
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 8, md: 12, lg: 16, xl: 24 },
  logo: { sizes: { xs: 32, sm: 48, md: 72, lg: 120, xl: 180 } },
} as const;

export const lightTheme = {
  colors: {
    ...shared,
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceLight: '#f1f5f9',
    card: 'rgba(255, 255, 255, 0.95)',
    border: 'rgba(15, 23, 42, 0.12)',
    text: '#0f172a',
    textMuted: '#64748b',
  },
  gradient: {
    brand: ['#8A2BE2', '#C026D3', '#00A3FF', '#00E5FF'] as const,
    authBg: ['#f8fafc', '#ede9fe', '#f8fafc'] as const,
  },
  spacing: darkTheme.spacing,
  radius: darkTheme.radius,
  logo: darkTheme.logo,
} as const;

export type AppTheme = typeof darkTheme;
export type ThemeMode = 'dark' | 'light';

export function getTheme(mode: ThemeMode): AppTheme {
  return (mode === 'light' ? lightTheme : darkTheme) as AppTheme;
}

/** @deprecated use useAppTheme() */
export const theme = darkTheme;
