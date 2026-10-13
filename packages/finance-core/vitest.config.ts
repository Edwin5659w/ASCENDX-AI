import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/index.ts'],
      // RNF-09 del Documento Maestro v2: cobertura ≥ 90 % en finance-core
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
    },
  },
});
