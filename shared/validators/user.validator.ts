import { z } from 'zod';

const fullNameSchema = z
  .string()
  .trim()
  .min(3)
  .max(50)
  .refine((val) => val.split(/\s+/).filter(Boolean).length >= 2, 'Ingresa nombre y apellido');

export const updateProfileSchema = z.object({
  name: fullNameSchema.optional(),
  onboardingDone: z.boolean().optional(),
  pushToken: z.string().max(512).optional(),
});
