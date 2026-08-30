import { defineConfig, devices } from '@playwright/test';

// Router uses createWebHistory('audio-library'), so every route lives
// under /audio-library/ -- baseURL bakes that in so specs can just do
// page.goto('/login') etc.
export default defineConfig({
  testDir: './e2e',
  // This suite is small and only runs against one already-slow-to-boot
  // dev server; parallel workers racing a cold Vite dep pre-bundle on
  // first boot caused a real (if one-off) navigation timeout. Not worth
  // tuning timeouts around when serializing costs nothing at this size.
  workers: 1,
  reporter: [['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:8080/audio-library/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // Only the frontend dev server is booted here. Deliberately not
  // starting the backend too: it's wired to the real dev Mongo/SMTP (see
  // packages/backend/CLAUDE.md), and there's no test-only DB or
  // verified-user shortcut yet. Every spec in ./e2e must stay
  // unauthenticated and non-mutating until that lands -- see
  // packages/frontend/CLAUDE.md's "e2e tests" section.
  webServer: {
    command: 'npm run serve',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
