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
