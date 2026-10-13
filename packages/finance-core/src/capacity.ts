/**
 * Capacidad de ahorro, carga de deuda y fondo de emergencia (sección 6.2).
 */
import { assertNonNegative, roundPesos, sum } from './money.js';
import type { MonthlyIndicators } from './movements.js';

/** Margen para imprevistos por defecto: CP = 0,8 × CA. */
export const DEFAULT_SAFETY_MARGIN = 0.8;
/** Número de meses completos que se promedian. */
export const CAPACITY_WINDOW_MONTHS = 3;

export type CapacityBase =
  | 'historial' // 3 meses completos
  | 'pocos_datos' // 1 o 2 meses completos
  | 'perfil' // sin meses completos: ingreso − gastos fijos − cuotas
  | 'sin_datos'; // ni meses ni perfil

export interface FinancialProfileInput {
  estimatedIncome: number;
  estimatedFixedExpenses: number;
}

export interface CapacityInput {
  /** Indicadores de meses calendario ya terminados, del más antiguo al más reciente. */
  completedMonths: readonly Pick<MonthlyIndicators, 'netFlow'>[];
  profile?: FinancialProfileInput | null;
  /** Suma de las cuotas mensuales de las deudas activas (se usa con el perfil). */
  monthlyDebtInstallments?: number;
  /** Fracción de la capacidad que se considera prudente (0–1). */
  safetyMargin?: number;
}

export interface CapacityEstimate {
  base: CapacityBase;
  monthsUsed: number;
  /** CA: capacidad de ahorro estimada (puede ser negativa) */
  capacity: number;
  /** CP: capacidad prudente; 0 si CA ≤ 0 */
  prudentCapacity: number;
  /** true si CA ≤ 0: no se proponen aportes y se muestra una alerta */
  alert: boolean;
  /** Texto que explica la base del cálculo (RF-14) */
  explanation: string;
}

export function estimateSavingCapacity(input: CapacityInput): CapacityEstimate {
  const safetyMargin = input.safetyMargin ?? DEFAULT_SAFETY_MARGIN;
  if (!(safetyMargin > 0 && safetyMargin <= 1)) {
    throw new RangeError('El margen de seguridad debe estar entre 0 y 1');
  }
  const installments = input.monthlyDebtInstallments ?? 0;
  assertNonNegative(installments, 'Las cuotas de deuda');

  const recent = input.completedMonths.slice(-CAPACITY_WINDOW_MONTHS);
  let base: CapacityBase;
  let capacity: number;
  let explanation: string;

  if (recent.length > 0) {
    capacity = sum(recent.map((month) => month.netFlow)) / recent.length;
    if (recent.length === CAPACITY_WINDOW_MONTHS) {
      base = 'historial';
      explanation = 'Promedio del flujo neto de tus últimos 3 meses completos.';
    } else {
      base = 'pocos_datos';
      explanation = `Estimación con pocos datos: promedio de ${recent.length} ${recent.length === 1 ? 'mes completo' : 'meses completos'}.`;
    }
  } else if (input.profile) {
    assertNonNegative(input.profile.estimatedIncome, 'El ingreso estimado');
    assertNonNegative(input.profile.estimatedFixedExpenses, 'Los gastos fijos estimados');
    base = 'perfil';
    capacity = input.profile.estimatedIncome - input.profile.estimatedFixedExpenses - installments;
    explanation = 'Aún no tienes meses completos: se usa tu perfil (ingreso − gastos fijos − cuotas de deudas).';
  } else {
    return {
      base: 'sin_datos',
      monthsUsed: 0,
      capacity: 0,
      prudentCapacity: 0,
      alert: false,
      explanation: 'Completa tu perfil financiero o registra movimientos para estimar tu capacidad de ahorro.',
    };
  }

  const roundedCapacity = roundPesos(capacity);
  const alert = roundedCapacity <= 0;
  return {
    base,
    monthsUsed: recent.length,
    capacity: roundedCapacity,
    prudentCapacity: alert ? 0 : Math.floor(roundedCapacity * safetyMargin),
    alert,
    explanation,
  };
}

export type DebtLoadLevel = 'verde' | 'amarillo' | 'rojo';

export interface DebtLoad {
  /** Cuotas ÷ ingreso (0–n) */
  ratio: number;
  level: DebtLoadLevel;
}

/**
 * Carga de deuda = cuotas mensuales ÷ ingreso mensual promedio.
 * < 30 % verde, 30–40 % amarillo, > 40 % rojo. Referencia educativa, no diagnóstico.
 * Devuelve null si no hay ingreso para comparar.
 */
export function debtLoad(monthlyInstallments: number, averageMonthlyIncome: number): DebtLoad | null {
  assertNonNegative(monthlyInstallments, 'Las cuotas de deuda');
  assertNonNegative(averageMonthlyIncome, 'El ingreso promedio');
  if (averageMonthlyIncome === 0) return null;
  const ratio = monthlyInstallments / averageMonthlyIncome;
  const level: DebtLoadLevel = ratio < 0.3 ? 'verde' : ratio <= 0.4 ? 'amarillo' : 'rojo';
  return { ratio, level };
}

/** Meses cubiertos por el fondo de emergencia; null si no hay gasto promedio. */
export function emergencyFundMonths(emergencyGoalBalance: number, averageMonthlyExpenses: number): number | null {
  assertNonNegative(emergencyGoalBalance, 'El saldo del fondo de emergencia');
  assertNonNegative(averageMonthlyExpenses, 'El gasto promedio');
  if (averageMonthlyExpenses === 0) return null;
  return Math.floor((emergencyGoalBalance / averageMonthlyExpenses) * 10) / 10;
}
