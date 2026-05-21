import { z } from 'zod';

const frequencyEnum = z.enum(['DAILY', 'WEEKLY']);

const reminderHour = z.number().int().min(0).max(23).optional().nullable();
const reminderMinute = z.number().int().min(0).max(59).optional().nullable();

export const createHabitSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  frequency: frequencyEnum.default('DAILY'),
  reminderEnabled: z.boolean().optional(),
  reminderHour: reminderHour,
  reminderMinute: reminderMinute,
});

export const updateHabitSchema = createHabitSchema.partial();

export const habitIdSchema = z.object({
  id: z.string().uuid('ID de hábito inválido'),
});
