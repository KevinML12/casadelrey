import { defineConfig, devices } from '@playwright/test';

// Local by default. Isolated regression suites intercept the API; explicit
// release suites opt in to the named Render QA backend and controlled accounts.
// PW_BASE_URL selects the local or published frontend. Never run mutation suites
// against production without their environment guard and cleanup.
const baseURL = process.env.PW_BASE_URL || 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // los tests de admin comparten estado (login, eventos creados)
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  timeout: 45_000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
