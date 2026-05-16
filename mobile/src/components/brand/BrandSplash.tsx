import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { BrandLogo } from './BrandLogo';
import { theme } from '@/constants/theme';

const SPLASH_MS = 2600;

interface BrandSplashProps {
  onFinish: () => void;
}

export function BrandSplash({ onFinish }: BrandSplashProps) {
  const [done, setDone] = useState(false);
  const overlayOpacity = useSharedValue(1);
  const logoScale = useSharedValue(0.92);
  const logoOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  const finish = useCallback(() => {
    setDone(true);
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSequence(
      withTiming(1, { duration: 750, easing: Easing.out(Easing.cubic) }),
      withDelay(400, withTiming(1.02, { duration: 600, easing: Easing.inOut(Easing.ease) })),
      withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
    );
    glowOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));

    overlayOpacity.value = withDelay(
      SPLASH_MS - 450,
      withTiming(0, { duration: 450, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(finish)();
      }),
    );
  }, [overlayOpacity, logoOpacity, logoScale, glowOpacity, finish]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value * 0.35 }));

  if (done) return null;

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="box-none">
      <View style={styles.center}>
        <Animated.View style={[styles.glow, glowStyle]} />
        <Animated.View style={logoStyle}>
          <BrandLogo size="lg" />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.background,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.brandPurple,
    shadowColor: theme.colors.brandCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 48,
  },
});
