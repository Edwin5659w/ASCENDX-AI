/**
 * Sistema de diseño de ASCENDX AI (Documento Maestro v2, sección 15).
 *
 * Fintech prémium con modo oscuro como base:
 * - Fondo grafito casi negro; tarjetas un tono más claro.
 * - Primario turquesa (acciones y progreso); éxito verde; alerta ámbar; crítico rojo coral.
 * - Tipografía Manrope con números tabulares.
 * - Tarjetas con esquinas de 16 dp; espaciado en múltiplos de 8.
 *
 * Todos los colores salen de aquí; ninguna pantalla usa colores sueltos.
 * Contraste de texto ≥ 4,5:1 sobre el fondo (RNF-08).
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
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  /** Logros e hitos (gamificación sobria) */
  achievement: string;
  /** Líneas decorativas de la ilustración */
  contour: string;
}

export const darkPalette: Palette = {
  background: '#0E1113',
  surface: '#171B1F',
  surfaceAlt: '#1F252A',
  border: '#2A3238',
  text: '#F2F5F7',
  textMuted: '#A7B1B9',
  textSubtle: '#76828C',
  primary: '#2DD4C4',
  primaryPressed: '#22B8AA',
  onPrimary: '#04201D',
  primarySoft: 'rgba(45, 212, 196, 0.12)',
  success: '#4ADE80',
  successSoft: 'rgba(74, 222, 128, 0.12)',
  warning: '#F5B544',
  warningSoft: 'rgba(245, 181, 68, 0.12)',
  danger: '#FF6B6B',
  dangerSoft: 'rgba(255, 107, 107, 0.12)',
  achievement: '#F5B544',
  contour: 'rgba(167, 177, 185, 0.09)',
};

export const lightPalette: Palette = {
  background: '#F4F6F7',
  surface: '#FFFFFF',
  surfaceAlt: '#EAEEF0',
  border: '#D5DCE0',
  text: '#0E1113',
  textMuted: '#46525B',
  textSubtle: '#6B7780',
  primary: '#0B7A73',
  primaryPressed: '#08605A',
  onPrimary: '#FFFFFF',
  primarySoft: 'rgba(11, 122, 115, 0.10)',
  success: '#15803D',
  successSoft: 'rgba(21, 128, 61, 0.10)',
  warning: '#A15C00',
  warningSoft: 'rgba(161, 92, 0, 0.10)',
  danger: '#C2373F',
  dangerSoft: 'rgba(194, 55, 63, 0.08)',
  achievement: '#A15C00',
  contour: 'rgba(14, 17, 19, 0.06)',
};

/** Múltiplos de 8 (con 4 y 12 para ajustes finos). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  /** Tarjetas: 16 dp */
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/** Familias cargadas en src/app/_layout.tsx */
export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
} as const;

const tabular = ['tabular-nums'] as const;

export const typography = {
  display: { fontFamily: fonts.extrabold, fontSize: 34, lineHeight: 40, letterSpacing: -0.9 },
  title: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 32, letterSpacing: -0.5 },
  heading: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: fonts.medium, fontSize: 13.5, lineHeight: 19 },
  label: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 18 },
  overline: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 16, letterSpacing: 0.1 },
  amount: { fontFamily: fonts.extrabold, fontSize: 30, lineHeight: 36, letterSpacing: -0.8, fontVariant: tabular },
  amountSmall: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22, fontVariant: tabular },
} as const;

export type TypographyVariant = keyof typeof typography;
