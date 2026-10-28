import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { categoriesRouter } from './modules/categories/categories.routes.js';
import { debtsRouter } from './modules/debts/debts.routes.js';
import { dashboardRouter } from './modules/finance/dashboard.routes.js';
import { goalsRouter } from './modules/goals/goals.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { scenariosRouter } from './modules/simulator/scenarios.routes.js';
import { simulatorRouter } from './modules/simulator/simulator.routes.js';
import { transactionsRouter } from './modules/transactions/transactions.routes.js';
import { usersRouter } from './modules/users/users.routes.js';

/**
 * Crea la aplicación Express sin abrir el puerto, para poder probarla
 * con supertest.
 */
/** Vista previa web de Expo en el propio computador. */
const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // Los montos se guardan como BIGINT (pesos enteros); en JSON se envían como número.
  app.set('json replacer', (_key: string, value: unknown) => (typeof value === 'bigint' ? Number(value) : value));
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      // La app móvil nativa no envía Origin; CORS solo aplica a navegadores.
      // Se permiten los orígenes configurados y la vista previa web local de Expo
      // (http://localhost:<puerto>). Es seguro porque la API usa tokens Bearer, no cookies.
      origin: (origin, callback) => {
        const allowed = !origin || env.CORS_ORIGINS.includes(origin) || LOCAL_ORIGIN.test(origin);
        callback(null, allowed);
      },
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
  app.use('/api/simulator/scenarios', scenariosRouter);
  app.use('/api/simulator', simulatorRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/transactions', transactionsRouter);
  app.use('/api/debts', debtsRouter);
  app.use('/api/goals', goalsRouter);
  app.use('/api/dashboard', dashboardRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
