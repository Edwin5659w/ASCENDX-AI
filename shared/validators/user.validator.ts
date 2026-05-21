import { z } from 'zod';
import { passwordSchema } from './auth.validator';

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

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual obligatoria'),
  newPassword: passwordSchema,
});
