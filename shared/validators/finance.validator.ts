import { z } from 'zod';

const financeTypeEnum = z.enum(['INCOME', 'EXPENSE']);

export const createFinanceSchema = z.object({
  type: financeTypeEnum,
  amount: z
    .number()
    .positive('El monto debe ser mayor a 0')
    .max(999_999_999.99, 'Monto demasiado alto'),
  category: z.string().trim().min(1, 'La categoría es obligatoria').max(100),
  note: z.string().trim().max(500).optional(),
});

export const updateFinanceSchema = createFinanceSchema.partial();

export const financeIdSchema = z.object({
  id: z.string().uuid('ID de registro inválido'),
});
