export function startOfDayUTC(date: Date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function isSameDayUTC(a: Date, b: Date): boolean {
  return startOfDayUTC(a).getTime() === startOfDayUTC(b).getTime();
}

export function yesterdayUTC(): Date {
  const d = startOfDayUTC();
  d.setUTCDate(d.getUTCDate() - 1);
  return d;
}

/** Lunes 00:00 UTC de la semana de la fecha dada. */
export function startOfWeekUTC(date: Date = new Date()): Date {
  const d = startOfDayUTC(date);
  const day = d.getUTCDay();
  const daysFromMonday = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - daysFromMonday);
  return d;
}

export function previousWeekStartUTC(from: Date = new Date()): Date {
  const w = startOfWeekUTC(from);
  w.setUTCDate(w.getUTCDate() - 7);
  return w;
}

export function daysAgoUTC(days: number, from: Date = new Date()): Date {
  const d = startOfDayUTC(from);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}
