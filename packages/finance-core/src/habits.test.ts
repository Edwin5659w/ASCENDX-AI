import { describe, expect, it } from 'vitest';
import { addDays, dueOccurrences, evaluateAchievements, nextOccurrence, weekStart, weeklyStreak } from './habits.js';

describe('movimientos recurrentes (RF-30)', () => {
  it('mensual conserva el día ancla aunque pase por meses cortos', () => {
    expect(nextOccurrence('2026-01-31', 'mensual', 31)).toBe('2026-02-28');
    expect(nextOccurrence('2026-02-28', 'mensual', 31)).toBe('2026-03-31');
    expect(nextOccurrence('2026-12-05', 'mensual')).toBe('2027-01-05');
  });

  it('quincenal cae el 15 y el 30 (28 en febrero)', () => {
    expect(nextOccurrence('2026-01-15', 'quincenal', 15)).toBe('2026-01-30');
    expect(nextOccurrence('2026-01-30', 'quincenal', 15)).toBe('2026-02-15');
    expect(nextOccurrence('2026-02-15', 'quincenal', 15)).toBe('2026-02-28');
    expect(nextOccurrence('2026-02-28', 'quincenal', 15)).toBe('2026-03-15');
  });

  it('semanal suma 7 días y cruza el año', () => {
    expect(nextOccurrence('2026-12-29', 'semanal')).toBe('2027-01-05');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('lista las fechas vencidas hasta hoy y la siguiente', () => {
    expect(dueOccurrences('2026-08-05', 'mensual', '2026-10-27', 5)).toEqual({
      dates: ['2026-08-05', '2026-09-05', '2026-10-05'],
      next: '2026-11-05',
    });
    expect(dueOccurrences('2026-11-05', 'mensual', '2026-10-27').dates).toEqual([]);
  });

  it('no crea más del máximo si la app estuvo mucho tiempo cerrada', () => {
    const result = dueOccurrences('2026-01-01', 'semanal', '2026-10-27', null, 4);
    expect(result.dates).toHaveLength(4);
    expect(result.next > '2026-10-27').toBe(true);
  });
});

describe('racha semanal y logros (RF-32)', () => {
  it('la semana empieza el lunes', () => {
    expect(weekStart('2026-10-27')).toBe('2026-10-26'); // martes
    expect(weekStart('2026-11-01')).toBe('2026-10-26'); // domingo
  });

  it('cuenta semanas seguidas y no se rompe si esta semana aún no hay registros', () => {
    const dates = ['2026-10-01', '2026-10-06', '2026-10-14', '2026-10-21'];
    expect(weeklyStreak(dates, '2026-10-27')).toEqual({ current: 4, best: 4, activeThisWeek: false });
    expect(weeklyStreak([...dates, '2026-10-27'], '2026-10-27').current).toBe(5);
    expect(weeklyStreak(['2026-09-01', '2026-10-20'], '2026-10-27')).toMatchObject({ current: 1, best: 1 });
  });

  it('los logros solo dependen de registrar, ahorrar y cumplir', () => {
    const progress = evaluateAchievements({
      movements: 3,
      bestWeeklyStreak: 2,
      goals: 1,
      contributions: 0,
      goalsCompleted: 0,
      emergencyMonths: 1.46,
      positiveMonths: 0,
      debtsPaidOff: 0,
    });
    const byCode = Object.fromEntries(progress.map((p) => [p.code, p]));
    expect(byCode.primer_registro!.earned).toBe(true);
    expect(byCode.constancia_4).toMatchObject({ earned: false, current: 2, target: 4 });
    expect(byCode.colchon_1!.earned).toBe(true);
    expect(byCode.colchon_3!.current).toBe(1.4);
    expect(progress.some((p) => /deuda/i.test(p.description) && !/pagar/i.test(p.description))).toBe(false);
  });
});
