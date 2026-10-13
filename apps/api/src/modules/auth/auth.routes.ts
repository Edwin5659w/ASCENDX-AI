import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { env } from '../../config/env.js';
import { parseBody } from '../../middleware/validate.js';
import { loginSchema, refreshSchema, registerSchema } from './auth.schemas.js';
import * as authService from './auth.service.js';

export const authRouter = Router();

/** Límite estricto para frenar ataques de fuerza bruta: 10 intentos cada 15 minutos por IP. */
const credentialsLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: { error: { code: 'TOO_MANY_ATTEMPTS', message: 'Demasiados intentos. Espera unos minutos.' } },
});

authRouter.post('/register', credentialsLimiter, async (req, res) => {
  const session = await authService.register(parseBody(registerSchema, req));
  res.status(201).json(session);
});

authRouter.post('/login', credentialsLimiter, async (req, res) => {
  const session = await authService.login(parseBody(loginSchema, req));
  res.json(session);
});

authRouter.post('/refresh', async (req, res) => {
  const { refreshToken } = parseBody(refreshSchema, req);
  res.json(await authService.refresh(refreshToken));
});

authRouter.post('/logout', async (req, res) => {
  const { refreshToken } = parseBody(refreshSchema, req);
  await authService.logout(refreshToken);
  res.status(204).end();
});
