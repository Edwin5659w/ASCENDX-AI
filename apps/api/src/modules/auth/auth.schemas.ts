import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Escribe un correo válido').max(254));

/**
 * Contraseña: 8–72 caracteres con al menos una letra y un número (RF-01).
 * Las mismas reglas se muestran en la app.
 */
export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña no puede superar 72 caracteres')
  .refine((value) => /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(value), 'La contraseña debe incluir al menos una letra')
  .refine((value) => /\d/.test(value), 'La contraseña debe incluir al menos un número');

const deviceName = z.string().trim().max(80).optional();

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Escribe tu nombre').max(80),
  email: emailSchema,
  password: passwordSchema,
  isAdult: z.literal(true, { error: 'ASCENDX AI es solo para mayores de 18 años' }),
  acceptTerms: z.literal(true, { error: 'Debes aceptar los términos y condiciones' }),
  acceptDataPolicy: z.literal(true, { error: 'Debes autorizar el tratamiento de tus datos personales' }),
  deviceName,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Escribe tu contraseña').max(72),
  deviceName,
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20).max(200),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/, 'El código tiene 6 dígitos'),
  newPassword: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
