import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/ascendx_test',
      JWT_ACCESS_SECRET: 'test-access-secret-que-tiene-mas-de-32-caracteres',
      LOG_LEVEL: 'silent',
    },
  },
});
