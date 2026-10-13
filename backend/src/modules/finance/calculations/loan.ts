/**
 * Créditos con cuota fija (sistema de amortización francés), el más común
 * en créditos de consumo, vehículo y vivienda en Colombia.
 *
 *   Cuota = P · i / (1 − (1 + i)^−n)
 *
 * P = monto financiado, i = tasa mensual, n = número de cuotas.
 */
import { assertNonNegative, assertPositiveInteger, roundCop, sum } from './money.js';

export interface AmortizationRow {
  /** Número de la cuota (1…n) */
  month: number;
  /** Cuota de capital + intereses (sin cargos) */
  payment: number;
  interest: number;
  principal: number;
  /** Cargos fijos mensuales (seguros, cuota de manejo) */
  fees: number;
  /** Saldo después de pagar la cuota */
  balance: number;
}

export interface LoanSummary {
  principal: number;
  monthlyRate: number;
  termMonths: number;
  /** Cuota fija de capital + intereses */
  monthlyPayment: number;
  /** Cuota + cargos fijos: lo que realmente sale del bolsillo cada mes */
  monthlyOutflow: number;
  totalInterest: number;
  totalFees: number;
  /** Suma de todas las cuotas y cargos (sin cuota inicial) */
  totalPaid: number;
  schedule: AmortizationRow[];
}

/** Cuota fija sin redondear. Con tasa 0 se divide el capital entre las cuotas. */
export function fixedMonthlyPayment(principal: number, monthlyRate: number, termMonths: number): number {
  assertNonNegative(principal, 'El monto financiado');
  assertNonNegative(monthlyRate, 'La tasa mensual');
  assertPositiveInteger(termMonths, 'El plazo');

  if (principal === 0) return 0;
  if (monthlyRate === 0) return principal / termMonths;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
}

/**
 * Tabla de amortización redondeada al peso. La última cuota absorbe la
 * diferencia de redondeo para que el saldo termine exactamente en 0.
 */
export function amortizationSchedule(
  principal: number,
  monthlyRate: number,
  termMonths: number,
  monthlyFees = 0,
): AmortizationRow[] {
  assertNonNegative(monthlyFees, 'Los cargos mensuales');
  const payment = roundCop(fixedMonthlyPayment(principal, monthlyRate, termMonths));
  const fees = roundCop(monthlyFees);
  const rows: AmortizationRow[] = [];
  let balance = roundCop(principal);

  for (let month = 1; month <= termMonths; month++) {
    const interest = roundCop(balance * monthlyRate);
    const isLast = month === termMonths;
    const principalPart = isLast ? balance : Math.min(payment - interest, balance);
    balance = roundCop(balance - principalPart);
    rows.push({
      month,
      payment: principalPart + interest,
      interest,
      principal: principalPart,
      fees,
      balance,
    });
  }

  return rows;
}

export function summarizeLoan(
  principal: number,
  monthlyRate: number,
  termMonths: number,
  monthlyFees = 0,
): LoanSummary {
  const schedule = amortizationSchedule(principal, monthlyRate, termMonths, monthlyFees);
  const totalInterest = sum(schedule.map((row) => row.interest));
  const totalFees = sum(schedule.map((row) => row.fees));
  const monthlyPayment = roundCop(fixedMonthlyPayment(principal, monthlyRate, termMonths));

  return {
    principal: roundCop(principal),
    monthlyRate,
    termMonths,
    monthlyPayment,
    monthlyOutflow: monthlyPayment + roundCop(monthlyFees),
    totalInterest,
    totalFees,
    totalPaid: sum(schedule.map((row) => row.payment)) + totalFees,
    schedule,
  };
}
