import { BlurView } from 'expo-blur';
import { View, ViewStyle } from 'react-native';
import type { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

function createStyles(theme: AppTheme) {
  return {
    wrapper: {
      borderRadius: theme.radius.lg,
      overflow: 'hidden' as const,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    blur: {
      overflow: 'hidden' as const,
    },
    inner: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.card,
    },
  };
}

export function Card({ children, style }: CardProps) {
  const { mode } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.wrapper, style]}>
      <BlurView intensity={mode === 'light' ? 20 : 40} tint={mode === 'light' ? 'light' : 'dark'} style={styles.blur}>
        <View style={styles.inner}>{children}</View>
      </BlurView>
    </View>
  );
}
