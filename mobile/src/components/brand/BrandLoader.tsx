import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { AppTheme } from '@/constants/theme';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

interface BrandLoaderProps {
  label?: string;
}

function createStyles(theme: AppTheme) {
  return {
    wrap: { alignItems: 'center' as const, gap: 12 },
    ring: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderTopColor: theme.colors.brandCyan,
      borderRightColor: theme.colors.brandMagenta,
    },
    label: { color: theme.colors.textMuted, fontSize: 14 },
  };
}

export function BrandLoader({ label }: BrandLoaderProps) {
  const styles = useThemedStyles(createStyles);
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 900, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.wrap} accessibilityRole="progressbar">
      <Animated.View style={[styles.ring, spinStyle]} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}
