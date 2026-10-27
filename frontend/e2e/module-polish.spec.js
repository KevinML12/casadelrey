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
test('event preview exposes the background and opens full details without losing registration', async ({ page }) => {
  await isolate(page, path => path === '/events/' ? { body: [{ ID: 4, title: 'Encuentro administrado', description: 'Detalle completo administrado', cover_image: image, date: '2099-12-01', requires_payment: false }] } : undefined);
  await page.setViewportSize({ width: 390, height: 900 }); await page.goto('/events');
  const scene = page.getByRole('region', { name: 'Próximos eventos', exact: true });
  const section = page.locator('section[aria-label="Próximos eventos"]');
  await expect(section.locator('[data-scene-photo]')).toHaveClass(/opacity-100/);
  expect((await section.boundingBox()).height - (await scene.locator('.liquid-glass').boundingBox()).height).toBeGreaterThan(200);
  await expect(scene.getByText('Detalle completo administrado')).toHaveCount(0);
  await scene.getByRole('button', { name: 'Ver detalles' }).click();
  const dialog = page.getByRole('dialog'); await expect(dialog.getByText('Detalle completo administrado')).toBeVisible();
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
  const registration = page.getByRole('dialog').last(); await expect(registration.getByLabel('Nombre *', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.locator('#root').evaluate(el => el.inert)).toBe(false);
});
test('all public entry points keep a visible main landmark and a single page title', async ({ page }) => {
  await isolate(page); const failures = []; page.on('pageerror', error => failures.push(error.message));
  for (const route of ['/', '/about', '/celulas', '/volunteering', '/events', '/gallery', '/blog', '/conectate', '/prayer', '/donate', '/comprobante', '/login', '/register', '/forgot-password', '/verify-email', '/reset-password', '/payment-success', '/no-existe']) {
    await page.goto(route); await expect(page.locator('main'), route).toBeVisible(); await expect(page.locator('h1'), route).toHaveCount(1);
  }
  expect(failures).toEqual([]);
});
test('collection controls identify a browsable scene and give fast press feedback', async ({ page }) => {
  let many = true;
  await isolate(page, path => path.startsWith('/gallery/') ? { body: [{ ID: 1, title: 'Primer álbum - Foto', url: image }, ...(many ? [{ ID: 2, title: 'Segundo álbum - Foto', url: image }] : [])] } : undefined);
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.goto('/gallery');
  await expect(page.getByText('Colección · Anterior / Siguiente', { exact: true })).toBeVisible();
  const next = page.getByRole('button', { name: /^Siguiente/ });
  await next.hover(); const box = await next.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await expect.poll(() => next.evaluate(el => Number(getComputedStyle(el, '::after').opacity))).toBeGreaterThan(0);
  await page.mouse.up(); await expect(page.getByRole('heading', { name: 'Segundo álbum' })).toBeVisible();
  many = false; await page.reload(); await expect(page.getByRole('heading', { name: 'Primer álbum' })).toBeVisible();
  await expect(page.locator('.collection-navigation')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('main').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
});
