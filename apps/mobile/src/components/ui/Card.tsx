import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/useTheme';

interface CardProps {
  children: ReactNode;
  /** Tarjeta destacada con borde de acento */
  highlighted?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, highlighted = false, style }: CardProps) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: highlighted ? colors.primary : colors.border,
          padding: spacing.xl,
          gap: spacing.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
