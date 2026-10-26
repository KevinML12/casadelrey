// Local regression suite: every API call is intercepted and external hosts blocked.
import { test, expect } from '@playwright/test';

const fixtureToken = (name, role = 'volunteer') => ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({ user_id: 999, name, role, exp: 2000000000 })).toString('base64url'), 'ui-fixture'].join('.');
async function isolatedAPI(page, onAPI = () => null) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/api/v1')) {
      const path = url.pathname.split('/api/v1')[1];
      const custom = await onAPI(path, route.request());
      if (custom?.binary) return route.fulfill({ status: custom.status || 200, contentType: custom.contentType || 'image/png', body: custom.binary });
      const body = custom?.body ?? (['/settings', '/site-photos'].includes(path) ? {} : ['/hero/active', '/volunteer/me'].includes(path) ? null : []);
      return route.fulfill({ status: custom?.status || 200, contentType: 'application/json', body: JSON.stringify(body) });
    }
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
    return route.continue();
  });
}

test('reset accepts emailed query URL and sends the backend contract', async ({ page }) => {
  let payload;
  await isolatedAPI(page, (path, req) => {
    if (path === '/auth/reset-password') { payload = req.postDataJSON(); return { body: { message: 'Actualizada' } }; }
  });
  await page.goto('/reset-password?token=reset-fixture');
  await expect(page.getByRole('heading', { name: 'Nueva contraseña' })).toBeVisible();
  await page.getByLabel(/^Nueva contraseña/).fill('NewPassword123!');
  await page.getByLabel('Confirmar contraseña').fill('NewPassword123!');
  await page.getByRole('button', { name: 'Guardar contraseña' }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(payload).toEqual({ token: 'reset-fixture', newPassword: 'NewPassword123!' });
});

test('shared dialog traps focus, closes on Escape and restores the trigger', async ({ page }) => {
  await isolatedAPI(page);
  await page.goto('/celulas');
  const trigger = page.getByRole('button', { name: 'Busca por edad y zona' });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  expect(await page.evaluate(() => document.getElementById('root').inert)).toBe(true);
  const close = dialog.getByRole('button', { name: 'Cerrar', exact: true });
  await close.focus();
  await page.keyboard.press('Tab');
  expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.getElementById('root').inert)).toBe(false);
});

test('volunteer submits via self-service and the shared close works', async ({ page }) => {
  let submitted;
  await isolatedAPI(page, (path, req) => {
    if (path === '/volunteer/reports' && req.method() === 'POST') { submitted = req.postDataJSON(); return { status: 201, body: { id: 12 } }; }
  });
  await page.addInitScript(token => localStorage.setItem('token', token), fixtureToken('Fixture volunteer'));
  await page.goto('/volunteer/dashboard');
  const trigger = page.getByRole('button', { name: 'Nuevo Reporte' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Reporte de servicio' });
  await dialog.getByLabel('Área de Servicio *').fill('Bienvenida');
  await dialog.getByLabel('Fecha del Servicio *').fill('2026-10-03');
  await dialog.getByRole('button', { name: 'Enviar Reporte' }).click();
  await expect(dialog).toHaveCount(0);
  expect(submitted.area).toBe('Bienvenida');
  expect(submitted.volunteer_name).toBe('Fixture volunteer');
  await trigger.click();
  await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
});

test('donation retries preserve the key and include the receipt in the same request', async ({ page }) => {
  const writes = [];
  await isolatedAPI(page, (path, req) => {
    if (req.method() === 'POST') {
      if (path === '/receipts/upload') return { status: 201, body: { url: 'receipt-private:01234567-89ab-4cde-8012-3456789abcde.png' } };
      writes.push({ path, body: req.postDataJSON(), key: req.headers()['idempotency-key'] });
      if (writes.length === 1) return { status: 503, body: { error: 'Fallo temporal de prueba' } };
      return { status: 201, body: { id: 13 } };
    }
  });
  await page.goto('/donate');
  const next = page.getByRole('button', { name: /^Continuar$/i });
  await expect(page.getByText('¿Cuánto quieres sembrar?')).toBeVisible();
  await next.click();
  await expect(page.getByText('¿A dónde va tu siembra?')).toBeVisible();
  await expect(next).toHaveCount(1); await next.click();
  await expect(page.getByText('¿Cómo quieres darlo?')).toBeVisible();
  await page.locator('input[type=file]').setInputFiles({ name: 'receipt.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lS8AAAAASUVORK5CYII=', 'base64') });
  await expect(page.getByRole('img', { name: 'comprobante', exact: true })).toHaveAttribute('src', /^blob:/);
  await expect(next).toHaveCount(1); await expect(next).toBeEnabled(); await next.click();
  await expect(page.getByText('Últimos datos y listo.')).toBeVisible();
  await page.getByPlaceholder('Tu nombre').fill('Fixture donor');
  await page.getByRole('button', { name: 'Enviar donación y comprobante', exact: true }).click();
  await expect(page.getByText('Fallo temporal de prueba', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Enviar donación y comprobante', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¡Gracias por sembrar!', exact: true })).toBeVisible();
  expect(writes).toHaveLength(2);
  expect(writes[0].key).toMatch(/^[0-9a-f-]{36}$/);
  expect(writes[1]).toEqual(writes[0]);
  expect(writes[0].path).toBe('/donations/register');
  expect(writes[0].body.receipt.receipt_image_url).toBe('receipt-private:01234567-89ab-4cde-8012-3456789abcde.png');
  const attempt = await page.evaluate(() => JSON.parse(sessionStorage.getItem('donation:attempt')));
  expect(attempt).toEqual({ fingerprint: expect.stringMatching(/^[0-9a-f]{64}$/), key: writes[0].key });
  await page.getByRole('button', { name: 'Hacer otra donación', exact: true }).click();
  expect(await page.evaluate(() => sessionStorage.getItem('donation:attempt'))).toBeNull();
});

