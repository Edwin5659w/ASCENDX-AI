import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { env } from '../../config/env.js';
import { parseBody } from '../../middleware/validate.js';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
} from './auth.schemas.js';
import * as authService from './auth.service.js';

export const authRouter = Router();

/** RNF-03: 10 intentos por IP cada 15 minutos en registro, inicio de sesión y recuperación. */
const credentialsLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: { error: { code: 'TOO_MANY_ATTEMPTS', message: 'Hiciste demasiados intentos. Espera 15 minutos.' } },
});

authRouter.post('/register', credentialsLimiter, async (req, res) => {
  res.status(201).json(await authService.register(parseBody(registerSchema, req)));
});

authRouter.post('/login', credentialsLimiter, async (req, res) => {
  res.json(await authService.login(parseBody(loginSchema, req)));
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

/** RF-03: pedir el código. Siempre responde 202 para no revelar si el correo existe. */
authRouter.post('/password/forgot', credentialsLimiter, async (req, res) => {
  const { email } = parseBody(forgotPasswordSchema, req);
  await authService.requestPasswordReset(email);
  res.status(202).json({ message: 'Si el correo está registrado, te enviamos un código de 6 dígitos.' });
});

/** RF-03: usar el código y crear una contraseña nueva. */
authRouter.post('/password/reset', credentialsLimiter, async (req, res) => {
  await authService.resetPassword(parseBody(resetPasswordSchema, req));
  res.status(204).end();
});
