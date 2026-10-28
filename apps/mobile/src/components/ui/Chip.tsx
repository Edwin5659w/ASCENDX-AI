import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { PressableScale } from '@/components/motion';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Punto de color a la izquierda (p. ej. color de la categoría) */
  dotColor?: string | null;
  leading?: ReactNode;
  accessibilityHint?: string;
}

/** Opción seleccionable compacta. Área táctil ≥ 44 dp. */
export function Chip({ label, selected = false, onPress, dotColor, leading, accessibilityHint }: ChipProps) {
  const { colors, radius, spacing } = useTheme();
  return (
    <PressableScale
      scaleTo={0.95}
      hapticKind="selection"
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.pill,
        borderWidth: 1.5,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primarySoft : pressed ? colors.surfaceAlt : colors.surface,
      })}
    >
      {leading}
      {dotColor ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dotColor }} /> : null}
      <AppText variant="label" color={selected ? 'text' : 'textMuted'}>
        {label}
      </AppText>
    </PressableScale>
  );
}

/** Fila de chips que se envuelve en varias líneas, o se desplaza en horizontal. */
export function ChipGroup({ children, scroll = false }: { children: ReactNode; scroll?: boolean }) {
  const { spacing } = useTheme();
  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.lg }}>
        {children}
      </ScrollView>
    );
  }
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{children}</View>;
}
