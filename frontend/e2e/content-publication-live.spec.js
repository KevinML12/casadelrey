// Explicit verification of imported content; temporary submissions are cleaned.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const enabled = process.env.E2E_RENDER_LIVE === '1';
const API = 'https://casadelrey-api-pruebas.onrender.com/api/v1';
const accounts = enabled ? JSON.parse(readFileSync(process.env.E2E_QA_USERS_FILE, 'utf8')) : [];
test.skip(!enabled, 'Requires explicit release verification');
test.use({ trace: 'off', video: 'off', screenshot: 'off' });

test('published records retain their real category, media and department relationships', async ({ request }) => {
  test.setTimeout(180000);
  for (const [path, count] of [['cells', 16], ['cell-categories', 5], ['volunteer-areas', 10], ['donation-purposes', 5], ['social/feed', 4]]) {
    const response = await request.get(`${API}/${path}?release=20261028`, { timeout: 95000 });
    expect(response.ok(), path).toBe(true); expect((await response.json()).length, path).toBe(count);
  }
  const categories = await (await request.get(`${API}/cell-categories?release=20261028`)).json();
  expect(categories.every(item => item.image_url.startsWith('https://pub-6dab501bcd5c4b8b9cfdd7aa6ee88595.r2.dev/'))).toBe(true);
  const gallery = await (await request.get(`${API}/gallery/?limit=1&release=20261028`)).json();
  expect(gallery.meta.total).toBe(495);
});

test('a real published cell routes a new request to its assigned leader', async ({ page }) => {
  test.setTimeout(180000);
  const account = accounts.find(item => item.role === 'admin');
  await page.goto('/login'); await page.locator('input[type=email]').fill(account.email);
  await page.locator('input[type=password]').fill(account.password);
  await page.getByRole('button', { name: /ingresar/i }).click(); await expect(page).not.toHaveURL(/\/login$/, { timeout: 95000 });
  const headers = { Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}` };
  const cells = await (await page.request.get(`${API}/admin/cells`, { headers })).json();
  const legacy = cells.find(cell => cell.code === 'V1');
  expect(legacy).toBeTruthy();
  const saved = await page.request.put(`${API}/admin/cells/${legacy.ID}`, { headers, data: legacy });
  expect(saved.status()).toBe(200);
  const savedCell = await saved.json();
  for (const key of ['code', 'name', 'type', 'leader_id', 'description', 'zone', 'address', 'map_url', 'day', 'time', 'what_to_expect', 'is_active']) {
    expect(savedCell[key], key).toEqual(legacy[key]);
  }
  let createdId;
  try {
    await page.goto('/celulas');
    const scene = page.getByRole('region', { name: 'Tipos de células', exact: true });
    await scene.getByRole('button', { name: /^Adolescentes/ }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('tab', { name: 'Información', exact: true }).click();
    await dialog.getByRole('button', { name: /^Ver la célula / }).first().click();
    await dialog.getByRole('button', { name: /^Quiero unirme a / }).click();
    await dialog.getByLabel('Tu nombre *', { exact: true }).fill(`QA verificación de célula ${Date.now()}`);
    await dialog.getByLabel('Teléfono o WhatsApp *', { exact: true }).fill('00000000');
    await dialog.getByLabel('Correo (opcional)', { exact: true }).fill('verificacion-celula@casadelrey.invalid');
    await dialog.getByRole('button', { name: 'Continuar', exact: true }).click();
    const pending = page.waitForResponse(response => response.url().includes('/connect-cards') && response.request().method() === 'POST');
    await dialog.getByRole('button', { name: 'Confirmar y Enviar', exact: true }).click();
    const response = await pending; expect(response.status()).toBe(201); createdId = (await response.json()).id;
    const chosenId = response.request().postDataJSON().cell_id;
    await expect(dialog.getByRole('heading', { name: '¡Solicitud enviada!', exact: true })).toBeVisible();
    const result = await (await page.request.get(`${API}/admin/connect-cards?limit=100`, { headers })).json();
    const card = result.data.find(item => item.ID === createdId); const cell = cells.find(item => item.ID === chosenId);
    expect(card.cell_id).toBe(chosenId); expect(card.leader_assigned_id).toBe(cell.leader_id);
  } finally {
    if (createdId) expect((await page.request.delete(`${API}/admin/connect-cards/${createdId}`, { headers })).ok()).toBe(true);
  }
});