test('admin opens private receipt through an authenticated request and local blob', async ({ page }) => {
  const authorizations = [];
  const token = fixtureToken('Fixture admin', 'admin');
  await isolatedAPI(page, (path, req) => {
    if (path === '/admin/receipts') return { body: { data: [{ ID: 91, payer_name: 'Private donor', amount: 100, purpose: 'donacion', status: 'pendiente', receipt_image_url: 'receipt-private:01234567-89ab-4cde-8012-3456789abcde.png' }], meta: { total: 1, page: 1, limit: 20 } } };
    if (path === '/admin/receipts/91/file') {
      authorizations.push(req.headers().authorization);
      return { binary: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lS8AAAAASUVORK5CYII=', 'base64') };
    }
  });
  await page.addInitScript(value => localStorage.setItem('token', value), token);
  await page.goto('/admin/receipts');
  await page.getByRole('button', { name: 'Ver comprobante de Private donor', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Verificar comprobante' })).toBeVisible();
  await expect(page.getByRole('link').filter({ has: page.getByRole('img', { name: 'comprobante', exact: true }) })).toHaveAttribute('href', /^blob:/);
  expect(authorizations.length).toBeGreaterThanOrEqual(2);
  expect(authorizations.every(value => value === `Bearer ${token}`)).toBe(true);
  for (const src of await page.getByRole('img', { name: 'comprobante', exact: true }).evaluateAll(images => images.map(img => img.src))) expect(src).toMatch(/^blob:/);
});

test('refresh updates the rendered account and stale defaults cannot survive logout', async ({ page }) => {
  let protectedCalls = 0; const headers = [];
  const renewedToken = fixtureToken('Renewed volunteer');
  await isolatedAPI(page, (path, req) => {
    if (path === '/auth/refresh') return { body: { token: renewedToken, refresh_token: 'rotated-fixture' } };
    if (path === '/fixture/protected') { protectedCalls++; return { status: protectedCalls === 1 ? 401 : 200, body: {} }; }
    if (path === '/fixture/after-logout') { headers.push(req.headers().authorization || null); return { body: {} }; }
  });
  await page.addInitScript(token => { localStorage.setItem('token', token); localStorage.setItem('refresh_token', 'initial-fixture'); }, fixtureToken('Initial volunteer'));
  await page.goto('/volunteer/dashboard');
  await expect(page.getByRole('heading', { name: 'Initial volunteer', exact: true })).toBeVisible();
  await page.evaluate(async () => { const { default: api } = await import('/src/lib/apiClient.js'); await api.get('/fixture/protected'); });
  await expect(page.getByRole('heading', { name: 'Renewed volunteer', exact: true })).toBeVisible();
  await page.evaluate(async () => {
    const { default: api } = await import('/src/lib/apiClient.js');
    api.defaults.headers.common.Authorization = 'Bearer stale-fixture';
    localStorage.removeItem('token'); localStorage.removeItem('refresh_token');
    window.dispatchEvent(new Event('auth:unauthorized'));
    await api.get('/fixture/after-logout');
  });
  expect(headers).toEqual([null]);
});
