import { describe, it, expect } from 'vitest';
import { onboardingSetupSchema } from '@ascendx/shared/validators/onboarding.validator';

describe('onboardingSetupSchema', () => {
  it('acepta configuración mínima válida', () => {
    const r = onboardingSetupSchema.safeParse({
      focus: 'ESTUDIO',
      goalTitle: 'Aprobar el semestre',
      taskTitles: ['Repasar tema 1'],
      habitName: 'Estudiar 30 min',
    });
    expect(r.success).toBe(true);
  });

  it('rechaza objetivo demasiado corto', () => {
    const r = onboardingSetupSchema.safeParse({
      focus: 'SALUD',
      goalTitle: 'Ok',
      taskTitles: ['Caminar'],
      habitName: 'Agua',
    });
    expect(r.success).toBe(false);
  });
});
