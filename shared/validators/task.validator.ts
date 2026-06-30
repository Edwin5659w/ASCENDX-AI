import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio').max(300),
  completed: z.boolean().default(false),
  goalId: z.string().uuid().optional().nullable(),
  dueDate: z.coerce.date().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceDays: z.string().max(50).optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const taskIdSchema = z.object({
  id: z.string().uuid('ID de tarea inválido'),
});
