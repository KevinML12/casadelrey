import { test, expect } from '@playwright/test';
const image = '/images/backgrounds/congregacion.webp';
async function isolate(page, custom = () => undefined) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/api/v1')) {
      const path = url.pathname.split('/api/v1')[1];
      const response = await custom(path, route.request(), url);
      return route.fulfill({ status: response?.status || 200, contentType: 'application/json', body: JSON.stringify(response?.body ?? (['/settings', '/site-photos'].includes(path) ? {} : path === '/hero/active' ? null : [])) });
    }
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
    return route.continue();
  });
}
test('empty cell finder offers contact and an accessible close control', async ({ page }) => {
  await isolate(page); await page.setViewportSize({ width: 320, height: 640 }); await page.goto('/celulas');
  await page.getByRole('button', { name: 'Busca por edad y zona' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Aún no hay células publicadas' })).toBeVisible();
  const close = dialog.getByRole('button', { name: 'Cerrar', exact: true });
  expect((await close.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await expect(dialog.getByRole('link', { name: 'Déjanos tus datos' })).toHaveAttribute('href', '/conectate');
  await close.click(); await expect(dialog).toHaveCount(0);
  expect(await page.locator('#root').evaluate(el => el.inert)).toBe(false);
});
test('broken administrator hero uses its local photograph', async ({ page }) => {
  await isolate(page, path => path === '/site-photos' ? { body: { hero_galeria: '/missing-admin-photo.webp' } } : undefined);
  await page.goto('/gallery'); const hero = page.locator('.page-hero img');
  await expect.poll(() => hero.evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
  await expect(hero).not.toHaveAttribute('src', '/missing-admin-photo.webp');
});
test('nullable gallery is empty and retry recovers a failed feed', async ({ page }) => {
  let failing = true;
  await isolate(page, path => path.startsWith('/gallery/') ? failing ? { status: 503, body: {} } : { body: { data: null, meta: { pages: 1 } } } : undefined);
  await page.goto('/gallery'); await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
  failing = false; await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByText('Sin fotos publicadas aún.')).toBeVisible();
});
test('captions follow the background, albums reset photos and keyboard retains focus', async ({ page }) => {
  await isolate(page, path => path.startsWith('/gallery/') ? { body: { data: [
    ...Array.from({ length: 3 }, (_, i) => ({ ID: i + 1, title: `Álbum uno - Foto ${i + 1}`, description: `Descripción ${i + 1}`, url: image })),
    { ID: 10, title: 'Álbum dos - Foto', description: 'Otra descripción', url: image },
  ], meta: { pages: 1 } } } : undefined);
  await page.goto('/gallery'); await page.getByRole('button', { name: /^Álbum uno/ }).click();
  const dialog = page.getByRole('dialog'); await dialog.getByRole('tab', { name: 'Fotos', exact: true }).click();
  await dialog.getByRole('button', { name: 'Foto siguiente' }).click();
  await expect(dialog.getByRole('tabpanel')).toContainText('Descripción 2');
  await dialog.getByRole('button', { name: /^Siguiente/ }).click();
  await expect(dialog.getByRole('tabpanel')).toContainText('Otra descripción');
  await dialog.getByRole('button', { name: /^Anterior/ }).click();
  await expect(dialog.getByRole('tabpanel')).toContainText('Descripción 1');
  await dialog.getByRole('tabpanel').focus(); await page.keyboard.press('ArrowRight');
  await expect(dialog.getByRole('button', { name: /^Siguiente/ })).toBeFocused();
});
test('long titles fit mobile and past-event links select the requested event', async ({ page }) => {
  const title = 'Departamento'.repeat(14);
  await page.setViewportSize({ width: 320, height: 740 });
  await isolate(page, path => path.startsWith('/gallery/') ? { body: [{ ID: 1, title: `${title} - Foto`, url: image }] } : path === '/events/' ? { body: [
    { ID: 1, title: 'Evento elegido pasado', date: '2020-01-01' },
    { ID: 2, title: 'Evento más reciente', date: '2021-01-01' },
  ] } : undefined);
  await page.goto('/gallery'); await page.getByRole('button', { name: new RegExp(`^${title}`) }).click();
  const dialog = page.getByRole('dialog'); await expect(dialog.getByRole('button', { name: 'Cerrar', exact: true })).toBeVisible();
  expect(await dialog.evaluate(el => el.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press('Escape'); await page.goto('/events?id=1');
  await expect(page.getByRole('region', { name: 'Eventos pasados', exact: true }).getByRole('heading', { name: 'Evento elegido pasado' })).toBeVisible();
});
