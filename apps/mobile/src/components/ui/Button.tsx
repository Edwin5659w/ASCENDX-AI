import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { ActivityIndicator, Animated, Platform, Pressable, StyleSheet, type PressableProps } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  variant?: Variant;
  loading?: boolean;
}

export function Button({ title, variant = 'primary', loading = false, disabled, onPress, ...props }: ButtonProps) {
  const { colors, radius, spacing } = useTheme();
  const [scale] = useState(() => new Animated.Value(1));
  const isDisabled = disabled || loading;

  const background = { primary: colors.primary, secondary: colors.surfaceAlt, ghost: 'transparent' }[variant];
  const pressedBackground = { primary: colors.primaryPressed, secondary: colors.border, ghost: colors.primarySoft }[variant];
  const textColor = variant === 'primary' ? 'onPrimary' : variant === 'ghost' ? 'primary' : 'text';

  const animateTo = (value: number) =>
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 40, bounciness: 0 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        onPressIn={() => animateTo(0.98)}
        onPressOut={() => animateTo(1)}
        onPress={(event) => {
          if (Platform.OS !== 'web' && variant === 'primary') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
          }
          onPress?.(event);
        }}
        style={({ pressed }) => [
          styles.base,
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
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 56, alignItems: 'center', justifyContent: 'center' },
});
