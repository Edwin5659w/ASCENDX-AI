/**
 * Crédito con cuota fija (sistema francés), sección 6.4:
 *   C = P · i_m / (1 − (1 + i_m)^−n)
 */
import { assertIntegerInRange, assertNonNegative, roundPesos, sum } from './money.js';

export const MAX_TERM_MONTHS = 360;

export interface AmortizationRow {
  month: number;
  /** Capital + intereses */
  payment: number;
  interest: number;
  principal: number;
  /** Saldo después de la cuota */
  balance: number;
}

export interface LoanSummary {
  principal: number;
  monthlyRate: number;
  termMonths: number;
  /** Cuota fija C (capital + intereses) */
  installment: number;
  /** Intereses totales = suma de intereses de la tabla (≈ C × n − P) */
  totalInterest: number;
  /** Suma de todas las cuotas (sin cargos) */
  totalInstallments: number;
  schedule: AmortizationRow[];
}

export function fixedInstallment(principal: number, monthlyRate: number, termMonths: number): number {
  assertNonNegative(principal, 'El monto financiado');
  assertNonNegative(monthlyRate, 'La tasa mensual');
  assertIntegerInRange(termMonths, 1, MAX_TERM_MONTHS, 'El plazo');
  if (principal === 0) return 0;
  if (monthlyRate === 0) return principal / termMonths;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
}

/**
 * Tabla de amortización al peso. La última cuota absorbe la diferencia de
 * redondeo para que el saldo termine exactamente en 0.
 */
export function amortizationSchedule(principal: number, monthlyRate: number, termMonths: number): AmortizationRow[] {
  const installment = roundPesos(fixedInstallment(principal, monthlyRate, termMonths));
  const rows: AmortizationRow[] = [];
  let balance = roundPesos(principal);
  for (let month = 1; month <= termMonths; month++) {
    const interest = roundPesos(balance * monthlyRate);
    const principalPart = month === termMonths ? balance : Math.min(installment - interest, balance);
    balance = roundPesos(balance - principalPart);
    rows.push({ month, payment: principalPart + interest, interest, principal: principalPart, balance });
  }
  return rows;
}

export function summarizeLoan(principal: number, monthlyRate: number, termMonths: number): LoanSummary {
  const schedule = amortizationSchedule(principal, monthlyRate, termMonths);
  return {
    principal: roundPesos(principal),
    monthlyRate,
    termMonths,
    installment: roundPesos(fixedInstallment(principal, monthlyRate, termMonths)),
    totalInterest: sum(schedule.map((row) => row.interest)),
    totalInstallments: sum(schedule.map((row) => row.payment)),
    schedule,
  };
}
