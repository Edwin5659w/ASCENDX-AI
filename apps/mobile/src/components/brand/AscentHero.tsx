import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/useTheme';

/**
 * Ilustración principal de la bienvenida: una ruta que asciende y pasa por
 * varias metas. Se dibuja una sola vez al abrir la pantalla (respeta la
 * opción del sistema de reducir movimiento).
 */

const VIEW_W = 360;
const VIEW_H = 230;
const PATH = 'M14 206 C 62 202, 78 172, 112 160 S 182 130, 214 106 S 296 52, 340 34';
const PATH_LENGTH = 470;
const AREA = `${PATH} L 340 230 L 14 230 Z`;

const MILESTONES = [
  { x: 112, y: 160, label: 'Fondo de emergencia', align: 'below' as const },
  { x: 214, y: 106, label: 'Moto', align: 'right' as const },
  { x: 340, y: 34, label: 'Vivienda', align: 'left' as const },
];

const CONTOURS = [
  'M-10 120 C 80 100, 160 140, 380 70',
  'M-10 160 C 90 140, 180 175, 380 115',
  'M-10 200 C 100 182, 200 210, 380 160',
  'M-10 80 C 70 64, 170 96, 380 26',
];

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function AscentHero() {
  const { colors, radius, spacing } = useTheme();
  const [progress] = useState(() => new Animated.Value(0));
  const [chips] = useState(() => MILESTONES.map(() => new Animated.Value(0)));

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        progress.setValue(1);
        chips.forEach((chip) => chip.setValue(1));
        return;
      }
      Animated.parallel([
        Animated.timing(progress, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.stagger(
          380,
          chips.map((chip) =>
            Animated.timing(chip, { toValue: 1, duration: 420, delay: 380, useNativeDriver: true }),
          ),
        ),
      ]).start();
    });
    return () => {
      cancelled = true;
    };
  }, [progress, chips]);

  const dashOffset = progress.interpolate({ inputRange: [0, 1], outputRange: [PATH_LENGTH, 0] });

  return (
    <View style={styles.container} accessible accessibilityLabel="Ilustración: una ruta que asciende pasando por varias metas">
      <Svg width="100%" height="100%" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid meet">
        <Defs>
          <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.primary} stopOpacity={0.18} />
            <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="line" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.primary} />
            <Stop offset="1" stopColor={colors.mint} />
          </LinearGradient>
        </Defs>
        {CONTOURS.map((d) => (
          <Path key={d} d={d} stroke={colors.contour} strokeWidth={1.2} fill="none" />
        ))}
        <Path d={AREA} fill="url(#area)" />
        {Platform.OS === 'web' ? (
          // En la vista previa web se dibuja estática (react-native-svg web no anima trazos).
          <Path d={PATH} stroke="url(#line)" strokeWidth={3.5} strokeLinecap="round" fill="none" />
        ) : (
        <AnimatedPath
          d={PATH}
          stroke="url(#line)"
          strokeWidth={3.5}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${PATH_LENGTH} ${PATH_LENGTH}`}
          strokeDashoffset={dashOffset}
        />
        )}
        {MILESTONES.map((m, index) => (
          <Circle
            key={m.label}
            cx={m.x}
            cy={m.y}
            r={index === MILESTONES.length - 1 ? 7 : 5.5}
            fill={index === MILESTONES.length - 1 ? colors.mint : colors.background}
            stroke={index === MILESTONES.length - 1 ? colors.mint : colors.primary}
            strokeWidth={2.5}
          />
        ))}
      </Svg>

      {MILESTONES.map((m, index) => (
        <Animated.View
          key={m.label}
          pointerEvents="none"
          style={[
            styles.chip,
            {
              top: `${((m.align === 'below' ? m.y + 14 : m.y - 34) / VIEW_H) * 100}%`,
              ...(m.align === 'left'
                ? { right: `${((VIEW_W - m.x + 12) / VIEW_W) * 100}%` }
                : { left: `${((m.align === 'below' ? m.x - 14 : m.x + 10) / VIEW_W) * 100}%` }),
              backgroundColor: colors.surface,
              borderColor: index === MILESTONES.length - 1 ? colors.mint : colors.border,
              borderRadius: radius.pill,
              paddingHorizontal: spacing.md,
              opacity: chips[index],
              transform: [{ translateY: chips[index]!.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
            },
          ]}
        >
          <AppText variant="label" color={index === MILESTONES.length - 1 ? 'mint' : 'text'}>
            {m.label}
          </AppText>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', aspectRatio: VIEW_W / VIEW_H },
  chip: { position: 'absolute', borderWidth: 1, paddingVertical: 6 },
});
