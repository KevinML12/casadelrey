import { test, expect } from '@playwright/test';
import { volunteerAreas } from './fixtures/published-content.js';

const photo = '/images/backgrounds/congregacion.webp';
const routes = ['/', '/about', '/celulas', '/volunteering', '/events', '/gallery', '/blog', '/conectate', '/prayer', '/donate', '/comprobante', '/login', '/register', '/forgot-password', '/verify-email', '/reset-password', '/payment-success', '/no-existe'];
async function isolate(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/api/v1')) {
      const path = url.pathname.split('/api/v1')[1];
      let body = [];
      if (['/settings', '/site-photos'].includes(path)) body = {};
      if (path === '/hero/active') body = null;
      if (path === '/volunteer-areas') body = volunteerAreas;
      if (path === '/cell-categories') body = [{ ID: 1, name: 'Comunidad', image_url: photo, type_key: 'comunidad', is_active: true }];
      if (path === '/cells') body = [{ ID: 1, name: 'Comunidad del centro', type: 'comunidad', zone: 'Centro' }];
      if (path.startsWith('/gallery/')) body = { data: Array.from({ length: 6 }, (_, i) => ({ ID: i + 1, title: `${i < 5 ? 'Vida en comunidad' : 'Encuentros'} - Foto ${i + 1}`, url: photo, description: 'Fotografía administrada de la comunidad.' })), meta: { pages: 1 } };
      if (path === '/events/') body = [1, 2].map(ID => ({ ID, title: `Encuentro de la comunidad ${ID}`, date: '2099-11-01', cover_image: photo, description: 'Información administrada. '.repeat(30), requires_payment: false }));
      if (path === '/blog/') body = [1, 2].map(ID => ({ ID, title: `Mensaje para la comunidad ${ID}`, slug: `mensaje-${ID}`, category: 'Comunidad', cover_image: photo }));
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    }
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
    return route.continue();
  });
}
async function fitsViewport(locator) {
  const box = await locator.boundingBox();
  const viewport = locator.page().viewportSize();
  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y).toBeGreaterThanOrEqual(-1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
}

for (const width of [320, 360, 390, 768, 1024, 1920]) {
  test(`populated public modules fit ${width}px without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await isolate(page);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const path of routes) {
      await page.goto(path);
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('h1')).toBeVisible();
      // Wait for a populated collection, rather than only measuring its loading state.
      if (['/events', '/gallery', '/blog', '/volunteering'].includes(path)) await expect(page.locator('.collection-navigation')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}

for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }, { width: 768, height: 1024 }]) {
  test(`photo windows and registration stay usable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await isolate(page);
    await page.goto('/gallery');
    await page.getByRole('button', { name: /^Vida en comunidad/ }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('tab', { name: 'Fotos', exact: true }).click();
    await dialog.getByRole('button', { name: 'Foto siguiente' }).click();
    await expect(dialog.getByRole('status').first()).toHaveText('2 de 5');
    await fitsViewport(dialog.getByRole('button', { name: 'Cerrar', exact: true }));
    await fitsViewport(dialog.getByRole('button', { name: /^Siguiente/ }));
    expect(await dialog.evaluate(el => el.scrollWidth <= innerWidth)).toBe(true);
    await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
    await page.goto('/events');
    await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
    await page.getByLabel('Nombre *', { exact: true }).fill('Persona de la comunidad');
    await page.getByLabel('Correo *', { exact: true }).fill('persona@example.invalid');
    const submit = dialog.getByRole('button', { name: 'Confirmar asistencia', exact: true });
    await submit.scrollIntoViewIfNeeded();
    await fitsViewport(submit);
    const close = dialog.getByRole('button', { name: 'Cerrar', exact: true });
    await fitsViewport(close);
    expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await close.click();
    await expect(dialog).toHaveCount(0);
    expect(await page.locator('#root').evaluate(el => el.inert)).toBe(false);
  });
}
