import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  variant?: Variant;
  loading?: boolean;
}

export function Button({ title, variant = 'primary', loading = false, disabled, ...props }: ButtonProps) {
  const { colors, radius, spacing } = useTheme();
  const isDisabled = disabled || loading;

  const background = { primary: colors.primary, secondary: colors.surfaceAlt, ghost: 'transparent' }[variant];
  const pressedBackground = { primary: colors.primaryPressed, secondary: colors.border, ghost: colors.primarySoft }[variant];
  const textColor = variant === 'primary' ? 'onPrimary' : variant === 'ghost' ? 'primary' : 'text';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed ? pressedBackground : background,
          borderRadius: radius.md,
          paddingHorizontal: spacing.xl,
          opacity: isDisabled && !loading ? 0.5 : 1,
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 52, alignItems: 'center', justifyContent: 'center' },
});
