import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom', // Need jsdom for Web Crypto API
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/__tests__/**', 'src/expo.d.ts']
    }
  },
  resolve: {
    alias: {
      '@genomeforge/types': new URL('../types/src', import.meta.url).pathname
    }
  }
});
