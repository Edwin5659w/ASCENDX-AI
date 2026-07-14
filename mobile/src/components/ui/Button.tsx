import { ActivityIndicator, Pressable, Text, ViewStyle } from 'react-native';
import type { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

function createStyles(theme: AppTheme) {
  return {
    base: {
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: theme.radius.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    primary: {
      backgroundColor: theme.colors.primary,
    },
    secondary: {
      backgroundColor: theme.colors.surfaceLight,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    pressed: {
      opacity: 0.75,
    },
    text: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600' as const,
    },
    ghostText: {
      color: theme.colors.primary,
    },
    secondaryText: {
      color: theme.colors.text,
    },
  };
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
}: ButtonProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        (pressed || disabled) && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : theme.colors.primary} />
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'ghost' && styles.ghostText,
            variant === 'secondary' && styles.secondaryText,
          ]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
