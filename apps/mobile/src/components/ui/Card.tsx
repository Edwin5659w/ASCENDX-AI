import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/useTheme';

interface CardProps {
  children: ReactNode;
  /** Tarjeta destacada con borde de acento (dato o acción principal) */
  highlighted?: boolean;
  /** Superficie elevada con sombra discreta */
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, highlighted = false, elevated = false, style }: CardProps) {
  const { colors, radius, spacing, elevate } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: elevated ? colors.surfaceElevated : colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: highlighted ? colors.primary : colors.border,
          padding: spacing.xl,
          gap: spacing.md,
        },
        elevate(elevated || highlighted ? 'low' : 'none'),
        style,
      ]}
    >
      {children}
    </View>
  );
}
