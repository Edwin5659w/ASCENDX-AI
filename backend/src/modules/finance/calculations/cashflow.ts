/**
 * Resúmenes de ingresos y gastos y estimación de capacidad de ahorro a
 * partir de los movimientos registrados.
 */
import { assertNonNegative, roundCop, sum } from './money.js';

export interface MovementLike {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
}

export interface PeriodSummary {
  income: number;
  expenses: number;
  /** income − expenses (puede ser negativo) */
  net: number;
  /** Porcentaje del ingreso que quedó libre (0–1), null si no hubo ingresos */
  savingsRate: number | null;
}

export function summarizePeriod(movements: readonly MovementLike[]): PeriodSummary {
  for (const movement of movements) assertNonNegative(movement.amount, 'El monto del movimiento');
  const income = sum(movements.filter((m) => m.type === 'INCOME').map((m) => m.amount));
  const expenses = sum(movements.filter((m) => m.type === 'EXPENSE').map((m) => m.amount));
  const net = income - expenses;
  return {
    income: roundCop(income),
    expenses: roundCop(expenses),
    net: roundCop(net),
    savingsRate: income > 0 ? net / income : null,
  };
}

export type EstimateConfidence = 'INSUFFICIENT' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface SavingCapacityEstimate {
  monthsAnalyzed: number;
  averageIncome: number;
  averageExpenses: number;
  averageNet: number;
  /** Capacidad de ahorro mensual estimada (nunca negativa). */
  monthlyCapacity: number;
  /** Peor mes del periodo: sirve para hablar de la variabilidad. */
  worstMonthNet: number | null;
  confidence: EstimateConfidence;
  /** Explicaciones legibles de los supuestos usados. */
  notes: string[];
}

/**
 * Estima la capacidad de ahorro mensual como el promedio del saldo neto de
 * los meses completos analizados. Se descuentan obligaciones futuras
 * conocidas que todavía no aparezcan en los movimientos (p. ej. una nueva
 * cuota).
 *
 * La confianza depende de cuántos meses haya: con menos de 1 mes no se
 * estima; 1–2 meses = baja; 3–5 = media; 6 o más = alta.
 */
export function estimateSavingCapacity(
  monthlySummaries: readonly PeriodSummary[],
  additionalMonthlyCommitments = 0,
): SavingCapacityEstimate {
  assertNonNegative(additionalMonthlyCommitments, 'Las obligaciones adicionales');
  const months = monthlySummaries.length;
  const notes: string[] = [];

  if (months === 0) {
    return {
      monthsAnalyzed: 0,
      averageIncome: 0,
      averageExpenses: 0,
      averageNet: 0,
      monthlyCapacity: 0,
      worstMonthNet: null,
      confidence: 'INSUFFICIENT',
      notes: ['Aún no hay meses completos registrados para estimar tu capacidad de ahorro.'],
    };
  }

  const averageIncome = sum(monthlySummaries.map((m) => m.income)) / months;
  const averageExpenses = sum(monthlySummaries.map((m) => m.expenses)) / months;
  const averageNet = averageIncome - averageExpenses - additionalMonthlyCommitments;
  const worstMonthNet = Math.min(...monthlySummaries.map((m) => m.net));

  const confidence: EstimateConfidence = months >= 6 ? 'HIGH' : months >= 3 ? 'MEDIUM' : 'LOW';
  notes.push(`Promedio de ${months} ${months === 1 ? 'mes' : 'meses'} registrados.`);
  if (confidence === 'LOW') {
    notes.push('Con pocos meses registrados la estimación puede cambiar bastante.');
  }
  if (additionalMonthlyCommitments > 0) {
    notes.push('Se descontaron obligaciones mensuales adicionales indicadas.');
  }
  if (averageNet <= 0) {
    notes.push('En promedio tus gastos igualan o superan tus ingresos.');
  }

  return {
    monthsAnalyzed: months,
    averageIncome: roundCop(averageIncome),
    averageExpenses: roundCop(averageExpenses),
    averageNet: roundCop(averageNet),
    monthlyCapacity: roundCop(Math.max(0, averageNet)),
    worstMonthNet: roundCop(worstMonthNet),
    confidence,
    notes,
  };
}
