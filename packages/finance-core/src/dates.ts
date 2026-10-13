/**
 * Fechas de calendario (sección 6.5): los meses se calculan en la zona
 * horaria America/Bogota y se trabaja con fechas sin hora («AAAA-MM-DD»)
 * para no depender de la zona horaria del teléfono o del servidor.
 */

export const TIME_ZONE = 'America/Bogota';

/** Fecha de calendario en formato ISO «AAAA-MM-DD». */
export type CalendarDate = string;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseCalendarDate(value: CalendarDate): { year: number; month: number; day: number } {
  const match = DATE_PATTERN.exec(value);
  if (!match) throw new RangeError(`Fecha inválida: ${value}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new RangeError(`Fecha inválida: ${value}`);
  }
  return { year, month, day };
}

export function formatCalendarDate(year: number, month: number, day: number): CalendarDate {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Fecha de hoy en Bogotá. */
export function todayInBogota(now: Date = new Date()): CalendarDate {
  // en-CA produce el formato AAAA-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function compareDates(a: CalendarDate, b: CalendarDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Suma meses ajustando al último día si el mes destino es más corto (31-ene + 1 = 28/29-feb). */
export function addMonths(date: CalendarDate, months: number): CalendarDate {
  const { year, month, day } = parseCalendarDate(date);
  const index = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(index / 12);
  const targetMonth = (index % 12) + 1;
  return formatCalendarDate(targetYear, targetMonth, Math.min(day, daysInMonth(targetYear, targetMonth)));
}

/** Meses calendario completos entre dos fechas (15-ene → 15-abr = 3; 15-ene → 14-abr = 2). Nunca negativo. */
export function monthsBetween(from: CalendarDate, to: CalendarDate): number {
  const a = parseCalendarDate(from);
  const b = parseCalendarDate(to);
  let months = (b.year - a.year) * 12 + (b.month - a.month);
  if (b.day < a.day) months -= 1;
  return Math.max(0, months);
}

/** Clave de mes «AAAA-MM». */
export function monthKey(date: CalendarDate): string {
  return date.slice(0, 7);
}

/**
 * Meses calendario completos (ya terminados) anteriores a `today`, del más
 * antiguo al más reciente. Ej.: hoy 2026-10-13, 3 meses → [2026-07, 2026-08, 2026-09].
 */
export function previousCompletedMonths(today: CalendarDate, count: number): string[] {
  const { year, month } = parseCalendarDate(today);
  const firstOfMonth = formatCalendarDate(year, month, 1);
  const keys: string[] = [];
  for (let offset = count; offset >= 1; offset--) keys.push(monthKey(addMonths(firstOfMonth, -offset)));
  return keys;
}
