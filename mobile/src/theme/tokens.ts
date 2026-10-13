/**
 * Sistema visual de ASCENDX AI.
 *
 * Concepto: "ascenso". Fondo azul tinta profundo (noche andina), acento jade
 * para el progreso y dorado solo para logros. Tipografía: Sora para títulos
 * y cifras (geométrica, firme), Figtree para el texto (cálida y legible).
 *
 * Todos los colores de la app salen de aquí; ninguna pantalla usa colores sueltos.
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
  dangerSoft: string;
  achievement: string;
  /** Líneas decorativas del fondo (contornos de ascenso) */
  contour: string;
}

export const darkPalette: Palette = {
  background: '#0A1424',
  surface: '#101D32',
  surfaceAlt: '#16263F',
  border: '#22365A',
  text: '#EEF3FA',
  textMuted: '#A2B2CA',
  textSubtle: '#6A7C9C',
  primary: '#3DDBA4',
  primaryPressed: '#2CC28E',
  onPrimary: '#04261A',
  primarySoft: 'rgba(61, 219, 164, 0.13)',
  income: '#3DDBA4',
  expense: '#FF7A90',
  warning: '#F2C14E',
  warningSoft: 'rgba(242, 193, 78, 0.12)',
  danger: '#FF7A90',
  dangerSoft: 'rgba(255, 122, 144, 0.12)',
  achievement: '#F2C14E',
  contour: 'rgba(162, 178, 202, 0.10)',
};

export const lightPalette: Palette = {
  background: '#F3F6FA',
  surface: '#FFFFFF',
  surfaceAlt: '#E9EEF5',
  border: '#D6DEEA',
  text: '#0A1424',
  textMuted: '#45577A',
  textSubtle: '#7F8EA8',
  primary: '#0B7A5C',
  primaryPressed: '#08634A',
  onPrimary: '#FFFFFF',
  primarySoft: 'rgba(11, 122, 92, 0.10)',
  income: '#0B7A5C',
  expense: '#D2344F',
  warning: '#A86A00',
  warningSoft: 'rgba(168, 106, 0, 0.10)',
  danger: '#D2344F',
  dangerSoft: 'rgba(210, 52, 79, 0.08)',
  achievement: '#A86A00',
  contour: 'rgba(10, 20, 36, 0.06)',
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
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Familias cargadas en src/app/_layout.tsx */
export const fonts = {
  displayBold: 'Sora_700Bold',
  displaySemi: 'Sora_600SemiBold',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodySemi: 'Figtree_600SemiBold',
} as const;

export const typography = {
  display: { fontFamily: fonts.displayBold, fontSize: 34, lineHeight: 40, letterSpacing: -0.8 },
  title: { fontFamily: fonts.displaySemi, fontSize: 26, lineHeight: 32, letterSpacing: -0.5 },
  heading: { fontFamily: fonts.displaySemi, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23 },
  bodyStrong: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 23 },
  caption: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 18 },
  overline: { fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 16, letterSpacing: 0.2 },
  amount: { fontFamily: fonts.displaySemi, fontSize: 28, lineHeight: 34, letterSpacing: -0.6, fontVariant: ['tabular-nums'] },
} as const;

export type TypographyVariant = keyof typeof typography;
