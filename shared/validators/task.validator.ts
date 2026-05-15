import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio').max(300),
  completed: z.boolean().default(false),
  goalId: z.string().uuid().optional().nullable(),
  dueDate: z.coerce.date().optional(),
  streakCount: z.number().int().min(0).default(0),
});

export const updateTaskSchema = createTaskSchema.partial();

export const taskIdSchema = z.object({
  id: z.string().uuid('ID de tarea inválido'),
});
