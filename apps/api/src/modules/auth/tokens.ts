import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

const ISSUER = 'ascendx-api';
const AUDIENCE = 'ascendx-mobile';

/** Token de acceso JWT de 15 min. Solo lleva el id del usuario y de la sesión. */
export function signAccessToken(userId: string, sessionId: string): string {
  return jwt.sign({ sid: sessionId }, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    subject: userId,
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: env.ACCESS_TOKEN_TTL_MINUTES * 60,
  });
}

/** Devuelve el id del usuario o null si el token es inválido o expiró. */
export function verifyAccessToken(token: string): { userId: string; sessionId: string | null } | null {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof payload !== 'object' || typeof payload.sub !== 'string') return null;
    return { userId: payload.sub, sessionId: typeof payload.sid === 'string' ? payload.sid : null };
  } catch {
    return null;
  }
}

/** Token de renovación opaco. En la base de datos solo se guarda su hash SHA-256. */
export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function refreshTokenExpiry(from = new Date()): Date {
  return new Date(from.getTime() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/** RF-03: código de 6 dígitos para recuperar la contraseña. */
export function generateResetCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

/** El código se guarda como HMAC con el secreto del servidor (no se puede revertir sin el secreto). */
export function hashResetCode(code: string): string {
  return createHmac('sha256', env.JWT_ACCESS_SECRET).update(`reset:${code}`).digest('hex');
}

export function resetCodeMatches(code: string, storedHash: string): boolean {
  const a = Buffer.from(hashResetCode(code), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
