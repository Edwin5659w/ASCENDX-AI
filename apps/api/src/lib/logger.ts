import { pino } from 'pino';
import { env, isProduction } from '../config/env.js';

/**
 * Logger estructurado. Nunca se deben registrar contraseñas, tokens,
 * imágenes de recibos ni datos financieros detallados: `redact` los oculta
 * aunque lleguen por error.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.passwordHash',
      '*.refreshToken',
      '*.accessToken',
      '*.token',
    ],
    censor: '[oculto]',
  },
  ...(isProduction || env.NODE_ENV === 'test'
    ? {}
    : { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } } }),
});
