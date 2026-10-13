import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/useTheme';
import { whenIntroDone } from './introState';

/**
 * Ilustración principal de la bienvenida: una ruta que asciende y pasa por
 * varias metas.
 *
 * Animación (≈ 2,6 s, empieza cuando termina la animación del logo):
 * 1. La ruta se dibuja de izquierda a derecha con un punto brillante al frente.
 * 2. Cada meta «se alcanza» justo cuando el punto pasa: el círculo rebota y
 *    aparece su etiqueta.
 * 3. Al llegar a «Vivienda» queda un pulso suave que indica la meta mayor.
 * Las curvas de fondo se mueven muy despacio para dar profundidad.
 *
 * Funciona igual en Android y en la vista previa web (solo usa opacidad,
 * escala, posición y ancho). Con «reducir movimiento» se muestra completa y quieta.
 */

const VIEW_W = 360;
const VIEW_H = 230;
const START = { x: 14, y: 206 };
const END_X = 340;

/** Ruta como tres curvas cúbicas (equivale a la versión con «S»). */
const SEGMENTS: [number, number, number, number, number, number, number, number][] = [
  [14, 206, 62, 202, 78, 172, 112, 160],
  [112, 160, 146, 148, 182, 130, 214, 106],
  [214, 106, 246, 82, 296, 52, 340, 34],
];
const PATH =
  `M${START.x} ${START.y} ` +
  SEGMENTS.map(([, , c1x, c1y, c2x, c2y, x, y]) => `C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x} ${y}`).join(' ');
const AREA = `${PATH} L ${END_X} ${VIEW_H} L ${START.x} ${VIEW_H} Z`;

/** Puntos de la ruta muestreados para que el punto brillante la siga. */
const SAMPLES = (() => {
  const points: { x: number; y: number }[] = [];
  SEGMENTS.forEach(([x0, y0, c1x, c1y, c2x, c2y, x1, y1], index) => {
    for (let i = index === 0 ? 0 : 1; i <= 16; i++) {
      const t = i / 16;
      const u = 1 - t;
      points.push({
        x: u * u * u * x0 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x1,
        y: u * u * u * y0 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y1,
      });
    }
  });
  return points;
})();
/** Avance (0–1) en el que la ruta llega a cada x. */
const at = (x: number) => (x - START.x) / (END_X - START.x);

const MILESTONES = [
  { x: 112, y: 160, label: 'Fondo de emergencia', align: 'below' as const },
  { x: 214, y: 106, label: 'Moto', align: 'right' as const },
  { x: 340, y: 34, label: 'Vivienda', align: 'left' as const },
];
const FINAL = MILESTONES.length - 1;

const CONTOURS = [
  'M-30 120 C 80 100, 160 140, 400 70',
  'M-30 160 C 90 140, 180 175, 400 115',
  'M-30 200 C 100 182, 200 210, 400 160',
  'M-30 80 C 70 64, 170 96, 400 26',
];

