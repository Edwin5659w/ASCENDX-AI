import { z } from 'zod';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Correo electrónico inválido').max(254));

/**
 * Política de contraseña: 8–72 caracteres (72 es el límite de bcrypt),
 * con al menos una letra y un número.
 */
export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña no puede superar 72 caracteres')
  .refine((value) => /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(value), 'La contraseña debe incluir al menos una letra')
  .refine((value) => /\d/.test(value), 'La contraseña debe incluir al menos un número');

export const registerSchema = z.object({
  email,
  password: passwordSchema,
  fullName: z.string().trim().min(2, 'Escribe tu nombre').max(80),
  acceptPrivacyPolicy: z.literal(true, {
    error: 'Debes aceptar la política de tratamiento de datos para crear la cuenta',
  }),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Escribe tu contraseña').max(72),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20).max(200),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
