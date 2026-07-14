import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_REPOSITORY?.endsWith('/screenshot-shield') ? '/screenshot-shield/' : '/',
  plugins: [react()],
  build: {
    sourcemap: true,
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
});
