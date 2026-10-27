import { test, expect } from '@playwright/test';
const image = '/images/backgrounds/congregacion.webp';
async function isolate(page, custom = () => undefined) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/api/v1')) {
      const path = url.pathname.split('/api/v1')[1];
      const response = await custom(path, route.request(), url);
      const body = response?.body ?? (['/settings', '/site-photos'].includes(path) ? {} : path === '/hero/active' ? null : []);
      return route.fulfill({ status: response?.status || 200, contentType: 'application/json', body: JSON.stringify(body) });
    }
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
    return route.continue();
  });
}
for (const width of [390, 1440]) {
  test(`gallery discovers all pages, one glass panel and compact photo controls at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const requests = [];
    await isolate(page, (path, req, url) => {
      if (!path.startsWith('/gallery/')) return;
      const next = Number(url.searchParams.get('page')); requests.push(next);
      return { body: { data: next === 1 ? Array.from({ length: 5 }, (_, i) => ({ ID: i + 1, title: `Encuentro nuevo - Foto ${i}`, url: image })) : [{ ID: 20, title: 'Álbum agregado - Foto', url: image }], meta: { pages: 2 } } };
    });
    await page.goto('/gallery');
    const scene = page.getByRole('region', { name: 'Álbumes', exact: true });
    await expect(scene.getByRole('heading', { name: 'Encuentro nuevo' })).toBeVisible();
    expect([...new Set(requests)]).toEqual([1, 2]);
    await expect(scene.locator('.liquid-glass img')).toHaveCount(0);
    await scene.getByRole('button', { name: /^Siguiente/ }).click();
    await expect(scene.getByRole('heading', { name: 'Álbum agregado' })).toBeVisible();
    await scene.getByRole('button', { name: /^Anterior/ }).click();
    await expect(scene.getByRole('heading', { name: 'Encuentro nuevo' })).toBeVisible();
    await scene.getByRole('button', { name: /^Encuentro nuevo/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('tab', { name: 'Galería' })).toHaveAttribute('aria-selected', 'true');
    await dialog.getByRole('tab', { name: 'Fotos', exact: true }).click();
    await expect(dialog.getByRole('button', { name: /^Foto \d/ })).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Foto siguiente' }).click();
    await expect(dialog.getByRole('status').first()).toHaveText('2 de 5');
    await expect(dialog.locator('.glass-light img')).toHaveCount(0);
    await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
test('empty API does not resurrect local departments, albums or fixed totals', async ({ page }) => {
  await isolate(page);
  await page.goto('/volunteering');
  await expect(page.getByText('Sin departamentos publicados aún.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Alabanza', exact: true })).toHaveCount(0);
  await page.goto('/about'); await expect(page.getByText('Sin categorías publicadas aún.')).toBeVisible();
  await expect(page.getByText('~90', { exact: true })).toHaveCount(0);
  await page.goto('/gallery'); await expect(page.getByText('Sin fotos publicadas aún.')).toBeVisible();
});
test('admin institutional copy and a newly created cell flow stay accessible', async ({ page }) => {
  await isolate(page, path => {
    if (path === '/settings') return { body: { about_title: 'Título editado', about_intro: 'Presentación administrada', about_mission: 'Misión administrada' } };
    if (path === '/cell-categories') return { body: [{ ID: 81, name: 'Comunidad nueva', description: 'Descripción administrada', image_url: image, type_key: 'nuevo', is_active: true }] };
    if (path === '/cells') return { body: [{ ID: 91, name: 'Célula nueva', type: 'nuevo', leader: 'Líder de prueba', zone: 'Zona 2' }] };
  });
  await page.goto('/about'); await expect(page.getByRole('heading', { name: 'Título editado', exact: true })).toBeVisible();
  await expect(page.getByText('Misión administrada')).toBeVisible();
  await page.goto('/celulas');
  await page.getByRole('region', { name: 'Tipos de células', exact: true }).getByRole('button', { name: /^Comunidad nueva/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('tab', { name: 'Información', exact: true }).click();
  await expect(dialog.getByText('Descripción administrada')).toBeVisible();
  await dialog.getByRole('button', { name: 'Ver la célula Célula nueva' }).click();
  await expect(dialog.getByRole('heading', { name: 'Célula nueva' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Quiero unirme a Célula nueva' }).click();
  await expect(page.getByRole('dialog').last().getByRole('textbox').first()).toBeVisible();
});
test('blog filters use real categories and an event deep link still opens registration', async ({ page }) => {
  await isolate(page, path => {
    if (path === '/blog/') return { body: [{ ID: 1, title: 'Mensaje nuevo', slug: 'nuevo', category: 'Nueva categoría', cover_image: image }, { ID: 2, title: 'Otro mensaje', slug: 'otro', category: 'Otra categoría', cover_image: image }] };
    if (path === '/events/') return { body: [{ ID: 1, title: 'Evento uno', date: '2099-11-01', is_active: true }, { ID: 2, title: 'Evento elegido', date: '2099-11-02', is_active: true, requires_payment: false }] };
  });
  await page.goto('/blog'); await page.getByLabel('Categoría', { exact: true }).selectOption('Otra categoría');
  const scene = page.getByRole('region', { name: 'Mensajes', exact: true });
  await expect(scene.getByRole('heading', { name: 'Otro mensaje' })).toBeVisible();
  await expect(scene.getByRole('link', { name: 'Leer mensaje' })).toHaveAttribute('href', '/blog/otro');
  await page.goto('/events?id=2'); await expect(page.getByRole('heading', { name: 'Evento elegido' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('textbox').first()).toBeVisible();
});
test('normal motion keeps glass fixed and focus on navigation when scenes share a photo', async ({ page }) => {
  await isolate(page, path => path === '/cell-categories' ? { body: [{ ID: 1, name: 'Primer grupo', image_url: image }, { ID: 2, name: 'Segundo grupo', image_url: image }] } : undefined);
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.goto('/celulas');
  const scene = page.getByRole('region', { name: 'Tipos de células', exact: true });
  const card = scene.locator('.liquid-glass');
  const next = scene.getByRole('button', { name: /^Siguiente/ }); await next.scrollIntoViewIfNeeded();
  const before = await card.boundingBox(); await next.click();
  await expect(scene.getByRole('heading', { name: 'Segundo grupo' })).toBeVisible();
  const after = await card.boundingBox();
  expect(after.x).toBe(before.x); expect(after.y).toBe(before.y); expect(after.height).toBe(before.height);
  await expect(next).toBeFocused(); expect(await card.evaluate(el => getComputedStyle(el).transform)).toBe('none');
});

test('administrator can edit an existing gallery record and institutional settings', async ({ page }) => {
  const writes = [];
  const photo = { ID: 42, title: 'Álbum original - Foto', url: image, description: 'Original', sort_order: 0, is_active: true };
  await isolate(page, (path, request) => {
    if (request.method() === 'PUT') { writes.push({ path, data: request.postDataJSON() }); return { body: { ...request.postDataJSON(), ID: 42 } }; }
    if (path === '/admin/gallery/') return { body: { data: [photo], meta: { total: 1, page: 1, pages: 1 } } };
    if (path === '/admin/settings') return { body: [{ key: 'about_mission', label: 'Nosotros — Misión', value: 'Anterior', using_default: false }] };
  });
  const token = ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({ user_id: 999, name: 'Synthetic admin', role: 'admin', exp: 2000000000 })).toString('base64url'), 'fixture'].join('.');
  await page.addInitScript(value => localStorage.setItem('token', value), token);
  await page.goto('/admin/gallery');
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await page.getByLabel('Título', { exact: true }).fill('Álbum editado - Foto');
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  expect(writes[0].path).toBe('/admin/gallery/42');
  expect(writes[0].data.title).toBe('Álbum editado - Foto');
  await page.goto('/admin/settings');
  await page.getByLabel('Nosotros — Misión', { exact: true }).fill('Misión editada');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  expect(writes.at(-1)).toEqual({ path: '/admin/settings/about_mission', data: { value: 'Misión editada' } });
});
