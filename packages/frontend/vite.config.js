import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  // Existing .env files use VUE_APP_* (Vue CLI convention) -- keep that
  // prefix instead of renaming every env var to Vite's default VITE_*.
  envPrefix: 'VUE_APP_',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    // Vue CLI's webpack config resolved extensionless .vue imports, and
    // this codebase relies on that throughout. Vite doesn't do this by
    // default (its docs suggest explicit extensions instead, for larger
    // projects), but for this project's size the resolver cost is a
    // non-issue and it avoids touching ~40 import lines across 16 files.
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue'],
  },
  server: {
    port: 8080,
  },
  build: {
    // The backend serves the built SPA straight out of this directory.
    outDir: '../backend/__client-app-build',
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
    // e2e/**/*.spec.js are Playwright specs (own runner, own `test`
    // global) -- Vitest's default globs would otherwise pick them up
    // too and fail trying to run them as unit tests.
    exclude: ['**/node_modules/**', 'e2e/**'],
  },
});
