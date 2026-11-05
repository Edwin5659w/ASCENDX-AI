import { ActivityIndicator, StyleSheet, type PressableProps } from 'react-native';
import { PressableScale } from '@/components/motion';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';
import { ACTION_GRADIENT, GradientFill } from './Modern';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  variant?: Variant;
  loading?: boolean;
}

/** Botón con respuesta física: se hunde al presionar, rebota al soltar y vibra suave. */
export function Button({ title, variant = 'primary', loading = false, disabled, ...props }: ButtonProps) {
  const { colors, spacing, isDark } = useTheme();
  const [from, to] = ACTION_GRADIENT[isDark ? 'dark' : 'light'];
  const gradient = variant === 'primary' && !isDisabledFlag(disabled, loading);
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
        {
          backgroundColor: gradient ? from : pressed ? pressedBackground : background,
          borderRadius: 18,
          overflow: 'hidden',
          opacity: gradient && pressed ? 0.88 : undefined,
          paddingHorizontal: spacing.xl,
        },
        isDisabled && !loading ? { opacity: 0.45 } : null,
      ]}
      {...props}
    >
      {gradient ? <GradientFill from={from} to={to} radius={18} /> : null}
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

function isDisabledFlag(disabled: boolean | null | undefined, loading: boolean) {
  return Boolean(disabled) && !loading;
}
