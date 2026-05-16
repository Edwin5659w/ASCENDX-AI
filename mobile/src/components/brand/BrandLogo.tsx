import { useEffect } from 'react';
import { Image, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '@/constants/theme';

const logoSource = require('@/assets/brand/logo-full.png');

type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const heights: Record<BrandLogoSize, number> = {
  xs: theme.logo.sizes.xs,
  sm: theme.logo.sizes.sm,
  md: theme.logo.sizes.md,
  lg: theme.logo.sizes.lg,
  xl: theme.logo.sizes.xl,
};

interface BrandLogoProps {
  size?: BrandLogoSize;
  style?: StyleProp<ViewStyle>;
  animate?: boolean;
  breathe?: boolean;
}

export function BrandLogo({ size = 'md', style, animate = false, breathe = false }: BrandLogoProps) {
  const opacity = useSharedValue(animate ? 0 : 1);
  const translateY = useSharedValue(animate ? 14 : 0);
  const scale = useSharedValue(animate ? 0.94 : 1);
  const breatheScale = useSharedValue(1);

  useEffect(() => {
    if (!animate) return;
    opacity.value = withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(0, { duration: 550, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) });
  }, [animate, opacity, translateY, scale]);

  useEffect(() => {
    if (!breathe) return;
    breatheScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [breathe, breatheScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value * breatheScale.value },
    ],
  }));

  const h = heights[size];

  return (
    <Animated.View style={[styles.wrap, animatedStyle, style]}>
      <Image
        source={logoSource}
        style={{ height: h, width: h * 2.1 }}
        resizeMode="contain"
        accessibilityLabel="ASCENDX AI"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
});
