/**
 * Hábitos (P2): movimientos recurrentes (RF-30), racha semanal y logros
 * (RF-32). Los logros premian registrar, ahorrar y cumplir; nunca premian
 * endeudarse ni gastar más (sección 7 de la propuesta).
 */
import { compareDates, daysInMonth, formatCalendarDate, parseCalendarDate, type CalendarDate } from './dates.js';

export const RECURRENCE_FREQUENCIES = ['semanal', 'quincenal', 'mensual'] as const;
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

export function addDays(date: CalendarDate, days: number): CalendarDate {
  const { year, month, day } = parseCalendarDate(date);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return formatCalendarDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

function dayIn(year: number, month: number, day: number): CalendarDate {
  return formatCalendarDate(year, month, Math.min(day, daysInMonth(year, month)));
}

/** Fechas de cobro de una quincena: el día ancla y 15 días después (o antes), ajustados al fin de mes. */
function fortnightDays(anchorDay: number): [number, number] {
  return anchorDay <= 15 ? [anchorDay, anchorDay + 15] : [anchorDay - 15, anchorDay];
}

/**
 * Siguiente fecha después de `date`.
 * - semanal: +7 días.
 * - quincenal: dos fechas por mes (p. ej. 15 y 30; en febrero, 15 y 28).
 * - mensual: el mismo día cada mes; si el mes es más corto, el último día
 *   (el ancla evita que 31 → 28 → 28 se «corra»).
 */
export function nextOccurrence(date: CalendarDate, frequency: RecurrenceFrequency, anchorDay?: number | null): CalendarDate {
  const { year, month, day } = parseCalendarDate(date);
  const anchor = anchorDay ?? day;
  if (frequency === 'semanal') return addDays(date, 7);
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  if (frequency === 'mensual') return dayIn(nextMonth.year, nextMonth.month, anchor);
  const [first, second] = fortnightDays(anchor);
  const candidates = [dayIn(year, month, first), dayIn(year, month, second), dayIn(nextMonth.year, nextMonth.month, first)];
  return candidates.find((candidate) => compareDates(candidate, date) > 0)!;
}

/**
 * Fechas pendientes de crear hasta hoy (incluido), empezando por `nextDate`.
 * Devuelve también la próxima fecha futura. `max` evita crear cientos de
 * movimientos si la app estuvo mucho tiempo sin abrirse.
 */
export function dueOccurrences(
  nextDate: CalendarDate,
  frequency: RecurrenceFrequency,
  today: CalendarDate,
  anchorDay?: number | null,
  max = 12,
): { dates: CalendarDate[]; next: CalendarDate } {
  const dates: CalendarDate[] = [];
  let cursor = nextDate;
  while (compareDates(cursor, today) <= 0 && dates.length < max) {
    dates.push(cursor);
    cursor = nextOccurrence(cursor, frequency, anchorDay);
  }
  while (compareDates(cursor, today) <= 0) cursor = nextOccurrence(cursor, frequency, anchorDay);
  return { dates, next: cursor };
}

/** Lunes de la semana de una fecha. */
export function weekStart(date: CalendarDate): CalendarDate {
  const { year, month, day } = parseCalendarDate(date);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0 = domingo
  return addDays(date, -((weekday + 6) % 7));
}

/**
 * Racha semanal: semanas seguidas (lunes a domingo) con al menos un
 * movimiento registrado. La semana actual cuenta si ya tiene registros; si
 * todavía no, la racha sigue viva desde la semana anterior.
 */
export function weeklyStreak(activityDates: CalendarDate[], today: CalendarDate): { current: number; best: number; activeThisWeek: boolean } {
  const weeks = new Set(activityDates.map(weekStart));
  const thisWeek = weekStart(today);
  const activeThisWeek = weeks.has(thisWeek);
  let current = 0;
  let cursor = activeThisWeek ? thisWeek : addDays(thisWeek, -7);
  while (weeks.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -7);
  }
  let best = 0;
  let run = 0;
  let previous: CalendarDate | null = null;
  for (const week of [...weeks].sort()) {
    run = previous && addDays(previous, 7) === week ? run + 1 : 1;
    best = Math.max(best, run);
    previous = week;
  }
  return { current, best, activeThisWeek };
}

export interface HabitStats {
  movements: number;
  bestWeeklyStreak: number;
  goals: number;
  contributions: number;
  goalsCompleted: number;
  /** Meses de gastos que cubre el fondo de emergencia */
  emergencyMonths: number;
  /** Meses completos con flujo neto positivo */
  positiveMonths: number;
  debtsPaidOff: number;
}

export interface AchievementDefinition {
  code: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  value: (stats: HabitStats) => number;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { code: 'primer_registro', title: 'Primer paso', description: 'Registra tu primer movimiento.', icon: 'flag', target: 1, value: (s) => s.movements },
  { code: 'constancia_4', title: 'Constancia', description: 'Registra movimientos 4 semanas seguidas.', icon: 'flame', target: 4, value: (s) => s.bestWeeklyStreak },
  { code: 'constancia_12', title: 'Hábito firme', description: 'Registra movimientos 12 semanas seguidas.', icon: 'flame', target: 12, value: (s) => s.bestWeeklyStreak },
  { code: 'primera_meta', title: 'Con rumbo', description: 'Crea tu primera meta.', icon: 'goals', target: 1, value: (s) => s.goals },
  { code: 'primer_aporte', title: 'Primer ahorro', description: 'Haz tu primer aporte a una meta.', icon: 'savings', target: 1, value: (s) => s.contributions },
  { code: 'ahorrador_10', title: 'Ahorro constante', description: 'Haz 10 aportes a tus metas.', icon: 'savings', target: 10, value: (s) => s.contributions },
  { code: 'meta_cumplida', title: 'Meta cumplida', description: 'Completa una meta de ahorro.', icon: 'trophy', target: 1, value: (s) => s.goalsCompleted },
  { code: 'colchon_1', title: 'Colchón', description: 'Tu fondo de emergencia cubre 1 mes de gastos.', icon: 'shield', target: 1, value: (s) => s.emergencyMonths },
  { code: 'colchon_3', title: 'Tranquilidad', description: 'Tu fondo de emergencia cubre 3 meses de gastos.', icon: 'shield', target: 3, value: (s) => s.emergencyMonths },
  { code: 'mes_en_verde', title: 'Mes en verde', description: 'Cierra un mes con más ingresos que salidas.', icon: 'chart', target: 1, value: (s) => s.positiveMonths },
  { code: 'deuda_saldada', title: 'Deuda saldada', description: 'Termina de pagar una deuda.', icon: 'check', target: 1, value: (s) => s.debtsPaidOff },
];

export interface AchievementProgress {
  code: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  current: number;
  earned: boolean;
}

export function evaluateAchievements(stats: HabitStats): AchievementProgress[] {
  return ACHIEVEMENTS.map(({ value, ...definition }) => {
    const raw = value(stats);
    const current = Math.max(0, Math.min(definition.target, Math.floor(raw * 10) / 10));
    return { ...definition, current, earned: raw >= definition.target };
  });
}
