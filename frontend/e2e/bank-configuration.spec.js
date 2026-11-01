import { test, expect } from '@playwright/test';

const token = ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({ user_id: 99, name: 'Administrador', role: 'admin', exp: 2000000000 })).toString('base64url'), 'fixture'].join('.');
const complete = { bank_name: 'Banco indicado por la iglesia', bank_account: 'CONTROLLED-ACCOUNT', bank_account_type: 'Tipo indicado', bank_holder: 'Titular indicado por la iglesia' };
async function isolate(page, settings, admin = false) {
  if (admin) await page.addInitScript(value => localStorage.setItem('token', value), token);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/*', route => {
    const request = route.request(); const url = new URL(request.url());
    if (url.pathname.includes('/api/v1')) {
      const path = url.pathname.split('/api/v1')[1].replace(/\/$/, '');
      if (request.method() === 'PUT' && path.startsWith('/admin/settings/')) settings[path.split('/').at(-1)] = request.postDataJSON().value;
      const data = path === '/settings' ? settings : path === '/admin/settings' ? Object.entries(settings).map(([key, value]) => ({ key, value, label: { bank_name: 'Banco', bank_account: 'Número de cuenta', bank_account_type: 'Tipo de cuenta', bank_holder: 'A nombre de' }[key] || key })) : path === '/donation-purposes' ? [{ value: 'community', title: 'Comunidad' }] : path === '/site-photos' ? {} : [];
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
    }
    return ['localhost', '127.0.0.1'].includes(url.hostname) ? route.continue() : route.abort();
  });
}
async function payment(page) {
  await page.goto('/donate');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Comunidad', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Continuar', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByText('¿Cómo quieres darlo?')).toBeVisible();
}

test('an account alone never publishes inferred bank details', async ({ page }) => {
  await isolate(page, { bank_account: complete.bank_account }); await payment(page);
  await expect(page.getByRole('link', { name: /coordinar tu depósito/i })).toHaveAttribute('href', '/conectate');
  await expect(page.getByText(complete.bank_account, { exact: true })).toHaveCount(0);
  await expect(page.getByText(/Banrural|Monetaria/, { exact: true })).toHaveCount(0);
});

test('repeated activation during the transition cannot skip the destination step', async ({ page }) => {
  await isolate(page, complete); await page.goto('/donate');
  await page.getByRole('button', { name: 'Continuar', exact: true }).evaluate(button => { button.click(); button.click(); });
  await expect(page.getByText('¿A dónde va tu siembra?')).toBeVisible();
  await expect(page.getByText('¿Cómo quieres darlo?')).toHaveCount(0);
});

test('complete administrator data fits a narrow screen without substituting examples', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  const settings = { ...complete, bank_account: '1234567890123456789012345678901234567890', bank_holder: 'Nombre completo del titular confirmado por la iglesia y registrado en el banco' };
  await isolate(page, settings); await payment(page);
  for (const value of Object.values(settings)) await expect(page.getByText(value, { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /coordinar tu depósito/i })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('administrator readiness follows saved fields and clearing removes the public destination', async ({ page }) => {
  const settings = { ...complete, bank_account_type: '' };
  await isolate(page, settings, true); await page.goto('/admin/settings');
  const status = page.getByRole('complementary', { name: 'Estado de los datos bancarios' });
  await expect(status).toContainText('Falta guardar: Tipo de cuenta');
  const input = page.getByLabel('Tipo de cuenta', { exact: true }); await input.fill(complete.bank_account_type);
  await expect(status).toContainText('Falta guardar: Tipo de cuenta');
  await page.locator('form').filter({ has: input }).getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(status).toContainText('Datos bancarios completos y guardados');
  await page.getByLabel('A nombre de', { exact: true }).fill('');
  await page.locator('form').filter({ has: page.getByLabel('A nombre de', { exact: true }) }).getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(status).toContainText('Falta guardar: Titular');
  await payment(page); await expect(page.getByRole('link', { name: /coordinar tu depósito/i })).toBeVisible();
  await expect(page.getByText(complete.bank_account, { exact: true })).toHaveCount(0);
});
