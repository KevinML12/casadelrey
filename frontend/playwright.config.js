import { defineConfig, devices } from '@playwright/test';

// E2E contra el sitio REAL desplegado (Vercel + Fly + Supabase), no un
// mock — la filosofía del proyecto es "nada estático, todo el flujo
// real". PW_BASE_URL permite apuntar a localhost si se levanta el dev
// server (`npm run dev`) en otra sesión.
const baseURL = process.env.PW_BASE_URL || 'https://casadelreyhue.vercel.app';

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
