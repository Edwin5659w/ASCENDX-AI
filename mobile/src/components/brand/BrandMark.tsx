import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTheme } from '@/theme/useTheme';

/**
 * Isotipo de ASCENDX AI: una línea que asciende en tres tramos y termina en
 * un punto (la meta). Resume la idea del producto: avanzar por etapas.
 */
export function BrandMark({ size = 44 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" accessibilityLabel="ASCENDX AI">
      <Rect x="0" y="0" width="44" height="44" rx="13" fill={colors.primary} />
      <Path
        d="M10 31 L18 23 L24 27 L33 15"
        stroke={colors.onPrimary}
        strokeWidth={3.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx="33" cy="15" r="3.6" fill={colors.onPrimary} />
    </Svg>
  );
}
