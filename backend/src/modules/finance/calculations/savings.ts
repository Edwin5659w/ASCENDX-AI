/**
 * Proyecciones de ahorro mes a mes.
 *
 * Supuesto: los aportes se hacen al final de cada mes y, si se indica una
 * rentabilidad, esta se aplica sobre el saldo al inicio del mes. Por
 * defecto la rentabilidad es 0 para no prometer rendimientos.
 */
import { assertNonNegative, roundCop } from './money.js';

/** Límite de proyección: 50 años. Más allá se considera inalcanzable. */
export const MAX_PROJECTION_MONTHS = 600;

export interface SavingsProjectionInput {
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  /** Rentabilidad mensual esperada (fracción). Por defecto 0. */
  monthlyReturnRate?: number;
  /** Aumento mensual del precio objetivo (inflación del bien). Por defecto 0. */
  monthlyTargetGrowthRate?: number;
}

export interface SavingsProjection {
  /** Meses necesarios, o null si no se alcanza dentro del límite. */
  months: number | null;
  /** Valor objetivo al momento de alcanzarlo (cambia si hay inflación). */
  finalTarget: number;
  /** Saldo proyectado al alcanzar la meta (o al llegar al límite). */
  finalBalance: number;
  totalContributed: number;
  totalReturns: number;
}

export function projectSavings(input: SavingsProjectionInput): SavingsProjection {
  const {
    targetAmount,
    currentAmount,
    monthlyContribution,
    monthlyReturnRate = 0,
    monthlyTargetGrowthRate = 0,
  } = input;
  assertNonNegative(targetAmount, 'El valor objetivo');
  assertNonNegative(currentAmount, 'El ahorro actual');
  assertNonNegative(monthlyContribution, 'El aporte mensual');
  assertNonNegative(monthlyReturnRate, 'La rentabilidad mensual');
  assertNonNegative(monthlyTargetGrowthRate, 'El crecimiento del precio');

  let balance = currentAmount;
  let target = targetAmount;
  let contributed = 0;
  let returns = 0;

  if (balance >= target) {
    return result(0);
  }

  for (let month = 1; month <= MAX_PROJECTION_MONTHS; month++) {
    const monthReturn = balance * monthlyReturnRate;
    returns += monthReturn;
    balance += monthReturn + monthlyContribution;
    contributed += monthlyContribution;
    target *= 1 + monthlyTargetGrowthRate;
    if (balance >= target) return result(month);
  }

  return result(null);

  function result(months: number | null): SavingsProjection {
    return {
      months,
      finalTarget: roundCop(target),
      finalBalance: roundCop(balance),
      totalContributed: roundCop(contributed),
      totalReturns: roundCop(returns),
    };
  }
}

/** Atajo: meses para llegar a la meta sin rentabilidad ni inflación. */
export function monthsToReachTarget(targetAmount: number, currentAmount: number, monthlyContribution: number) {
  return projectSavings({ targetAmount, currentAmount, monthlyContribution }).months;
}

/** Aporte mensual necesario para completar `remaining` en `months` meses (sin rentabilidad). */
export function requiredMonthlyContribution(remaining: number, months: number): number {
  assertNonNegative(remaining, 'El monto restante');
  if (remaining === 0) return 0;
  if (!Number.isInteger(months) || months <= 0) {
    throw new RangeError('El número de meses debe ser un entero mayor que 0');
  }
  return Math.ceil(remaining / months);
}
