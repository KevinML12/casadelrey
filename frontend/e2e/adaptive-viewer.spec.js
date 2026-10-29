import { test, expect } from '@playwright/test';
import { volunteerAreas } from './fixtures/published-content';
const photo = '/images/backgrounds/congregacion.webp';
const second = '/images/backgrounds/comunidad-templo.webp';
const settings = { about_founders_names: 'Fundadores administrados', about_founders_description: 'Historia guardada por el administrador.', about_pastors_names: 'Pastores administrados', about_pastors_description: 'Equipo pastoral actual.', about_address: 'Dirección administrada', about_map_url: 'https://maps.google.com/?q=iglesia', about_podcast_title: 'Podcast administrado', about_podcast_schedule: 'Horario administrado', about_podcast_url: 'https://example.com/escuchar' };
async function isolate(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/api/v1')) {
      const path = url.pathname.split('/api/v1')[1];
      let body = [];
      if (path === '/settings') body = settings;
      if (path === '/site-photos') body = { about_pastores: second, voluntariado_logistica: photo, voluntariado_logistica_2: second };
      if (path === '/volunteer-areas') body = volunteerAreas;
      if (path === '/hero/active') body = null;
      if (path.startsWith('/gallery/')) body = { data: [{ ID: 1, title: 'Comunidad - Encuentro', url: photo }, { ID: 2, title: 'Comunidad - Celebración', url: second }], meta: { pages: 1 } };
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    }
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
    return route.continue();
  });
}
for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 1440, height: 1000 }, { width: 844, height: 390 }]) {
  test(`viewer keeps the complete photograph, backdrop and controls accessible at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport); await isolate(page); await page.goto('/gallery');
    const trigger = page.getByRole('region', { name: 'Álbumes', exact: true }).getByRole('button', { name: /^Comunidad/ });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Comunidad', exact: true });
    const figure = dialog.getByRole('figure', { name: 'Fotografía ampliada' });
    const image = figure.getByRole('img', { name: 'Comunidad', exact: true });
    await expect(image).toBeVisible();
    await expect(image).toHaveCSS('object-fit', 'contain');
    await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    const pane = dialog.locator('[data-photo-window]'); const box = await pane.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width); expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    const next = figure.getByRole('button', { name: 'Foto siguiente', exact: true });
    await next.click();
    await expect(figure.locator('[data-scene-photo]')).toHaveAttribute('data-scene-photo', second);
    await expect(dialog.locator(':scope > div').first().locator('[data-scene-photo]')).toHaveAttribute('data-scene-photo', second);
    await next.focus(); await page.keyboard.press('ArrowLeft');
    await expect(figure.locator('[data-scene-photo]')).toHaveAttribute('data-scene-photo', photo);
    await dialog.getByRole('tab', { name: 'Información', exact: true }).click();
    await expect(figure.locator('[data-scene-photo]')).toHaveAttribute('data-scene-photo', photo);
    expect(await pane.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
    await expect(dialog).toHaveCount(0); await expect(trigger).toBeFocused();
  });
}
test('departments support direct selection, high quality detail and the existing application flow', async ({ page }) => {
  await isolate(page); await page.goto('/volunteering');
  await page.getByLabel('Elegir departamento', { exact: true }).selectOption('logistica');
  const region = page.getByRole('region', { name: 'Departamentos de voluntariado', exact: true });
  await expect(region.getByRole('heading', { name: 'Logística', exact: true })).toBeVisible();
  await region.getByRole('button', { name: /Explorar departamento$/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('figure').getByRole('img', { name: 'Logística' })).toBeVisible();
  await dialog.getByRole('tab', { name: 'Información', exact: true }).click();
  await dialog.getByRole('button', { name: 'Aplicar a Logística', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Formulario', exact: true }).getByRole('heading', { name: 'Logística', exact: true })).toBeVisible();
});
test('pastors retain their original portraits and administrator replacements, visit and podcast stay interactive', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await isolate(page); await page.goto('/about');
  const history = page.getByRole('region', { name: 'Nuestra iglesia', exact: true });
  await expect(history.getByRole('img', { name: 'Fundadores administrados', exact: true })).toHaveAttribute('src', /fundadores/);
  await history.getByRole('button', { name: /^Siguiente/ }).click();
  await expect(history.getByRole('img', { name: 'Pastores administrados', exact: true })).toHaveAttribute('src', /comunidad-templo/);
  const visit = page.getByRole('region', { name: 'Visítanos y escucha', exact: true });
  await expect(visit.getByRole('link', { name: 'Cómo llegar', exact: true })).toHaveAttribute('href', settings.about_map_url);
  await visit.getByRole('button', { name: 'Copiar dirección', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(settings.about_address);
  await visit.getByRole('tab', { name: 'Podcast', exact: true }).click();
  await expect(visit.getByRole('heading', { name: 'Podcast administrado', exact: true })).toBeVisible();
  await expect(visit.getByRole('link', { name: 'Escuchar podcast', exact: true })).toHaveAttribute('href', settings.about_podcast_url);
  await expect(visit.locator('[data-layered-panel]')).toHaveCSS('transform', 'none');
});
test('foreground overlap follows a fine pointer and scroll without tilting or scaling', async ({ page }) => {
  await isolate(page); await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.goto('/about');
  const panel = page.getByRole('region', { name: 'Nuestra iglesia', exact: true }).locator('[data-layered-panel]');
  await panel.scrollIntoViewIfNeeded();
  const before = await panel.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m42);
  const bounds = await panel.boundingBox(); await page.mouse.move(bounds.x + bounds.width * 0.9, bounds.y + bounds.height * 0.7);
  await expect.poll(() => panel.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41)).toBeGreaterThan(1);
  await page.mouse.move(0, 0); await page.mouse.wheel(0, 180);
  await expect.poll(() => panel.evaluate((el, previous) => Math.abs(new DOMMatrix(getComputedStyle(el).transform).m42 - previous), before)).toBeGreaterThan(0.1);
  const matrix = await panel.evaluate(el => { const m = new DOMMatrix(getComputedStyle(el).transform); return { a:m.a, b:m.b, c:m.c, d:m.d, is2D:m.is2D }; });
  expect(matrix).toEqual({ a:1, b:0, c:0, d:1, is2D:true });
});