export function AscentHero() {
  const { colors, radius, spacing } = useTheme();
  const [width, setWidth] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [values] = useState(() => ({
    progress: new Animated.Value(0),
    pulse: new Animated.Value(0),
    drift: new Animated.Value(0),
  }));

  useEffect(() => {
    const { progress, pulse, drift } = values;
    let cancelled = false;
    let loops: Animated.CompositeAnimation[] = [];

    const stopIntro = whenIntroDone(() => {
      AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
        if (cancelled) return;
        if (reduce) {
          progress.setValue(1);
          return;
        }
        const driftLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(drift, { toValue: 1, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(drift, { toValue: 0, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ]),
        );
        driftLoop.start();
        loops.push(driftLoop);

        Animated.timing(progress, {
          toValue: 1,
          duration: 2600,
          delay: 150,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }).start(({ finished }) => {
          if (!finished || cancelled) return;
          setArrived(true);
          const pulseLoop = Animated.loop(
            Animated.sequence([
              Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
              Animated.delay(500),
            ]),
            { resetBeforeIteration: true },
          );
          pulseLoop.start();
          loops.push(pulseLoop);
        });
      });
    });

    return () => {
      cancelled = true;
      stopIntro();
      loops.forEach((loop) => loop.stop());
      loops = [];
    };
  }, [values]);

  const { progress, pulse, drift } = values;
  const k = width / VIEW_W; // puntos de pantalla por unidad del dibujo
  const height = width ? VIEW_H * k : 0;

  const revealWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [START.x * k, (END_X + 12) * k],
  });
  const headX = progress.interpolate({
    inputRange: SAMPLES.map((p) => at(p.x)),
    outputRange: SAMPLES.map((p) => p.x * k),
  });
  const headY = progress.interpolate({
    inputRange: SAMPLES.map((p) => at(p.x)),
    outputRange: SAMPLES.map((p) => p.y * k),
  });
  const headOpacity = progress.interpolate({ inputRange: [0, 0.03, 0.94, 1], outputRange: [0, 1, 1, 0] });

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <View
      style={styles.container}
      onLayout={onLayout}
      accessible
      accessibilityLabel="Ilustración: una ruta que asciende y alcanza tus metas: fondo de emergencia, moto y vivienda"
    >
      {width > 0 ? (
        <>
          {/* Curvas de fondo con movimiento lento */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { transform: [{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-8 * k, 8 * k] }) }] },
            ]}
          >
            <Svg width={width} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
              {CONTOURS.map((d) => (
                <Path key={d} d={d} stroke={colors.contour} strokeWidth={1.2} fill="none" />
              ))}
            </Svg>
          </Animated.View>

          {/* Ruta y área: se descubren de izquierda a derecha */}
          <Animated.View style={[styles.reveal, { width: revealWidth, height }]}>
            <Svg width={width} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
              <Defs>
                <LinearGradient id="hero-area" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.primary} stopOpacity={0.24} />
                  <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
                </LinearGradient>
                <LinearGradient id="hero-line" x1="0" y1="1" x2="1" y2="0">
                  <Stop offset="0" stopColor={colors.primary} />
                  <Stop offset="1" stopColor={colors.mint} />
                </LinearGradient>
              </Defs>
              <Path d={AREA} fill="url(#hero-area)" />
              {/* Halo suave bajo la línea */}
              <Path d={PATH} stroke={colors.primary} strokeOpacity={0.18} strokeWidth={10} strokeLinecap="round" fill="none" />
              <Path d={PATH} stroke="url(#hero-line)" strokeWidth={3.5} strokeLinecap="round" fill="none" />
            </Svg>
          </Animated.View>

          {/* Pulso de la meta final (solo después de alcanzarla) */}
          {arrived ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.dot,
              {
                width: 18 * k,
                height: 18 * k,
                left: (MILESTONES[FINAL]!.x - 9) * k,
                top: (MILESTONES[FINAL]!.y - 9) * k,
                borderRadius: 9 * k,
                backgroundColor: colors.mint,
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
                transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }) }],
              },
            ]}
          />
          ) : null}

          {/* Puntos de cada meta: rebotan cuando la ruta los alcanza */}
          {MILESTONES.map((m, index) => {
            const isFinal = index === FINAL;
            const t = at(m.x);
            const size = (isFinal ? 15 : 12) * k;
            return (
              <Animated.View
                key={`dot-${m.label}`}
                pointerEvents="none"
                style={[
                  styles.dot,
                  {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    left: m.x * k - size / 2,
                    top: m.y * k - size / 2,
                    borderWidth: 2.5,
                    borderColor: isFinal ? colors.mint : colors.primary,
                    backgroundColor: isFinal ? colors.mint : colors.background,
                    transform: [
                      {
                        scale: progress.interpolate({
                          inputRange: [0, Math.max(t - 0.02, 0.0001), t, Math.min(t + 0.05, 1)],
                          outputRange: [0, 0, 1.45, 1],
                          extrapolate: 'clamp',
                        }),
                      },
                    ],
                  },
                ]}
              />
            );
          })}

          {/* Punto brillante al frente de la ruta */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.head,
              {
                opacity: headOpacity,
                transform: [{ translateX: headX }, { translateY: headY }],
              },
            ]}
          >
            <View style={[styles.headGlow, { backgroundColor: colors.mint }]} />
            <View style={[styles.headCore, { backgroundColor: '#FFFFFF' }]} />
          </Animated.View>

          {/* Etiquetas de las metas */}
          {MILESTONES.map((m, index) => {
            const isFinal = index === FINAL;
            const t = at(m.x);
            const appear = progress.interpolate({
              inputRange: [Math.max(t - 0.01, 0), Math.min(t + 0.08, 1)],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={m.label}
                pointerEvents="none"
                style={[
                  styles.chip,
                  {
                    top: (m.align === 'below' ? m.y + 14 : m.y - 34) * k,
                    ...(m.align === 'left'
                      ? { right: (VIEW_W - m.x + 12) * k }
                      : { left: (m.align === 'below' ? m.x - 14 : m.x + 10) * k }),
                    backgroundColor: colors.surface,
                    borderColor: isFinal ? colors.mint : colors.border,
                    borderRadius: radius.pill,
                    paddingHorizontal: spacing.md,
                    opacity: appear,
                    transform: [
                      { translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
                      { scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
                    ],
                  },
                ]}
              >
                <AppText variant="label" color={isFinal ? 'mint' : 'text'}>
                  {m.label}
                </AppText>
              </Animated.View>
            );
          })}
        </>
      ) : null}
    </View>
  );
}

const HEAD = 22;

const styles = StyleSheet.create({
  container: { width: '100%', aspectRatio: VIEW_W / VIEW_H },
  reveal: { position: 'absolute', left: 0, top: 0, overflow: 'hidden' },
  dot: { position: 'absolute' },
  head: {
    position: 'absolute',
    left: -HEAD / 2,
    top: -HEAD / 2,
    width: HEAD,
    height: HEAD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headGlow: { position: 'absolute', width: HEAD, height: HEAD, borderRadius: HEAD / 2, opacity: 0.35 },
  headCore: { width: 9, height: 9, borderRadius: 4.5 },
  chip: { position: 'absolute', borderWidth: 1, paddingVertical: 6 },
});
