export type FieldStatus = 'idle' | 'valid' | 'invalid';

export interface FieldValidation {
  status: FieldStatus;
  message?: string;
}

export interface PasswordChecks {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  noSpaces: boolean;
}

export interface PasswordValidation extends FieldValidation {
  strength: 0 | 1 | 2 | 3 | 4;
  checks: PasswordChecks;
  score: number;
}

const NAME_REGEX = /^[\p{L}]+(?:[' -][\p{L}]+)*$/u;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function validateFullName(value: string, touched = true): FieldValidation {
  if (!touched && !value) return { status: 'idle' };
  const trimmed = value.trim().replace(/\s+/g, ' ');

  if (!trimmed) return { status: 'invalid', message: 'Ingresa tu nombre completo' };
  if (trimmed.length < 3) return { status: 'invalid', message: 'Nombre demasiado corto' };

  const parts = trimmed.split(' ');
  if (parts.length < 2) {
    return { status: 'invalid', message: 'Ingresa nombre y apellido (ej: Juan Pérez)' };
  }
  if (parts.some((p) => p.length < 2)) {
    return { status: 'invalid', message: 'Cada nombre debe tener al menos 2 letras' };
  }
  if (trimmed.length > 50) return { status: 'invalid', message: 'Máximo 50 caracteres' };
  if (!NAME_REGEX.test(trimmed)) {
    return { status: 'invalid', message: 'Solo letras, espacios, guiones o apóstrofes' };
  }
  if (/\d/.test(trimmed)) return { status: 'invalid', message: 'El nombre no puede contener números' };

  return { status: 'valid' };
}

export function validateEmail(value: string, touched = true): FieldValidation {
  if (!touched && !value) return { status: 'idle' };
  const trimmed = value.trim().toLowerCase();

  if (!trimmed) return { status: 'invalid', message: 'Ingresa tu correo electrónico' };
  if (!EMAIL_REGEX.test(trimmed)) return { status: 'invalid', message: 'Formato de correo inválido' };
  if (trimmed.length > 255) return { status: 'invalid', message: 'Correo demasiado largo' };

  return { status: 'valid' };
}

export function getPasswordChecks(password: string): PasswordChecks {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
    noSpaces: !/\s/.test(password),
  };
}

export function validatePassword(password: string, touched = true): PasswordValidation {
  const checks = getPasswordChecks(password);
  const passed = Object.values(checks).filter(Boolean).length;

  if (!touched && !password) {
    return { status: 'idle', strength: 0, checks, score: 0 };
  }

  if (!password) {
    return { status: 'invalid', message: 'Crea una contraseña', strength: 0, checks, score: 0 };
  }

  let strength: 0 | 1 | 2 | 3 | 4 = 0;
  if (passed >= 2) strength = 1;
  if (passed >= 4) strength = 2;
  if (passed >= 5 && password.length >= 10) strength = 3;
  if (passed === 6 && password.length >= 12) strength = 4;

  const allValid = passed === 6;

  if (!checks.minLength) {
    return { status: 'invalid', message: 'Mínimo 8 caracteres', strength, checks, score: passed };
  }
  if (!checks.noSpaces) {
    return { status: 'invalid', message: 'Sin espacios en la contraseña', strength, checks, score: passed };
  }
  if (!allValid) {
    return {
      status: 'invalid',
      message: 'La contraseña no cumple todos los requisitos',
      strength,
      checks,
      score: passed,
    };
  }
  if (password.length > 128) {
    return { status: 'invalid', message: 'Máximo 128 caracteres', strength, checks, score: passed };
  }

  return { status: 'valid', strength, checks, score: passed };
}

export function validateLoginEmail(value: string, touched = true): FieldValidation {
  return validateEmail(value, touched);
}

export function validateLoginPassword(value: string, touched = true): FieldValidation {
  if (!touched && !value) return { status: 'idle' };
  if (!value) return { status: 'invalid', message: 'Ingresa tu contraseña' };
  return { status: 'valid' };
}

export const PASSWORD_REQUIREMENTS = [
  { key: 'minLength' as const, label: 'Al menos 8 caracteres' },
  { key: 'hasUpper' as const, label: 'Una letra mayúscula' },
  { key: 'hasLower' as const, label: 'Una letra minúscula' },
  { key: 'hasNumber' as const, label: 'Un número' },
  { key: 'hasSpecial' as const, label: 'Un carácter especial (!@#$...)' },
  { key: 'noSpaces' as const, label: 'Sin espacios' },
];

export const STRENGTH_LABELS = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte'] as const;
