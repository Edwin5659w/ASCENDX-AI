import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import goalRoutes from './routes/goal.routes';
import taskRoutes from './routes/task.routes';
import habitRoutes from './routes/habit.routes';
import financeRoutes from './routes/finance.routes';
import tradeRoutes from './routes/trade.routes';
import aiRoutes from './routes/ai.routes';

export function createApp() {
  const app = express();
  const corsOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '10kb' }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Demasiadas solicitudes, intenta más tarde' },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, error: 'Demasiados intentos de autenticación' },
  });

  const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Límite de consultas IA alcanzado; prueba en unos minutos' },
  });

  app.use(limiter);

  app.get('/health', (_req, res) => {
    res.json({ success: true, service: 'ASCENDX AI API', status: 'ok' });
  });

  app.use('/auth', authLimiter, authRoutes);
  app.use('/user', userRoutes);
  app.use('/goals', goalRoutes);
  app.use('/tasks', taskRoutes);
  app.use('/habits', habitRoutes);
  app.use('/finance', financeRoutes);
  app.use('/trades', tradeRoutes);
  app.use('/ai', aiLimiter, aiRoutes);

  app.use(errorHandler);

  return app;
}
