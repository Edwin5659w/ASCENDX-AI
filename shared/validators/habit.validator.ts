import { z } from 'zod';

const frequencyEnum = z.enum(['DAILY', 'WEEKLY']);

export const createHabitSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  frequency: frequencyEnum.default('DAILY'),
});

export const updateHabitSchema = createHabitSchema.partial();

export const habitIdSchema = z.object({
  id: z.string().uuid('ID de hábito inválido'),
});
