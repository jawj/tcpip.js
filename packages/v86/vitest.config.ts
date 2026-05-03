import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.ts'],
    setupFiles: ['test/setup.ts'],
    environment: 'node',
    testTimeout: 10_000,
  },
  optimizeDeps: {
    exclude: ['v86'],
  },
});
