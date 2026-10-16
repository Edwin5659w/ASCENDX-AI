import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from './useReducedMotion';
import { NATIVE_DRIVER } from './nativeDriver';

interface FadeInProps {
  children: ReactNode;
  /** Retraso en ms (para entradas escalonadas). */
  delay?: number;
  /** Desplazamiento vertical inicial en puntos. */
  offset?: number;
  style?: StyleProp<ViewStyle>;
}

/** Aparece desvaneciéndose y subiendo un poco. Con «reducir movimiento» solo se muestra. */
export function FadeIn({ children, delay = 0, offset = 14, style }: FadeInProps) {
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, delay, reduced]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
