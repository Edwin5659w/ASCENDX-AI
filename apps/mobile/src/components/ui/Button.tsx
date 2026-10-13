import { ActivityIndicator, StyleSheet, type PressableProps } from 'react-native';
import { PressableScale } from '@/components/motion';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  variant?: Variant;
  loading?: boolean;
}

/** Botón con respuesta física: se hunde al presionar, rebota al soltar y vibra suave. */
export function Button({ title, variant = 'primary', loading = false, disabled, ...props }: ButtonProps) {
  const { colors, radius, spacing, elevate } = useTheme();
  const isDisabled = disabled || loading;

  const background = { primary: colors.primary, secondary: colors.surfaceAlt, ghost: 'transparent', danger: colors.dangerSoft }[variant];
  const pressedBackground = { primary: colors.primaryPressed, secondary: colors.border, ghost: colors.primarySoft, danger: colors.dangerSoft }[variant];
  const textColor = variant === 'primary' ? 'onPrimary' : variant === 'ghost' ? 'primary' : variant === 'danger' ? 'danger' : 'text';

  return (
    <PressableScale
      scaleTo={0.96}
      hapticKind={variant === 'primary' ? 'light' : 'selection'}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && !isDisabled ? elevate('low') : null,
        {
          backgroundColor: pressed ? pressedBackground : background,
          borderRadius: radius.md,
          paddingHorizontal: spacing.xl,
          opacity: isDisabled && !loading ? 0.45 : 1,
        },
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={colors[textColor]} />
      ) : (
        <AppText variant="bodyStrong" color={textColor}>
          {title}
        </AppText>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 56, alignItems: 'center', justifyContent: 'center' },
});
