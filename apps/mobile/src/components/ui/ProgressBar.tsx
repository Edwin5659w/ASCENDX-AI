import { View } from 'react-native';
import { useCountUp } from '@/components/motion';
import { useTheme } from '@/theme/useTheme';

/** Barra de progreso de 0 a 1. Se llena con una animación al aparecer o cambiar. */
export function ProgressBar({ value, label }: { value: number; label: string }) {
  const { colors, radius } = useTheme();
  const clamped = Math.max(0, Math.min(1, value));
  const shown = useCountUp(clamped, { duration: 1000 });
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={{ height: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}
    >
      <View style={{ width: `${shown * 100}%`, height: '100%', backgroundColor: colors.primary, borderRadius: radius.pill }} />
    </View>
  );
}
