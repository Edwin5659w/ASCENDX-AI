import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { darkPalette } from '@/theme/tokens';
import { Wordmark } from './BrandMark';
import { LOGO_ASPECT, LogoSymbol, type LogoPart } from './LogoSymbol';

interface IntroAnimationProps {
  /** La app terminó de cargar (fuentes y sesión). */
  ready: boolean;
  /** Se llama cuando la animación terminó y la capa desapareció. */
  onFinish: () => void;
}

const easeOut = Easing.out(Easing.cubic);

/**
 * Animación de inicio con el logo oficial (≈ 1,8 s).
 *
 * Cuenta una sola idea: las piezas del símbolo se ordenan y la flecha
 * asciende. 1) Aparece un resplandor; 2) entran las barras de la «E»;
 * 3) se forma la «M»; 4) la flecha sube a su lugar; 5) aparece el nombre.
 * Después se desvanece cuando la app está lista.
 *
 * Con «reducir movimiento» activado se muestra el logo completo sin
 * desplazamientos y solo se desvanece (sección 15.9).
 */
export function IntroAnimation({ ready, onFinish }: IntroAnimationProps) {
  const { width: screenWidth } = useWindowDimensions();
  const symbolWidth = Math.min(screenWidth * 0.58, 260);
  const symbolHeight = symbolWidth / LOGO_ASPECT;

  const [values] = useState(() => ({
    glow: new Animated.Value(0),
    bar: new Animated.Value(0),
    hook: new Animated.Value(0),
    base: new Animated.Value(0),
    arrow: new Animated.Value(0),
    wordmark: new Animated.Value(0),
    overlay: new Animated.Value(1),
  }));
  const [played, setPlayed] = useState(false);

  // 1. Secuencia de entrada
  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        Object.entries(values).forEach(([key, value]) => key !== 'overlay' && value.setValue(1));
        setTimeout(() => !cancelled && setPlayed(true), 500);
        return;
      }
      const timing = (value: Animated.Value, duration: number, delay: number, easing = easeOut) =>
        Animated.timing(value, { toValue: 1, duration, delay, easing, useNativeDriver: true });
      Animated.parallel([
        timing(values.glow, 600, 0),
        timing(values.bar, 420, 120),
        timing(values.hook, 420, 240),
        timing(values.base, 520, 300),
        timing(values.arrow, 560, 650, Easing.out(Easing.back(1.6))),
        timing(values.wordmark, 500, 1050),
      ]).start(() => {
        if (!cancelled) setTimeout(() => !cancelled && setPlayed(true), 250);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [values]);

  // 2. Salida cuando la animación terminó y la app está lista
  useEffect(() => {
    if (!played || !ready) return;
    Animated.timing(values.overlay, { toValue: 0, duration: 320, easing: easeOut, useNativeDriver: true }).start(() =>
      onFinish(),
    );
  }, [played, ready, values, onFinish]);

  const piece = (part: LogoPart, value: Animated.Value, from: { x?: number; y?: number; scale?: number }) => (
    <Animated.View
      key={part}
      style={[
        StyleSheet.absoluteFill,
        {
          opacity: value,
          transform: [
            { translateX: value.interpolate({ inputRange: [0, 1], outputRange: [from.x ?? 0, 0] }) },
            { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [from.y ?? 0, 0] }) },
            { scale: value.interpolate({ inputRange: [0, 1], outputRange: [from.scale ?? 1, 1] }) },
          ],
        },
      ]}
    >
      <LogoSymbol width={symbolWidth} parts={[part]} />
    </Animated.View>
  );

  const glowSize = symbolWidth * 1.9;

  return (
    <Animated.View
      pointerEvents={played && ready ? 'none' : 'auto'}
      accessibilityLabel="ASCENDX AI, cargando"
      accessibilityLiveRegion="polite"
      style={[styles.overlay, { backgroundColor: darkPalette.background, opacity: values.overlay }]}
    >
      <View style={{ alignItems: 'center', gap: symbolWidth * 0.14 }}>
        <View style={{ width: symbolWidth, height: symbolHeight }}>
          {/* Resplandor detrás del símbolo */}
          <Animated.View
            style={{
              position: 'absolute',
              left: (symbolWidth - glowSize) / 2,
              top: (symbolHeight - glowSize) / 2,
              opacity: values.glow,
              transform: [{ scale: values.glow.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
            }}
          >
            <Svg width={glowSize} height={glowSize}>
              <Defs>
                <RadialGradient id="intro-glow" cx="0.5" cy="0.5" r="0.5">
                  <Stop offset="0" stopColor="#3B5BFF" stopOpacity={0.32} />
                  <Stop offset="0.55" stopColor="#7A18FA" stopOpacity={0.1} />
                  <Stop offset="1" stopColor="#7A18FA" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={glowSize / 2} cy={glowSize / 2} r={glowSize / 2} fill="url(#intro-glow)" />
            </Svg>
          </Animated.View>

          {piece('bar', values.bar, { x: -symbolWidth * 0.12 })}
          {piece('hook', values.hook, { x: -symbolWidth * 0.12 })}
          {piece('base', values.base, { scale: 0.94 })}
          {piece('arrow', values.arrow, { y: symbolHeight * 0.22 })}
        </View>

        <Animated.View
          style={{
            opacity: values.wordmark,
            transform: [{ translateY: values.wordmark.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
          }}
        >
          <Wordmark width={symbolWidth * 1.15} forceDark />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
