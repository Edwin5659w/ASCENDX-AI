import { Text, type TextProps, type TextStyle } from 'react-native';
import type { Palette, TypographyVariant } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: keyof Palette;
  align?: TextStyle['textAlign'];
}

export function AppText({ variant = 'body', color = 'text', align, style, ...props }: AppTextProps) {
  const { colors, typography } = useTheme();
  return (
    <Text
      {...props}
      style={[typography[variant] as TextStyle, { color: colors[color], textAlign: align }, style]}
    />
  );
}
