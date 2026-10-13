import { formatCop } from '@/lib/format';
import { useCountUp } from '@/components/motion';
import { AppText } from './AppText';
import type { ComponentProps } from 'react';

type AppTextProps = ComponentProps<typeof AppText>;

interface AnimatedAmountProps extends Omit<AppTextProps, 'children'> {
  /** Valor en pesos. */
  value: number;
  /** Formato del número (por defecto, pesos colombianos). */
  format?: (value: number) => string;
  delay?: number;
}

/**
 * Monto que «cuenta» hasta su valor al aparecer o cambiar. El lector de
 * pantalla siempre recibe el valor final, no los intermedios.
 */
export function AnimatedAmount({ value, format = formatCop, delay = 0, style, ...props }: AnimatedAmountProps) {
  const shown = useCountUp(value, { delay });
  return (
    <AppText accessibilityLabel={format(value)} style={[{ fontVariant: ['tabular-nums'] }, style]} {...props}>
      {format(Math.round(shown))}
    </AppText>
  );
}
