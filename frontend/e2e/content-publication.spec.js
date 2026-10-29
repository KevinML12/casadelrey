import { test, expect } from '@playwright/test';
const photo = '/images/backgrounds/congregacion.webp';
async function isolate(page, content) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/api/v1')) {
      const path = url.pathname.split('/api/v1')[1];
      const body = content[path] ?? (['/settings', '/site-photos'].includes(path) ? {} : path === '/hero/active' ? null : []);
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    }
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
    return route.continue();
  });
}
test('empty Home uses actual collection state without publishing local categories', async ({ page }) => {
  await isolate(page, {}); await page.goto('/');
  await expect(page.locator('#celulas')).toContainText('Sin categorías publicadas aún.');
  for (const name of ['Adolescentes', 'Jóvenes Adultos', 'Prejuveniles', 'Varones', 'Mujeres']) {
    await expect(page.locator('#celulas').getByText(name, { exact: true })).toHaveCount(0);
  }
});
for (const width of [320, 768, 1440]) {
  test(`admin content uses photographic scenes and a single glass panel at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await isolate(page, {
      '/cell-categories': [1, 2].map(ID => ({ ID, name: `Grupo administrado ${ID}`, description: 'Comunidad publicada por el administrador.', image_url: photo, is_active: true })),
      '/blog/': [{ ID: 10, title: 'Mensaje administrado', slug: 'mensaje-administrado', cover_image: photo }],
      '/social/feed': [{ ID: 20, platform: 'instagram', caption: 'Encuentro de la comunidad', image_url: photo, post_url: 'https://www.instagram.com/ig.casadelrey/', is_active: true }],
    });
    await page.goto('/');
    const cells = page.getByRole('region', { name: 'Células de la comunidad', exact: true });
    await expect(cells.getByRole('heading', { name: 'Grupo administrado 1' })).toBeVisible();
    await expect(cells.locator('.liquid-glass img')).toHaveCount(0);
    await cells.getByRole('button', { name: /^Siguiente/ }).click();
    await expect(cells.getByRole('heading', { name: 'Grupo administrado 2' })).toBeVisible();
    await expect(cells.getByRole('link', { name: 'Conocer las células' })).toHaveAttribute('href', '/celulas?tipo=Grupo%20administrado%202');
    const messages = page.getByRole('region', { name: 'Mensajes de la comunidad', exact: true });
    await expect(messages.getByRole('link', { name: 'Leer mensaje' })).toHaveAttribute('href', '/blog/mensaje-administrado');
    const social = page.getByRole('region', { name: 'Publicaciones de la comunidad', exact: true });
    await expect(social.getByText('Encuentro de la comunidad')).toBeVisible();
    await expect(social.getByRole('link', { name: 'Ver publicación' })).toHaveAttribute('href', 'https://www.instagram.com/ig.casadelrey/');
    await expect(social.locator('.liquid-glass img')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('historical cell types and their assigned leader remain editable', async ({ page }) => {
  const writes = [];
  const token = ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({ user_id: 99, name: 'Admin', role: 'admin', exp: 2000000000 })).toString('base64url'), 'fixture'].join('.');
  await page.addInitScript(value => localStorage.setItem('token', value), token);
  await isolate(page, {});
  await page.route('**/api/v1/admin/cells**', route => {
    if (route.request().method() === 'PUT') {
      writes.push(route.request().postDataJSON());
      return route.fulfill({ contentType: 'application/json', body: '{}' });
    }
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify([{ ID: 42, code: 'V1', name: 'Grupo existente', type: 'adolescentes', leader_id: 21, leader: { ID: 21, name: 'Líder asignado' }, is_active: true }]) });
  });
  await page.goto('/admin/cells');
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await expect(page.getByLabel('Tipo *', { exact: true })).toHaveValue('adolescentes');
  await expect(page.getByLabel('Líder *', { exact: true })).toHaveValue('21');
  await page.getByLabel('Nombre *', { exact: true }).fill('Grupo actualizado');
  await page.getByRole('button', { name: 'Actualizar', exact: true }).click();
  expect(writes[0]).toMatchObject({ code: 'V1', type: 'adolescentes', leader_id: 21, name: 'Grupo actualizado' });
});

test('Home agenda uses upcoming administered records in a photographic scene', async ({ page }) => {
  await isolate(page, { '/events/': [
    { ID: 21, title: 'Próxima reunión', date: '2099-11-01', cover_image: photo, is_active: true },
    { ID: 22, title: 'Reunión pasada', date: '2000-11-01', cover_image: photo, is_active: true },
    { ID: 23, title: 'Reunión oculta', date: '2099-11-01', cover_image: photo, is_active: false },
  ] });
  await page.goto('/');
  const agenda = page.getByRole('region', { name: 'Agenda de la comunidad', exact: true });
  await expect(agenda.getByRole('heading', { name: 'Próxima reunión', exact: true })).toBeVisible();
  await expect(agenda.getByRole('link', { name: 'Ver evento' })).toHaveAttribute('href', '/events?id=21');
  await expect(agenda.getByText('Reunión pasada')).toHaveCount(0);
  await expect(agenda.getByText('Reunión oculta')).toHaveCount(0);
  await expect(agenda.locator('.liquid-glass img')).toHaveCount(0);
});

test('an album link opens the chosen administrator album after all pages load', async ({ page }) => {
  await isolate(page, { '/gallery/': { data: [
    { ID: 1, title: 'Primer álbum - Foto', url: photo },
    { ID: 2, title: 'Álbum elegido - Foto', url: photo },
  ], meta: { pages: 1 } } });
  await page.goto('/gallery?album=%C3%81lbum%20elegido');
  await expect(page.getByRole('dialog', { name: 'Álbum elegido', exact: true })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Cerrar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
