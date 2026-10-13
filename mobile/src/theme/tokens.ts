/**
 * Sistema visual de ASCENDX AI: fintech prémium con acentos turquesa.
 * Todos los colores de la app salen de aquí; ninguna pantalla debe usar
 * colores sueltos.
 */

export interface Palette {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  primarySoft: string;
  income: string;
  expense: string;
  warning: string;
  warningSoft: string;
  danger: string;
  achievement: string;
}

export const darkPalette: Palette = {
  background: '#0B1220',
  surface: '#121A2B',
  surfaceAlt: '#1A2438',
  border: '#24304A',
  text: '#F1F5F9',
  textMuted: '#A3B1C6',
  textSubtle: '#6B7A93',
  primary: '#2DD4BF',
  primaryPressed: '#14B8A6',
  onPrimary: '#042F2E',
  primarySoft: 'rgba(45, 212, 191, 0.14)',
  income: '#34D399',
  expense: '#FB7185',
  warning: '#FBBF24',
  warningSoft: 'rgba(251, 191, 36, 0.12)',
  danger: '#F87171',
  achievement: '#E9C46A',
};

export const lightPalette: Palette = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF2F7',
  border: '#E2E8F0',
  text: '#0B1220',
  textMuted: '#4B5B73',
  textSubtle: '#8291A7',
  primary: '#0F766E',
  primaryPressed: '#115E59',
  onPrimary: '#FFFFFF',
  primarySoft: 'rgba(15, 118, 110, 0.10)',
  income: '#059669',
  expense: '#E11D48',
  warning: '#B45309',
  warningSoft: 'rgba(180, 83, 9, 0.10)',
  danger: '#DC2626',
  achievement: '#B7791F',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  overline: { fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  amount: { fontSize: 28, lineHeight: 34, fontWeight: '700', fontVariant: ['tabular-nums'] },
} as const;

export type TypographyVariant = keyof typeof typography;
