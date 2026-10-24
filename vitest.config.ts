import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Engine-only tests (pure TS, no React Native): see tests/.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
