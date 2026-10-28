/**
 * Deudas (RF-11, RF-12): reparto de un pago entre intereses y capital, y
 * fecha del próximo pago.
 */
import { addMonths, daysInMonth, formatCalendarDate, parseCalendarDate, type CalendarDate } from './dates.js';
import { assertNonNegative, assertPositive, roundPesos } from './money.js';

export interface DebtPaymentSplit {
  /** Intereses del periodo: saldo × tasa mensual (redondeado al peso) */
  interest: number;
  /** Abono a capital: pago − intereses, sin superar el saldo */
  principal: number;
  /** Saldo después del pago */
  newBalance: number;
  /** true si el pago deja la deuda en 0 */
  paidOff: boolean;
}

/**
 * Un pago cubre primero los intereses del mes y el resto abona a capital.
 * Sin tasa conocida, todo el pago abona a capital.
 */
export function splitDebtPayment(balance: number, monthlyRate: number | null, amount: number): DebtPaymentSplit {
  assertNonNegative(balance, 'El saldo de la deuda');
  assertPositive(amount, 'El pago');
  const rate = monthlyRate ?? 0;
  assertNonNegative(rate, 'La tasa mensual');
  const interest = Math.min(roundPesos(balance * rate), roundPesos(amount));
  const principal = Math.min(roundPesos(amount) - interest, roundPesos(balance));
  const newBalance = roundPesos(balance - principal);
  return { interest, principal, newBalance, paidOff: newBalance === 0 };
}

/**
 * Próxima fecha de pago a partir de hoy para un día de pago mensual (1–31).
 * Si el mes no tiene ese día, se usa el último día del mes.
 */
export function nextPaymentDate(paymentDay: number, today: CalendarDate): CalendarDate {
  if (!Number.isInteger(paymentDay) || paymentDay < 1 || paymentDay > 31) {
    throw new RangeError('El día de pago debe estar entre 1 y 31');
  }
  const { year, month, day } = parseCalendarDate(today);
  const thisMonth = formatCalendarDate(year, month, Math.min(paymentDay, daysInMonth(year, month)));
  if (Math.min(paymentDay, daysInMonth(year, month)) >= day) return thisMonth;
  const next = parseCalendarDate(addMonths(formatCalendarDate(year, month, 1), 1));
  return formatCalendarDate(next.year, next.month, Math.min(paymentDay, daysInMonth(next.year, next.month)));
}
