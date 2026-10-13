/**
 * Tipos de movimiento e indicadores del mes (secciones 6.1 y 6.2).
 *
 * El tipo decide cómo afecta cada indicador, para no contar dos veces el
 * mismo dinero: un pago de deuda no es gasto y un aporte a una meta es
 * ahorro, no gasto.
 */
import { assertPositive, roundPesos } from './money.js';

export const MOVEMENT_TYPES = ['ingreso', 'gasto', 'pago_deuda', 'aporte_meta', 'retiro_meta'] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export interface Movement {
  type: MovementType;
  /** Siempre positivo; el tipo indica el sentido. */
  amount: number;
}

export interface MonthlyIndicators {
  /** I: ingresos */
  income: number;
  /** G: gastos */
  expenses: number;
  /** PD: pagos de deuda */
  debtPayments: number;
  /** AM: aportes netos a metas (aportes − retiros) */
  netGoalContributions: number;
  /** Flujo neto = I − G − PD */
  netFlow: number;
  /** Disponible = flujo neto − AM */
  available: number;
}

/** Efecto de un movimiento sobre el disponible: +1 suma, −1 resta. */
export function availableEffect(type: MovementType): 1 | -1 {
  return type === 'ingreso' || type === 'retiro_meta' ? 1 : -1;
}

/** Solo el tipo «gasto» cuenta como gasto en los indicadores y gráficos. */
export function countsAsExpense(type: MovementType): boolean {
  return type === 'gasto';
}

export function monthlyIndicators(movements: readonly Movement[]): MonthlyIndicators {
  const totals: Record<MovementType, number> = {
    ingreso: 0,
    gasto: 0,
    pago_deuda: 0,
    aporte_meta: 0,
    retiro_meta: 0,
  };
  for (const movement of movements) {
    assertPositive(movement.amount, 'El monto del movimiento');
    totals[movement.type] += movement.amount;
  }
  const netFlow = totals.ingreso - totals.gasto - totals.pago_deuda;
  const netGoalContributions = totals.aporte_meta - totals.retiro_meta;
  return {
    income: roundPesos(totals.ingreso),
    expenses: roundPesos(totals.gasto),
    debtPayments: roundPesos(totals.pago_deuda),
    netGoalContributions: roundPesos(netGoalContributions),
    netFlow: roundPesos(netFlow),
    available: roundPesos(netFlow - netGoalContributions),
  };
}

/** Total por categoría, solo para movimientos de tipo «gasto». */
export function expensesByCategory<T extends Movement & { categoryId: string }>(
  movements: readonly T[],
): { categoryId: string; total: number }[] {
  const totals = new Map<string, number>();
  for (const movement of movements) {
    if (!countsAsExpense(movement.type)) continue;
    totals.set(movement.categoryId, (totals.get(movement.categoryId) ?? 0) + movement.amount);
  }
  return [...totals.entries()]
    .map(([categoryId, total]) => ({ categoryId, total: roundPesos(total) }))
    .sort((a, b) => b.total - a.total);
}

/**
 * RF-09: posible duplicado si hay otro movimiento con el mismo monto, tipo y
 * categoría registrado con menos de 2 minutos de diferencia.
 */
export const DUPLICATE_WINDOW_MS = 2 * 60 * 1000;

export interface TimedMovement extends Movement {
  categoryId: string | null;
  createdAt: Date;
}

export function isPossibleDuplicate(candidate: TimedMovement, recent: readonly TimedMovement[]): boolean {
  return recent.some(
    (other) =>
      other.type === candidate.type &&
      other.amount === candidate.amount &&
      other.categoryId === candidate.categoryId &&
      Math.abs(other.createdAt.getTime() - candidate.createdAt.getTime()) < DUPLICATE_WINDOW_MS,
  );
}
