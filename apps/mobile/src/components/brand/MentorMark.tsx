import { useEffect, useId, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/theme/useTheme';

/**
 * Identidad del mentor de IA (sección 15.6): un símbolo geométrico abstracto
 * —un rombo facetado con un resplandor violeta discreto— en lugar de un
 * avatar o un robot. Aparece una sola vez con una transición breve; respeta
 * la preferencia de reducir movimiento.
 */
export function MentorMark({ size = 56, animate = false }: { size?: number; animate?: boolean }) {
  const { colors } = useTheme();
  const id = useId().replace(/:/g, '');
  const [appear] = useState(() => new Animated.Value(animate ? 0 : 1));

  useEffect(() => {
    if (!animate) return;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        appear.setValue(1);
        return;
      }
      Animated.timing(appear, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
    return () => {
      cancelled = true;
    };
  }, [animate, appear]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        opacity: appear,
        transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Defs>
          <RadialGradient id={`glow-${id}`} cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={colors.violet} stopOpacity={0.35} />
            <Stop offset="1" stopColor={colors.violet} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id={`edge-${id}`} x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.violet} />
            <Stop offset="1" stopColor={colors.mint} />
          </LinearGradient>
        </Defs>
        <Circle cx="32" cy="32" r="32" fill={`url(#glow-${id})`} />
        {/* Rombo exterior */}
        <Path d="M32 10 L54 32 L32 54 L10 32 Z" stroke={`url(#edge-${id})`} strokeWidth={3} strokeLinejoin="round" fill="none" />
        {/* Facetas: el rombo se divide en cuatro planos */}
        <Path d="M32 10 L32 54 M10 32 L54 32" stroke={colors.violet} strokeOpacity={0.35} strokeWidth={1.5} />
        {/* Núcleo */}
        <Path d="M32 24 L40 32 L32 40 L24 32 Z" fill={`url(#edge-${id})`} />
      </Svg>
    </Animated.View>
  );
}
