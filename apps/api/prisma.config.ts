import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Las migraciones usan la conexión directa. Si la dirección es la «agrupada»
 * de Neon (host con «-pooler»), se usa la directa equivalente.
 */
const databaseUrl = (process.env.DATABASE_URL ?? '').replace('-pooler.', '.');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl,
  },
});
