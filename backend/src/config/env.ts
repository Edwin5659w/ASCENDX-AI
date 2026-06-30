import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  WEB_APP_ORIGIN: z.string().url().default('http://localhost:5173'),
  RESEND_API_KEY: z.string().optional(),
  /** Dirección "From" verificada en Resend, ej: onboarding@resend.dev o noreply@tudominio.com */
  RESEND_FROM: z.string().min(1).optional(),
  /** Opcional: token de acceso Expo para límites/envío en producción */
  EXPO_ACCESS_TOKEN: z.string().optional(),
  /** Stripe — opcional en dev; obligatorio en producción con pagos */
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRO_PRICE_ID: z.string().optional(),
  STRIPE_PRO_ANNUAL_PRICE_ID: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  /** Cron de emails de retención (09:00 UTC) */
  RETENTION_CRON_ENABLED: z
    .string()
    .optional()
    .transform((v) => v !== 'false' && v !== '0'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
