import { z } from 'zod';

const tradeSideEnum = z.enum(['BUY', 'SELL']);

export const createTradeSchema = z.object({
  symbol: z.string().trim().min(1, 'Símbolo obligatorio').max(20),
  side: tradeSideEnum,
  quantity: z.number().positive('Cantidad debe ser mayor a 0'),
  price: z.number().positive('Precio debe ser mayor a 0'),
  pnl: z.number().optional().nullable(),
  emotionTag: z.string().trim().max(50).optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
  tradedAt: z.coerce.date().optional(),
});

export const updateTradeSchema = createTradeSchema.partial();

export const tradeIdSchema = z.object({
  id: z.string().uuid('ID de operación inválido'),
});
