import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

const ISSUER = 'ascendx-api';
const AUDIENCE = 'ascendx-mobile';

/** Token de acceso JWT de corta duración. Solo lleva el id del usuario. */
export function signAccessToken(userId: string): string {
  return jwt.sign({}, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    subject: userId,
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: env.ACCESS_TOKEN_TTL_MINUTES * 60,
  });
}

/** Devuelve el id del usuario o null si el token es inválido o expiró. */
export function verifyAccessToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return typeof payload === 'object' && typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Token de renovación opaco (aleatorio). En la base de datos solo se guarda su hash. */
export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function refreshTokenExpiry(from = new Date()): Date {
  return new Date(from.getTime() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}
