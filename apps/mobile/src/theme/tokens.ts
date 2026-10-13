/**
 * Sistema de diseño de ASCENDX AI — Dirección visual oficial (sección 15).
 *
 * Concepto: fintech prémium + inteligencia artificial + progreso personal.
 * «Ascender mediante decisiones inteligentes».
 *
 * - Tema oscuro prémium como base, con un tema claro que conserva la marca.
 * - Verde esmeralda para acciones principales, progreso y crecimiento;
 *   menta como acento; violeta tecnológico reservado para el mentor de IA.
 * - Los acentos intensos se usan con moderación: acciones principales,
 *   progreso y datos relevantes. El resto de la interfaz es sobria.
 * - Ningún estado se comunica solo con color: siempre va acompañado de
 *   texto o ícono (15.2, 15.9).
 * - Contraste de texto ≥ 4,5:1 verificado para cada combinación de uso.
 *
 * Todos los colores salen de aquí; ninguna pantalla usa colores sueltos.
 */

export interface Palette {
  /** Fondo principal */
  background: string;
  /** Superficies y paneles */
  surface: string;
  /** Superficies internas (campos, selectores) */
  surfaceAlt: string;
  /** Superficies elevadas (hojas, menús, tarjeta destacada) */
  surfaceElevated: string;
  border: string;
  text: string;
  textMuted: string;
  /** Solo para placeholders e íconos secundarios */
  textSubtle: string;
  /** Verde esmeralda: acción principal y progreso */
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  primarySoft: string;
  /** Verde menta: acento de progreso y datos positivos */
  mint: string;
  /** Violeta tecnológico: identidad del mentor de IA */
  violet: string;
  /** Violeta apto para texto sobre superficies */
  violetText: string;
  violetSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  /** Logros e hitos (gamificación sobria) */
  achievement: string;
  /** Líneas decorativas de ilustraciones */
  contour: string;
  /** Color de sombra para la elevación */
  shadow: string;
}

export const darkPalette: Palette = {
  background: '#0B1020',
  surface: '#121A2B',
  surfaceAlt: '#19243A',
  surfaceElevated: '#19243A',
  border: '#263449',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textSubtle: '#7C8BA1',
  primary: '#10B981',
  primaryPressed: '#0EA371',
  onPrimary: '#0B1020',
  primarySoft: 'rgba(16, 185, 129, 0.12)',
  mint: '#6EE7B7',
  violet: '#8B5CF6',
  violetText: '#A78BFA',
  violetSoft: 'rgba(139, 92, 246, 0.14)',
  success: '#6EE7B7',
  successSoft: 'rgba(110, 231, 183, 0.10)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251, 191, 36, 0.10)',
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.10)',
  achievement: '#FBBF24',
  contour: 'rgba(148, 163, 184, 0.08)',
  shadow: '#000000',
};

export const lightPalette: Palette = {
  background: '#F6F8FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF2F7',
  surfaceElevated: '#FFFFFF',
  border: '#DCE3EC',
  text: '#0B1020',
  textMuted: '#475569',
  textSubtle: '#5F6F84',
  primary: '#047857',
  primaryPressed: '#065F46',
  onPrimary: '#FFFFFF',
  primarySoft: 'rgba(4, 120, 87, 0.09)',
  mint: '#059669',
  violet: '#7C3AED',
  violetText: '#6D28D9',
  violetSoft: 'rgba(124, 58, 237, 0.08)',
  success: '#047857',
  successSoft: 'rgba(4, 120, 87, 0.08)',
  warning: '#B45309',
  warningSoft: 'rgba(180, 83, 9, 0.08)',
  danger: '#DC2626',
  dangerSoft: 'rgba(220, 38, 38, 0.07)',
  achievement: '#B45309',
  contour: 'rgba(11, 16, 32, 0.06)',
  shadow: '#0B1020',
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

/**
 * Elevación discreta (15.3): sombras suaves, nunca exageradas.
 * En Android se usa `elevation`; en iOS/web, las propiedades de sombra.
 */
export const elevation = {
  none: { shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
  low: { shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  high: { shadowOpacity: 0.22, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
} as const;

export type ElevationLevel = keyof typeof elevation;

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
