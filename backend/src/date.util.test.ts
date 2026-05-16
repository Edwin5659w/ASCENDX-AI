import { describe, it, expect } from 'vitest';
import { startOfWeekUTC, previousWeekStartUTC } from './utils/date';

describe('date utils — hábitos semanales', () => {
  it('startOfWeekUTC cae en lunes UTC', () => {
    const wed = new Date('2025-05-14T15:00:00.000Z');
    const monday = startOfWeekUTC(wed);
    expect(monday.getUTCDay()).toBe(1);
    expect(monday.toISOString()).toBe('2025-05-12T00:00:00.000Z');
  });

  it('previousWeekStartUTC es 7 días antes del inicio de semana actual', () => {
    const ref = new Date('2025-05-14T12:00:00.000Z');
    const prev = previousWeekStartUTC(ref);
    expect(prev.toISOString()).toBe('2025-05-05T00:00:00.000Z');
  });
});
