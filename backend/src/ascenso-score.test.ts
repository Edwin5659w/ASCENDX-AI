import { describe, expect, it } from 'vitest';
import { computeAscensoScore } from '@ascendx/shared/ascenso-score';

describe('computeAscensoScore', () => {
  it('returns high score when day is complete', () => {
    const r = computeAscensoScore({
      tasksCompletedToday: 2,
      tasksDueToday: 2,
      habitsTotal: 2,
      habitsCompletedToday: 2,
      longestStreak: 7,
      financeRecordsThisWeek: 3,
      hasDailyFocus: true,
      setupScore: 100,
    });
    expect(r.score).toBeGreaterThanOrEqual(75);
    expect(r.label).toBeTruthy();
  });
});
