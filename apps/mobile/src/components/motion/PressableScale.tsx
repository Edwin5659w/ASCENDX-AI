import { useState } from 'react';
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { haptic, type HapticKind } from './haptics';
import { useReducedMotion } from './useReducedMotion';

interface PressableScaleProps extends PressableProps {
  /** Escala al presionar (1 = sin efecto). */
  scaleTo?: number;
  /** Vibración al tocar. */
  hapticKind?: HapticKind;
  /** Estilo del contenedor animado (p. ej. flex: 1 cuando el botón comparte fila). */
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Elemento tocable con respuesta física: se hunde un poco al presionar,
 * rebota al soltar y vibra suave. Respeta «reducir movimiento».
 */
export function PressableScale({
  scaleTo = 0.97,
  hapticKind = 'selection',
  containerStyle,
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  ...props
}: PressableScaleProps) {
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));

  const animateTo = (toValue: number, release: boolean) => {
    if (reduced) return;
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: release ? 18 : 50,
      bounciness: release ? 10 : 0,
    }).start();
  };

  return (
    <Animated.View style={[containerStyle, { transform: [{ scale }] }]}>
      <Pressable
        disabled={disabled}
        onPressIn={(event) => {
          animateTo(scaleTo, false);
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          animateTo(1, true);
          onPressOut?.(event);
        }}
        onPress={(event) => {
          haptic(hapticKind);
          onPress?.(event);
        }}
        {...props}
      />
    </Animated.View>
  );
}
