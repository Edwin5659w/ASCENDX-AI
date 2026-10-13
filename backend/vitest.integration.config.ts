import { defineConfig } from 'vitest/config';

/**
 * Pruebas de integración contra una base de datos PostgreSQL real.
 * Usa TEST_DATABASE_URL (por defecto la base local `ascendx_test`).
 * ¡Las pruebas BORRAN los datos de esa base! Nunca apuntes a la base de desarrollo o producción.
 */
const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/ascendx_test?schema=public';

export default defineConfig({
  test: {
    include: ['src/**/*.int.test.ts'],
    environment: 'node',
    fileParallelism: false,
    testTimeout: 20_000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: testDatabaseUrl,
      JWT_ACCESS_SECRET: 'test-access-secret-que-tiene-mas-de-32-caracteres',
      LOG_LEVEL: 'silent',
    },
  },
});
