import { z } from 'zod';
import { CURRENCY_CODES, isValidCurrency } from '../currencies';
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
  productTourDone: z.boolean().optional(),
  pushToken: z.string().max(512).optional(),
  preferredCurrency: z
    .string()
    .refine(isValidCurrency, `Moneda no soportada. Usa: ${CURRENCY_CODES.join(', ')}`)
    .optional(),
  tradingJournalEnabled: z.boolean().optional(),
  dailyFocus: z.string().trim().max(120, 'Máximo 120 caracteres').optional(),
  emailOptIn: z.boolean().optional(),
  themePreference: z.enum(['dark', 'light']).optional(),
});

export const dailyFocusSchema = z.object({
  focus: z.string().trim().min(3, 'Mínimo 3 caracteres').max(120, 'Máximo 120 caracteres'),
});

export const deleteAccountSchema = z
  .object({
    password: z.string().min(1).optional(),
    /** Para cuentas Google/Apple: escribe ELIMINAR */
    confirmText: z.string().optional(),
  })
  .refine((d) => !!(d.password && d.password.length > 0) || d.confirmText === 'ELIMINAR', {
    message: 'Confirma con tu contraseña o escribe ELIMINAR si entraste con Google/Apple',
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual obligatoria'),
  newPassword: passwordSchema,
});
