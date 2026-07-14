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

const SPLASH_MS = 900;

interface BrandSplashProps {
  onFinish: () => void;
  tagline?: string;
}

export function BrandSplash({
  onFinish,
  tagline = 'Tu Life OS · metas, hábitos y mentor',
}: BrandSplashProps) {
  const [done, setDone] = useState(false);
  const overlayOpacity = useSharedValue(1);
  const logoScale = useSharedValue(0.92);
  const logoOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const tagOpacity = useSharedValue(0);

  const finish = useCallback(() => {
    setDone(true);
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSequence(
      withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) }),
      withDelay(220, withTiming(1.02, { duration: 420, easing: Easing.inOut(Easing.ease) })),
      withTiming(1, { duration: 360, easing: Easing.inOut(Easing.ease) }),
    );
    glowOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    tagOpacity.value = withDelay(280, withTiming(1, { duration: 450 }));

    overlayOpacity.value = withDelay(
      SPLASH_MS - 320,
      withTiming(0, { duration: 320, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(finish)();
      }),
    );
  }, [overlayOpacity, logoOpacity, logoScale, glowOpacity, tagOpacity, finish]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value * 0.35 }));
  const tagStyle = useAnimatedStyle(() => ({ opacity: tagOpacity.value }));

  if (done) return null;

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="box-none">
      <View style={styles.center}>
        <Animated.View style={[styles.glow, glowStyle]} />
        <Animated.View style={logoStyle}>
          <BrandLogo size="lg" />
        </Animated.View>
        <Animated.Text style={[styles.tagline, tagStyle]}>{tagline}</Animated.Text>
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
  tagline: {
    marginTop: 20,
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
