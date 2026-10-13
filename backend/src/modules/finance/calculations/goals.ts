/**
 * Progreso y viabilidad de metas financieras.
 */
import { assertNonNegative, roundCop } from './money.js';
import { monthsToReachTarget, requiredMonthlyContribution } from './savings.js';

export interface GoalProgress {
  saved: number;
  remaining: number;
  /** 0–100 (se limita a 100 aunque se haya ahorrado de más) */
  percent: number;
  completed: boolean;
}

export function goalProgress(targetAmount: number, initialAmount: number, contributions: number): GoalProgress {
  assertNonNegative(targetAmount, 'El valor objetivo');
  assertNonNegative(initialAmount, 'El ahorro inicial');
  assertNonNegative(contributions, 'Los aportes');
  const saved = roundCop(initialAmount + contributions);
  const remaining = roundCop(Math.max(0, targetAmount - saved));
  const percent = targetAmount === 0 ? 100 : Math.min(100, Math.floor((saved / targetAmount) * 1000) / 10);
  return { saved, remaining, percent, completed: remaining === 0 };
}

/**
 * Meses calendario completos entre dos fechas (sin contar el mes de inicio
 * si el día aún no se ha cumplido). Ej.: 15-ene → 15-abr = 3.
 */
export function monthsBetween(from: Date, to: Date): number {
  let months = (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
  if (to.getUTCDate() < from.getUTCDate()) months -= 1;
  return Math.max(0, months);
}

/** Suma `months` meses a una fecha, ajustando al último día si el mes es más corto. */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return result;
}

export type GoalPlanStatus =
  | 'COMPLETED' // Ya se alcanzó
  | 'ON_TRACK' // Con el aporte previsto se llega a tiempo
  | 'AT_RISK' // Con el aporte previsto se llega después de la fecha deseada
  | 'NO_TARGET_DATE' // No hay fecha deseada; solo se proyecta
  | 'NO_CONTRIBUTION' // No hay aporte mensual previsto
  | 'DATE_PASSED'; // La fecha deseada ya pasó sin completar la meta

export interface GoalPlan {
  status: GoalPlanStatus;
  progress: GoalProgress;
  /** Meses que faltan con el aporte previsto (null si no se alcanza). */
  projectedMonths: number | null;
  projectedDate: Date | null;
  /** Aporte mensual necesario para llegar en la fecha deseada. */
  requiredMonthly: number | null;
  monthsUntilTargetDate: number | null;
}

export interface GoalPlanInput {
  targetAmount: number;
  initialAmount: number;
  contributions: number;
  targetDate?: Date | null;
  /** Aporte mensual que el usuario planea destinar a esta meta. */
  plannedMonthlyContribution: number;
  today: Date;
}

export function planGoal(input: GoalPlanInput): GoalPlan {
  const progress = goalProgress(input.targetAmount, input.initialAmount, input.contributions);
  const datePassed = input.targetDate ? input.targetDate.getTime() <= input.today.getTime() : false;
  // Si la fecha es futura pero en menos de un mes, se cuenta como 1 mes (un último aporte).
  const monthsUntilTargetDate = input.targetDate
    ? datePassed
      ? 0
      : Math.max(1, monthsBetween(input.today, input.targetDate))
    : null;

  if (progress.completed) {
    return {
      status: 'COMPLETED',
      progress,
      projectedMonths: 0,
      projectedDate: input.today,
      requiredMonthly: 0,
      monthsUntilTargetDate,
    };
  }

  const projectedMonths =
    input.plannedMonthlyContribution > 0
      ? monthsToReachTarget(progress.remaining, 0, input.plannedMonthlyContribution)
      : null;
  const projectedDate = projectedMonths !== null ? addMonths(input.today, projectedMonths) : null;
  const requiredMonthly =
    monthsUntilTargetDate !== null && monthsUntilTargetDate > 0
      ? requiredMonthlyContribution(progress.remaining, monthsUntilTargetDate)
      : null;

  let status: GoalPlanStatus;
  if (datePassed) status = 'DATE_PASSED';
  else if (projectedMonths === null) status = 'NO_CONTRIBUTION';
  else if (monthsUntilTargetDate === null) status = 'NO_TARGET_DATE';
  else status = projectedMonths <= monthsUntilTargetDate ? 'ON_TRACK' : 'AT_RISK';

  return { status, progress, projectedMonths, projectedDate, requiredMonthly, monthsUntilTargetDate };
}
