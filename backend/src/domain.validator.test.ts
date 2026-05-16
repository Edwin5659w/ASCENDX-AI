import { describe, it, expect } from 'vitest';
import { updateGoalSchema } from '@ascendx/shared/validators/goal.validator';
import { updateHabitSchema } from '@ascendx/shared/validators/habit.validator';
import { updateTaskSchema } from '@ascendx/shared/validators/task.validator';

describe('validadores de dominio — campos solo servidor', () => {
  it('updateGoalSchema ignora progress enviado por el cliente', () => {
    const r = updateGoalSchema.safeParse({ title: 'Nueva meta', progress: 100 });
    expect(r.success).toBe(true);
    if (r.success) expect('progress' in r.data).toBe(false);
  });

  it('updateHabitSchema ignora streak enviado por el cliente', () => {
    const r = updateHabitSchema.safeParse({ name: 'Correr', streak: 99 });
    expect(r.success).toBe(true);
    if (r.success) expect('streak' in r.data).toBe(false);
  });

  it('updateTaskSchema ignora streakCount enviado por el cliente', () => {
    const r = updateTaskSchema.safeParse({ title: 'Tarea', streakCount: 50 });
    expect(r.success).toBe(true);
    if (r.success) expect('streakCount' in r.data).toBe(false);
  });
});
