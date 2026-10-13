import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import type { Palette } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/**
 * Íconos de la app. En Android se usan Material Symbols; se incluye el
 * equivalente de iOS (SF Symbols) para no romper si algún día se compila allí.
 */
const ICONS = {
  home: { android: 'home', ios: 'house.fill', web: 'home' },
  movements: { android: 'receipt_long', ios: 'list.bullet.rectangle', web: 'receipt_long' },
  goals: { android: 'flag', ios: 'flag.fill', web: 'flag' },
  simulator: { android: 'calculate', ios: 'function', web: 'calculate' },
  profile: { android: 'person', ios: 'person.crop.circle', web: 'person' },
  check: { android: 'check_circle', ios: 'checkmark.circle.fill', web: 'check_circle' },
  pending: { android: 'radio_button_unchecked', ios: 'circle', web: 'radio_button_unchecked' },
  warning: { android: 'warning', ios: 'exclamationmark.triangle.fill', web: 'warning' },
  info: { android: 'info', ios: 'info.circle', web: 'info' },
  sparkle: { android: 'auto_awesome', ios: 'sparkles', web: 'auto_awesome' },
  shield: { android: 'shield', ios: 'lock.shield', web: 'shield' },
  trending: { android: 'trending_up', ios: 'chart.line.uptrend.xyaxis', web: 'trending_up' },
  logout: { android: 'logout', ios: 'rectangle.portrait.and.arrow.right', web: 'logout' },
} as const;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  color?: keyof Palette;
  /** Color directo (p. ej. el que entrega la barra de pestañas) */
  tint?: ColorValue;
}

export function Icon({ name, size = 22, color = 'text', tint }: IconProps) {
  const { colors } = useTheme();
  return (
    <SymbolView
      name={ICONS[name] as ComponentProps<typeof SymbolView>['name']}
      size={size}
      tintColor={tint ?? colors[color]}
    />
  );
}
