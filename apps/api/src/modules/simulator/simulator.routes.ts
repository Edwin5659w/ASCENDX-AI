import { MAX_TERM_MONTHS, simulatePurchase } from '@ascendx/finance-core';
import { Router } from 'express';
import { z } from 'zod';
import { HttpError } from '../../lib/http-error.js';
import { currentUserId, protectedRoute } from '../../middleware/require-auth.js';
import { parseBody } from '../../middleware/validate.js';
import { getUsuryReference } from '../settings/settings.service.js';

export const simulatorRouter = Router();

simulatorRouter.use(protectedRoute);

/** Pesos enteros (BIGINT); tope para detectar errores de digitación. */
const pesos = z.number().int('Los montos van en pesos enteros').nonnegative().max(100_000_000_000);

export const simulationSchema = z
  .object({
    price: pesos.positive('El precio debe ser mayor que 0'),
    downPayment: pesos.default(0),
    currentSavings: pesos.default(0),
    monthlySaving: pesos,
    rate: z.number().nonnegative(),
    rateType: z.enum(['EA', 'MV']),
    termMonths: z.number().int().min(1).max(MAX_TERM_MONTHS),
    monthlyFees: pesos.default(0),
    oneTimeFees: pesos.default(0),
  })
  .refine((v) => v.downPayment <= v.price, {
    path: ['downPayment'],
    message: 'La cuota inicial no puede ser mayor que el precio',
  });

const compareSchema = simulationSchema.and(z.object({ includeSchedule: z.boolean().default(false) }));

/** RF-20: compara crédito, ahorro y mixto. Solo calcula; no guarda nada. */
simulatorRouter.post('/compare', async (req, res) => {
  currentUserId(req);
  const { includeSchedule, ...input } = parseBody(compareSchema, req);
  const usury = await getUsuryReference();
  try {
    const result = simulatePurchase({ ...input, usury });
    if (includeSchedule) {
      res.json(result);
      return;
    }
    const { schedule: _credit, ...credit } = result.credit;
    const mixed = result.mixed ? (({ schedule: _mixed, ...rest }) => rest)(result.mixed) : null;
    res.json({ ...result, credit, mixed });
  } catch (error) {
    if (error instanceof RangeError) throw HttpError.badRequest(error.message);
    throw error;
  }
});
