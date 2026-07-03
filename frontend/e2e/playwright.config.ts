import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the end-to-end smoke suite. Point E2E_BASE_URL at a running frontend
 * (default http://localhost:4200, which proxies /api to the backend on :8073).
 */
export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
