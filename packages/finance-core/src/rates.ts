/**
 * Tasas de interés (sección 6.4). Se manejan como fracción: 0.245 = 24,5 %.
 * EA = efectiva anual; MV = mensual vencida. Internamente todo es mensual.
 */

export type RateType = 'EA' | 'MV';

/** Validación del v2: la tasa debe estar entre 0 % y 100 % efectiva anual. */
export const MAX_EFFECTIVE_ANNUAL_RATE = 1;

/** i_m = (1 + EA)^(1/12) − 1 */
export function effectiveAnnualToMonthly(effectiveAnnual: number): number {
  assertRate(effectiveAnnual);
  return Math.pow(1 + effectiveAnnual, 1 / 12) - 1;
}

/** EA = (1 + i_m)^12 − 1 */
export function monthlyToEffectiveAnnual(monthly: number): number {
  assertRate(monthly);
  return Math.pow(1 + monthly, 12) - 1;
}

export function toMonthlyRate(rate: number, type: RateType): number {
  if (type === 'EA') return effectiveAnnualToMonthly(rate);
  assertRate(rate);
  return rate;
}

export function toEffectiveAnnualRate(rate: number, type: RateType): number {
  return type === 'EA' ? (assertRate(rate), rate) : monthlyToEffectiveAnnual(rate);
}

/** Lanza un error si la tasa equivale a más de 100 % E.A. */
export function assertRateWithinLimit(rate: number, type: RateType): void {
  if (toEffectiveAnnualRate(rate, type) > MAX_EFFECTIVE_ANNUAL_RATE + 1e-12) {
    throw new RangeError('La tasa debe estar entre 0 % y 100 % efectiva anual');
  }
}

function assertRate(rate: number): void {
  if (!Number.isFinite(rate) || rate < 0) {
    throw new RangeError('La tasa de interés debe ser un número mayor o igual a 0');
  }
}
