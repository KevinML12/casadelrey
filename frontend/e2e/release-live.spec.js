// Opt-in release verification. Only the named Render QA backend may receive writes.
// Credentials stay outside the repository; traces/video are disabled for real login.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const API = 'https://casadelrey-api-pruebas.onrender.com/api/v1';
const enabled = process.env.E2E_RENDER_LIVE === '1';
const accounts = enabled ? JSON.parse(readFileSync(process.env.E2E_QA_USERS_FILE, 'utf8')) : [];
test.skip(!enabled, 'Explicit QA release verification only');
test.use({ trace: 'off', video: 'off', screenshot: 'off' });
const publicRoutes = ['/', '/about', '/celulas', '/volunteering', '/events', '/gallery', '/blog', '/conectate', '/prayer', '/donate', '/comprobante', '/login', '/register', '/forgot-password', '/verify-email', '/reset-password', '/payment-success', '/no-existe'];
const adminRoutes = ['', 'users', 'blog', 'events', 'petitions', 'volunteers', 'cell-reports', 'boletas', 'social', 'announcements', 'gallery', 'faqs', 'leaders', 'cells', 'cell-categories', 'volunteer-areas', 'donation-purposes', 'activity-log', 'receipts', 'donations', 'hero', 'site-photos', 'settings', 'connect-cards', 'profile'];
async function login(page, role = 'admin') {
  const user = accounts.find(account => account.role === role);
  if (!user) throw new Error(`Missing QA account role: ${role}`);
  await page.goto('/login');
  await page.locator('input[type=email]').fill(user.email);
  await page.locator('input[type=password]').fill(user.password);
  await page.getByRole('button', { name: /ingresar/i }).click();
  await expect(page).not.toHaveURL(/\/login$/, { timeout: 95000 });
}
async function authHeaders(page) {
  return { Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}` };
}
for (const width of [390, 1440]) {
  test(`live public modules render without runtime errors at ${width}px`, async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width, height: 900 }); await page.emulateMedia({ reducedMotion: 'reduce' });
    const failures = []; page.on('pageerror', error => failures.push(error.message));
    for (const route of publicRoutes) {
      await test.step(route, async () => {
        await page.goto(route); await expect(page.locator('main')).toBeVisible();
        await expect(page.locator('h1')).toHaveCount(1);
        await expect(page.getByText(/Unexpected Application Error|Algo salió mal/)).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route).toBe(true);
      });
    }
    expect(failures).toEqual([]);
  });
}
test('live administrator can open every module and member cannot enter administration', async ({ page }) => {
  test.setTimeout(240000); await login(page); const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  const badRequests = [];
  page.on('response', response => { if (response.url().includes('/api/v1/') && response.status() >= 400) badRequests.push(`${response.status()} ${new URL(response.url()).pathname}`); });
  for (const route of adminRoutes) {
    await test.step(`/admin/${route}`, async () => {
      await page.goto(`/admin/${route}`); await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('main h1, main h2').first()).toBeVisible();
      await expect(page.getByText(/Unexpected Application Error|Algo salió mal/)).toHaveCount(0);
      await page.waitForLoadState('networkidle');
    });
  }
  expect(failures).toEqual([]); expect([...new Set(badRequests)]).toEqual([]);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); await login(page, 'member');
  await page.goto('/profile'); await expect(page.locator('main')).toBeVisible();
  await page.goto('/admin'); await expect(page).toHaveURL(/\/$/);
});
test('live prayer and connection submissions reach their administrator modules', async ({ page }) => {
  test.setTimeout(180000); await login(page); const headers = await authHeaders(page);
  const stamp = `QA revisión ${Date.now()}`; const created = [];
  try {
    await page.goto('/prayer');
    await page.getByLabel('Nombre *', { exact: true }).fill('Prueba automatizada QA');
    await page.getByLabel('Asunto *', { exact: true }).fill(stamp);
    await page.getByLabel('Petición *', { exact: true }).fill('Verificación técnica de pruebas. No corresponde a una petición real.');
    const prayerResponse = page.waitForResponse(r => r.url().includes('/contact/petition') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Enviar petición', exact: true }).click();
    const response = await prayerResponse; expect(response.status()).toBe(201);
    const petition = await response.json(); created.push(`/admin/petitions/${petition.id || petition.ID}`);
    await expect(page.getByText('¡Recibida con amor!')).toBeVisible();
    await page.goto('/admin/petitions'); await expect(page.getByText(stamp, { exact: true })).toBeVisible();
    await page.goto('/conectate'); await page.getByRole('button', { name: /Es mi primera vez/ }).click();
    await page.getByLabel('Nombre *', { exact: true }).fill(stamp);
    await page.getByLabel('Teléfono *', { exact: true }).fill('00000000');
    const connectResponse = page.waitForResponse(r => r.url().includes('/connect-cards') && r.request().method() === 'POST');
    await page.locator('button[type=submit]').click();
    const connection = await connectResponse; expect(connection.status()).toBe(201);
    const card = await connection.json(); created.push(`/admin/connect-cards/${card.ID || card.id}`);
    await expect(page.getByText('¡Gracias por registrarte!')).toBeVisible();
    await page.goto('/admin/connect-cards'); await expect(page.getByText(stamp, { exact: true })).toBeVisible();
  } finally {
    for (const path of created) expect((await page.request.delete(API + path, { headers })).ok(), `QA cleanup ${path}`).toBe(true);
  }
});
