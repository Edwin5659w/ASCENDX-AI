/**
 * Conversión de tasas de interés.
 *
 * En Colombia los créditos suelen expresarse en tasa efectiva anual (E.A.)
 * o mensual vencida (M.V.). Internamente todos los cálculos usan tasa
 * mensual efectiva.
 *
 * Las tasas se manejan como fracción: 0.245 = 24,5 %.
 */

export type RateType = 'EFFECTIVE_ANNUAL' | 'MONTHLY';

/** Tasa máxima aceptada como entrada razonable (200 % E.A.), para detectar errores de digitación. */
export const MAX_REASONABLE_ANNUAL_RATE = 2;

/** Convierte una tasa efectiva anual a tasa mensual equivalente: i_m = (1 + EA)^(1/12) − 1 */
export function effectiveAnnualToMonthly(effectiveAnnual: number): number {
  assertValidRate(effectiveAnnual);
  return Math.pow(1 + effectiveAnnual, 1 / 12) - 1;
}

/** Convierte una tasa mensual a efectiva anual equivalente: EA = (1 + i_m)^12 − 1 */
export function monthlyToEffectiveAnnual(monthly: number): number {
  assertValidRate(monthly);
  return Math.pow(1 + monthly, 12) - 1;
}

/** Devuelve la tasa mensual efectiva para cualquier forma de expresar la tasa. */
export function toMonthlyRate(rate: number, type: RateType): number {
  return type === 'EFFECTIVE_ANNUAL' ? effectiveAnnualToMonthly(rate) : (assertValidRate(rate), rate);
}

function assertValidRate(rate: number): void {
  if (!Number.isFinite(rate) || rate < 0) {
    throw new RangeError('La tasa de interés debe ser un número mayor o igual a 0');
  }
}
