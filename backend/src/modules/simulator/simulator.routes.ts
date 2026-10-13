import { Router } from 'express';
import { z } from 'zod';
import { HttpError } from '../../lib/http-error.js';
import { requireAuth } from '../../middleware/require-auth.js';
import { parseBody } from '../../middleware/validate.js';
import { compareSavingVsFinancing, MAX_REASONABLE_ANNUAL_RATE } from '../finance/calculations/index.js';

export const simulatorRouter = Router();

simulatorRouter.use(requireAuth);

const MAX_AMOUNT = 100_000_000_000; // 100 mil millones: tope para detectar errores de digitación
const amount = z.number().nonnegative().max(MAX_AMOUNT);

const compareSchema = z
  .object({
    assetPrice: z.number().positive().max(MAX_AMOUNT),
    downPayment: amount.default(0),
    interestRate: z.number().nonnegative().max(MAX_REASONABLE_ANNUAL_RATE),
    rateType: z.enum(['EFFECTIVE_ANNUAL', 'MONTHLY']),
    termMonths: z.number().int().min(1).max(360),
    monthlyFees: amount.default(0),
    monthlySavingAmount: amount,
    currentSavings: amount.default(0),
    annualPriceIncrease: z.number().nonnegative().max(1).default(0),
    monthlyIncome: amount.optional(),
    includeSchedule: z.boolean().default(false),
  })
  .refine((v) => v.downPayment <= v.assetPrice, {
    path: ['downPayment'],
    message: 'La cuota inicial no puede ser mayor que el precio',
  });

/** Compara ahorrar vs financiar. Solo calcula; no guarda nada. */
simulatorRouter.post('/compare', (req, res) => {
  const { includeSchedule, ...input } = parseBody(compareSchema, req);
  try {
    const result = compareSavingVsFinancing(input);
    res.json(includeSchedule ? result : { ...result, financing: { ...result.financing, schedule: undefined } });
  } catch (error) {
    if (error instanceof RangeError) throw HttpError.badRequest(error.message);
    throw error;
  }
});
