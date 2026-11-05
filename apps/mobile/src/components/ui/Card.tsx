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
  const { colors, elevate } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: elevated ? colors.surfaceElevated : colors.surface,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: highlighted ? colors.primary : colors.border,
          padding: 20,
          gap: 12,
        },
        elevate(elevated || highlighted ? 'low' : 'none'),
        style,
      ]}
    >
      {children}
    </View>
  );
}
