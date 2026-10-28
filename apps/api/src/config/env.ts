import 'dotenv/config';
import { z } from 'zod';

/**
 * Variables de entorno validadas al arrancar.
 * Si falta algo crítico, el servidor no inicia (falla rápido y con un mensaje claro).
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres'),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  /**
   * Proveedor de IA (sección 7). «local» = explicaciones generadas con reglas a
   * partir de las cifras del sistema, sin enviar datos a terceros.
   */
  AI_PROVIDER: z.enum(['local', 'anthropic', 'openai']).default('local'),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().optional(),
  /** Para proveedores compatibles con la API de OpenAI (OpenAI, Groq, Gemini…) */
  AI_BASE_URL: z.string().url().optional(),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Configuración inválida. Revisa el archivo .env:\n${issues}`);
  }
  return parsed.data;
}

export const env = loadEnv();

if (env.AI_PROVIDER !== 'local' && !env.AI_API_KEY) {
  throw new Error(`AI_PROVIDER=${env.AI_PROVIDER} necesita AI_API_KEY. Usa AI_PROVIDER=local para trabajar sin IA externa.`);
}
export const isProduction = env.NODE_ENV === 'production';
