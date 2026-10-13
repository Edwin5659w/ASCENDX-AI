import { useId, type ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/theme/useTheme';

interface ProgressRingProps {
  /** 0 a 1 */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** Marcas de hitos (fracciones), p. ej. [0.25, 0.5, 0.75] */
  milestones?: readonly number[];
  /** Contenido en el centro (porcentaje, ícono…) */
  children?: ReactNode;
  accessibilityLabel: string;
}

/**
 * Anillo de progreso para metas (sección 15.5). El avance se dibuja con el
 * degradado de marca y los hitos como marcas discretas. El valor siempre se
 * acompaña de texto en el centro o al lado: nunca solo con color.
 */
export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  milestones = [],
  children,
  accessibilityLabel,
}: ProgressRingProps) {
  const { colors } = useTheme();
  const gradientId = `ring-${useId().replace(/:/g, '')}`;
  const clamped = Math.max(0, Math.min(1, value));
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const center = size / 2;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      {/* Se rota el lienzo −90° para que el progreso empiece arriba. */}
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.primary} />
            <Stop offset="1" stopColor={colors.mint} />
          </LinearGradient>
        </Defs>
        <Circle cx={center} cy={center} r={r} stroke={colors.border} strokeWidth={strokeWidth} fill="none" />
          {clamped > 0 ? (
            <Circle
              cx={center}
              cy={center}
              r={r}
              stroke={`url(#${gradientId})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${c * clamped} ${c}`}
              fill="none"
            />
          ) : null}
          {milestones.map((m) => {
            const angle = 2 * Math.PI * m;
            const inner = r - strokeWidth / 2 - 2;
            const outer = r + strokeWidth / 2 + 2;
            return (
              <Circle
                key={m}
                cx={center + ((inner + outer) / 2) * Math.cos(angle)}
                cy={center + ((inner + outer) / 2) * Math.sin(angle)}
                r={1.8}
                fill={clamped >= m ? colors.onPrimary : colors.textSubtle}
              />
            );
          })}
      </Svg>
      {children}
    </View>
  );
}
