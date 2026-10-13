import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { simulatorRouter } from './modules/simulator/simulator.routes.js';
import { usersRouter } from './modules/users/users.routes.js';

/**
 * Crea la aplicación Express sin abrir el puerto, para poder probarla
 * con supertest.
 */
export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // Los montos se guardan como BIGINT (pesos enteros); en JSON se envían como número.
  app.set('json replacer', (_key: string, value: unknown) => (typeof value === 'bigint' ? Number(value) : value));
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      // La app móvil nativa no envía Origin; CORS solo aplica a navegadores (p. ej. Expo web en desarrollo).
      origin: env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : false,
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  if (env.NODE_ENV !== 'test') {
    app.use(pinoHttp({ logger }));
  }

  // Límite general por IP (las rutas protegidas tienen además 100/min por usuario, RNF-03)
  app.use(
    '/api',
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      skip: () => env.NODE_ENV === 'test',
    }),
  );

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/me', usersRouter);
  app.use('/api/simulator', simulatorRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
