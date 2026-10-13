import type { Request, RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';
import { HttpError } from '../lib/http-error.js';
import { verifyAccessToken } from '../modules/auth/tokens.js';

/**
 * Exige un token de acceso válido (Authorization: Bearer <token>) y deja el
 * id del usuario en req.auth. Toda consulta usa ese id, nunca uno enviado por
 * el cliente (sección 10 del v2).
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload) {
    next(HttpError.unauthorized());
    return;
  }
  req.auth = { userId: payload.userId };
  next();
};

/** RNF-03: 100 solicitudes por minuto por usuario autenticado. */
export const userRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => req.auth?.userId ?? 'anonimo',
  skip: () => env.NODE_ENV === 'test',
  message: { error: { code: 'RATE_LIMITED', message: 'Demasiadas solicitudes. Espera un momento.' } },
});

/** Autenticación + límite por usuario, para montar en cada router protegido. */
export const protectedRoute: RequestHandler[] = [requireAuth, userRateLimit];

export function currentUserId(req: Request): string {
  if (!req.auth) throw HttpError.unauthorized();
  return req.auth.userId;
}
