import { useId, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { PressableScale } from '@/components/motion';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type Tone = 'brand' | 'violet' | 'danger';

const GRADIENTS: Record<Tone, { dark: [string, string, string]; light: [string, string, string] }> = {
  // Esmeralda → azul petróleo → índigo: crecimiento + tecnología
  brand: { dark: ['#0E7A5C', '#0F4C5C', '#1E1B4B'], light: ['#059669', '#0E7490', '#4338CA'] },
  violet: { dark: ['#4C1D95', '#312E81', '#0F172A'], light: ['#7C3AED', '#4F46E5', '#1E3A8A'] },
  danger: { dark: ['#7F1D1D', '#4C1D2E', '#1E1B2E'], light: ['#B91C1C', '#9D174D', '#4C1D95'] },
};

/**
 * Tarjeta con degradado y brillos suaves: el dato principal de cada pantalla.
 * El texto encima siempre es claro (contraste ≥ 4,5:1 sobre el tono más claro).
 */
export function GradientCard({ children, tone = 'brand', style }: { children: ReactNode; tone?: Tone; style?: StyleProp<ViewStyle> }) {
  const { isDark, elevate } = useTheme();
  const id = useId().replace(/:/g, '');
  const [a, b, c] = GRADIENTS[tone][isDark ? 'dark' : 'light'];
  return (
    <View style={[{ borderRadius: 28, overflow: 'hidden' }, elevate('high'), style]}>
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={a} />
            <Stop offset="0.55" stopColor={b} />
            <Stop offset="1" stopColor={c} />
          </LinearGradient>
          <RadialGradient id={`r${id}`} cx="0.9" cy="0.05" r="0.6">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill={`url(#g${id})`} />
        <Rect x="0" y="0" width="100" height="100" fill={`url(#r${id})`} />
        <Circle cx="96" cy="96" r="30" fill="#FFFFFF" fillOpacity="0.04" />
        <Circle cx="8" cy="104" r="22" fill="#FFFFFF" fillOpacity="0.035" />
      </Svg>
      <View style={{ padding: 24, gap: 12 }}>{children}</View>
    </View>
  );
}

/** Texto claro para usar dentro de GradientCard. */
export function OnGradient({ children, variant = 'body', soft, style }: { children: ReactNode; variant?: Parameters<typeof AppText>[0]['variant']; soft?: boolean; style?: StyleProp<TextStyle> }) {
  return (
    <AppText variant={variant} style={[{ color: soft ? 'rgba(255,255,255,0.78)' : '#FFFFFF' }, style]}>
      {children}
    </AppText>
  );
}

/** Título de sección fuera de las tarjetas, con acción opcional a la derecha. */
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm, marginBottom: -spacing.sm }}>
      <AppText variant="heading" accessibilityRole="header" style={{ fontSize: 18 }}>
        {title}
      </AppText>
      {action && onAction ? (
        <PressableScale accessibilityRole="button" accessibilityLabel={action} onPress={onAction} hitSlop={12}>
          <AppText variant="label" style={{ color: colors.primary }}>
            {action}
          </AppText>
        </PressableScale>
      ) : null}
    </View>
  );
}

/** Cifra corta en su propia ficha (ingresos, gastos, disponible…). */
export function StatTile({ label, value, icon, tone = 'text' }: { label: string; value: string; icon: IconName; tone?: 'text' | 'success' | 'danger' | 'violetText' }) {
  const { colors, spacing } = useTheme();
  const accent = tone === 'text' ? colors.textMuted : colors[tone];
  return (
    <View style={{ flex: 1, minWidth: 0, gap: spacing.sm, padding: 11, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt }}>
        <Icon name={icon} size={17} tint={accent} />
      </View>
      <View style={{ gap: 2 }}>
        <AppText variant="caption" color="textMuted" numberOfLines={1}>
          {label}
        </AppText>
        <AppText variant="label" color={tone} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{ fontSize: 13.5, letterSpacing: -0.2 }}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

/** Botón circular de acción rápida con su nombre debajo. */
export function QuickAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={label} onPress={onPress} scaleTo={0.92} containerStyle={{ flex: 1 }} style={{ alignItems: 'center', gap: 8 }}>
      <View style={{ width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' }}>
        <Icon name={icon} size={24} tint="#FFFFFF" />
      </View>
      <AppText variant="caption" numberOfLines={1} style={{ color: '#FFFFFF', fontSize: 12.5 }}>
        {label}
      </AppText>
    </PressableScale>
  );
}
