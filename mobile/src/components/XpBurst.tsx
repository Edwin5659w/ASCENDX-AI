import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { AppTheme } from '@/constants/theme';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

interface XpBurstProps {
  amount: number;
  visible: boolean;
  onDone?: () => void;
}

function createStyles(theme: AppTheme) {
  return {
    burst: {
      position: 'absolute' as const,
      right: 8,
      top: 4,
      backgroundColor: theme.colors.primary + 'dd',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      zIndex: 2,
    },
    text: { color: '#fff', fontSize: 12, fontWeight: '800' as const },
  };
}

/** Chip +XP que sube y se desvanece sobre la fila completada. */
export function XpBurst({ amount, visible, onDone }: XpBurstProps) {
  const styles = useThemedStyles(createStyles);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    if (!visible || amount <= 0) return;
    opacity.value = 0;
    translateY.value = 8;
    opacity.value = withTiming(1, { duration: 140 });
    translateY.value = withTiming(-28, { duration: 700, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(0, { duration: 700, easing: Easing.in(Easing.quad) }, (finished) => {
      if (finished && onDone) runOnJS(onDone)();
    });
  }, [visible, amount, opacity, translateY, onDone]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible || amount <= 0) return null;

  return (
    <Animated.View style={[styles.burst, style]} pointerEvents="none">
      <Text style={styles.text}>+{amount} XP</Text>
    </Animated.View>
  );
}
