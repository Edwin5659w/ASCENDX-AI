import { describe, it, expect } from 'vitest';
import { buildFirstSteps, isFirstStepsComplete } from '@ascendx/shared/first-steps';

describe('first-steps', () => {
  it('marca pasos según estadísticas', () => {
    const steps = buildFirstSteps({
      totalGoals: 1,
      totalTasks: 2,
      completedTasks: 0,
      activeHabits: 1,
      habitsCompletedToday: 0,
      financeRecordsCount: 0,
    });
    expect(steps.find((s) => s.id === 'goal')?.done).toBe(true);
    expect(steps.find((s) => s.id === 'complete-task')?.done).toBe(false);
    expect(isFirstStepsComplete(steps)).toBe(false);
  });

  it('detecta configuración completa', () => {
    const steps = buildFirstSteps({
      totalGoals: 1,
      totalTasks: 1,
      completedTasks: 1,
      activeHabits: 1,
      habitsCompletedToday: 1,
      financeRecordsCount: 1,
    });
    expect(isFirstStepsComplete(steps)).toBe(true);
  });
});
