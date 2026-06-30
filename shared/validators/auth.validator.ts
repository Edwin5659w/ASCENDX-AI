import { z } from 'zod';

const fullNameSchema = z
  .string()
  .trim()
  .min(3, 'El nombre completo es obligatorio')
  .max(50, 'El nombre no puede exceder 50 caracteres')
  .refine((val) => val.split(/\s+/).filter(Boolean).length >= 2, {
    message: 'Ingresa nombre y apellido (ej: Juan Pérez)',
  })
  .refine((val) => {
    const parts = val.split(/\s+/).filter(Boolean);
    return parts.every((p) => p.length >= 2);
  }, 'Cada nombre debe tener al menos 2 letras')
  .refine((val) => /^[\p{L}]+(?:[' -][\p{L}]+)*$/u.test(val.replace(/\s+/g, ' ')), {
    message: 'Solo letras, espacios, guiones o apóstrofes',
  })
  .refine((val) => !/\d/.test(val), 'El nombre no puede contener números');

export const passwordSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .max(128, 'Máximo 128 caracteres')
  .refine((val) => !/\s/.test(val), 'La contraseña no puede contener espacios')
  .refine((val) => /[A-Z]/.test(val), 'Debe incluir al menos una mayúscula')
  .refine((val) => /[a-z]/.test(val), 'Debe incluir al menos una minúscula')
  .refine((val) => /[0-9]/.test(val), 'Debe incluir al menos un número')
  .refine((val) => /[^A-Za-z0-9]/.test(val), 'Debe incluir al menos un carácter especial');

export const registerSchema = z.object({
  name: fullNameSchema,
  email: z
    .string()
    .trim()
    .email('Email inválido')
    .max(255, 'Email demasiado largo')
    .toLowerCase(),
  password: passwordSchema,
  referralCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(4, 'Código inválido')
    .max(12, 'Código inválido')
    .optional()
    .or(z.literal('')),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Email inválido').toLowerCase(),
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .max(128, 'La contraseña no puede exceder 128 caracteres'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requerido'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Email inválido').toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(32, 'Token inválido'),
  password: passwordSchema,
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(10, 'Token de Google inválido'),
  referralCode: z.string().trim().toUpperCase().max(12).optional(),
});

export const appleAuthSchema = z.object({
  identityToken: z.string().min(10, 'Token de Apple inválido'),
  fullName: z.string().trim().min(2).max(50).optional(),
  referralCode: z.string().trim().toUpperCase().max(12).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
