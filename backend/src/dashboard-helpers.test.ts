import { describe, expect, it } from 'vitest';
import { computeSetupScore, getTimeGreeting } from '@ascendx/shared/dashboard-helpers';

describe('dashboard-helpers', () => {
  it('computes setup score from milestones', () => {
    expect(
      computeSetupScore({
        totalGoals: 1,
        totalTasks: 1,
        completedTasks: 1,
        activeHabits: 1,
        habitsCompletedToday: 1,
        financeRecordsCount: 1,
      }),
    ).toBe(100);
  });

  it('returns greeting with name', () => {
    expect(getTimeGreeting('Ana García')).toMatch(/Ana/);
  });
});
