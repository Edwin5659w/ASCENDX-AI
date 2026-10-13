import type { Request, RequestHandler } from 'express';
import { HttpError } from '../lib/http-error.js';
import { verifyAccessToken } from '../modules/auth/tokens.js';

/**
 * Exige un token de acceso válido en la cabecera Authorization: Bearer <token>
 * y deja el id del usuario en req.auth.userId.
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
  const userId = token ? verifyAccessToken(token) : null;
  if (!userId) {
    next(HttpError.unauthorized());
    return;
  }
  req.auth = { userId };
  next();
};

/** Devuelve el id del usuario autenticado (usar solo en rutas protegidas). */
export function currentUserId(req: Request): string {
  if (!req.auth) throw HttpError.unauthorized();
  return req.auth.userId;
}
