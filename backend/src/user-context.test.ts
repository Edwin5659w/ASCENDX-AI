import { describe, it, expect } from 'vitest';
import { resolveContextLevel } from './services/ai/user-context';

describe('resolveContextLevel', () => {
  it('empty sin datos', () => {
    expect(
      resolveContextLevel({
        totalGoals: 0,
        totalTasks: 0,
        activeHabits: 0,
        completedTasks: 0,
        financeRecordsCount: 0,
      }),
    ).toBe('empty');
  });

  it('partial con solo objetivo', () => {
    expect(
      resolveContextLevel({
        totalGoals: 1,
        totalTasks: 0,
        activeHabits: 0,
        completedTasks: 0,
        financeRecordsCount: 0,
      }),
    ).toBe('partial');
  });

  it('ready con núcleo completo', () => {
    expect(
      resolveContextLevel({
        totalGoals: 1,
        totalTasks: 2,
        activeHabits: 1,
        completedTasks: 1,
        financeRecordsCount: 0,
      }),
    ).toBe('ready');
  });
});
