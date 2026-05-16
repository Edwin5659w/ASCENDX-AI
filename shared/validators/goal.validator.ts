import { z } from 'zod';

const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const createGoalSchema = z.object({
  title: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres').max(200),
  description: z.string().trim().max(2000).optional(),
  category: z.string().trim().max(100).optional(),
  priority: priorityEnum.default('MEDIUM'),
  deadline: z.coerce.date().optional(),
});

export const updateGoalSchema = createGoalSchema.partial();

export const goalIdSchema = z.object({
  id: z.string().uuid('ID de objetivo inválido'),
});
