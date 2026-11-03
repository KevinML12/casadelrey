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
    await expect(dialog.getByRole('figure', { name: 'Fotografía ampliada' }).getByRole('img', { name: 'Encuentro nuevo' })).toBeVisible();
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
  const section = page.locator('section[aria-label="Tipos de células"]');
  const background = await section.locator('[data-scene-photo]').boundingBox();
  expect(Math.abs(background.height - (await section.boundingBox()).height)).toBeLessThan(1);
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
  await page.getByLabel('Orden', { exact: true }).fill('7');
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  expect(writes[0].path).toBe('/admin/gallery/42');
  expect(writes[0].data.title).toBe('Álbum editado - Foto');
  expect(writes[0].data.sort_order).toBe(7);
  await page.goto('/admin/settings');
  await page.getByLabel('Nosotros — Misión', { exact: true }).fill('Misión editada');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  expect(writes.at(-1)).toEqual({ path: '/admin/settings/about_mission', data: { value: 'Misión editada' } });
});


test.describe('Oración y lectura editorial', () => {

const photo = '/e2e/editorial/one.webp';
const nextPhoto = '/e2e/editorial/two.webp';
const imageFile = new URL('../public/images/backgrounds/congregacion.webp', import.meta.url).pathname;
const posts = [
  { ID: 71, slug: 'mensaje-administrado', title: 'Un mensaje administrado para caminar juntos como comunidad', category: 'Comunidad', cover_image: photo, excerpt: 'Un resumen editado desde el panel.', content: '<p>Contenido administrado con suficiente extensión para la lectura.</p>', CreatedAt: '2026-10-15T12:00:00Z' },
  { ID: 72, slug: 'otra-ensenanza', title: 'Otra enseñanza publicada', category: 'Enseñanza', cover_image: nextPhoto, content: '<p>Un segundo mensaje publicado por administración.</p>' },
];

async function isolate(page, custom = () => undefined) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/e2e/editorial/')) return route.fulfill({ path: imageFile, contentType: 'image/webp' });
    if (url.pathname.includes('/api/v1')) {
      const path = url.pathname.split('/api/v1')[1];
      const response = await custom(path, route.request());
      const body = response?.body ?? (path === '/blog/' ? posts : path.startsWith('/blog/') ? posts.find(post => path === `/blog/${post.slug}`) : path === '/site-photos' ? { hero_oracion: photo, hero_blog: photo } : path === '/settings' ? {} : []);
      return route.fulfill({ status: response?.status || 200, contentType: 'application/json', body: JSON.stringify(body ?? {}) });
    }
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
    return route.continue();
  });
}

for (const viewport of [{ width: 320, height: 568 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
  test(`prayer keeps one usable form, private draft and retry at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const writes = [];
    await isolate(page, (path, request) => {
      if (path !== '/contact/petition') return;
      writes.push(request.postDataJSON());
      return writes.length === 1 ? { status: 503, body: { error: 'Inténtalo de nuevo en un momento.' } } : { status: 201, body: { id: 51 } };
    });
    await page.goto('/prayer');
    await expect(page.getByRole('heading', { level: 1, name: 'Oración' })).toBeVisible();
    expect(await page.locator('h1').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThan(90);
    await expect(page.locator('main .glass-light')).toHaveCount(1);
    await expect(page.locator('main img')).toHaveAttribute('src', photo);
    await expect(page.getByLabel('Correo electrónico', { exact: true })).toBeHidden();
    await page.getByLabel('Nombre *', { exact: true }).fill('  Visitante de revisión  ');
    await page.getByLabel('Asunto *', { exact: true }).fill('Una petición de la comunidad');
    await page.getByLabel('Petición *', { exact: true }).fill('Una petición privada que debe conservarse si falla el envío.');
    const submit = page.getByRole('button', { name: 'Enviar petición', exact: true });
    await submit.click();
    await expect(page.getByRole('alert')).toHaveText('Inténtalo de nuevo en un momento.');
    await expect(page.getByLabel('Petición *', { exact: true })).toHaveValue('Una petición privada que debe conservarse si falla el envío.');
    await submit.click();
    await expect(page.getByRole('status')).toContainText('Petición recibida.');
    expect(writes[1]).toEqual({ name: 'Visitante de revisión', subject: 'Una petición de la comunidad', message: 'Una petición privada que debe conservarse si falla el envío.', category: '', email: '' });
    await page.getByRole('button', { name: 'Enviar otra petición' }).click();
    await expect(page.getByLabel('Nombre *', { exact: true })).toHaveValue('');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test(`blog gives the real message priority and preserves filters and links at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await isolate(page);
    await page.goto('/blog');
    const scene = page.getByRole('region', { name: 'Mensajes', exact: true });
    await expect(scene.getByRole('heading', { name: posts[0].title })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Blog', exact: true })).toBeVisible();
    await expect(scene.locator('.liquid-glass img')).toHaveCount(0);
    const next = scene.getByRole('button', { name: /^Siguiente/ });
    await next.click();
    await expect(scene.getByRole('heading', { name: posts[1].title })).toBeVisible();
    await expect(next).toBeFocused();
    await page.getByLabel('Categoría', { exact: true }).selectOption('Comunidad');
    await expect(scene.getByRole('heading', { name: posts[0].title })).toBeVisible();
    await expect(scene.getByRole('link', { name: 'Leer mensaje' })).toHaveAttribute('href', `/blog/${posts[0].slug}`);
    await expect(scene.locator('.collection-navigation')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test(`article keeps its complete photograph inside the reader and in the background at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await isolate(page);
    await page.goto(`/blog/${posts[0].slug}`);
    const article = page.getByRole('article');
    await expect(article.getByRole('heading', { level: 1, name: posts[0].title })).toBeVisible();
    await expect(article).toContainText('Contenido administrado');
    const cover = page.getByRole('figure', { name: 'Portada del mensaje' }).getByRole('img');
    await expect(cover).toHaveAttribute('src', photo);
    expect(await cover.evaluate(el => getComputedStyle(el).objectFit)).toBe('contain');
    await expect(page.locator('main > [aria-hidden="true"] img')).toHaveAttribute('src', photo);
    await expect(article.locator('time')).toHaveAttribute('datetime', '2026-10-15T12:00:00.000Z');
    await expect(page.getByRole('button', { name: 'Escuchar', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('an invalid optional email opens and focuses its field without losing the prayer', async ({ page }) => {
  await isolate(page);
  await page.goto('/prayer');
  await page.getByLabel('Nombre *', { exact: true }).fill('Visitante');
  await page.getByLabel('Asunto *', { exact: true }).fill('Asunto privado');
  await page.getByLabel('Petición *', { exact: true }).fill('Contenido privado de la petición.');
  await page.getByText('Datos opcionales', { exact: true }).click();
  await page.getByLabel('Correo electrónico', { exact: true }).fill('correo-incompleto');
  await page.getByText('Datos opcionales', { exact: true }).click();
  await page.getByRole('button', { name: 'Enviar petición', exact: true }).click();
  await expect(page.getByLabel('Correo electrónico', { exact: true })).toBeFocused();
  await expect(page.getByText('Revisa el correo electrónico.', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Petición *', { exact: true })).toHaveValue('Contenido privado de la petición.');
});

test('blog failure, retry and empty do not publish invented messages or dates', async ({ page }) => {
  let failing = true;
  await isolate(page, path => path === '/blog/' ? (failing ? { status: 503, body: {} } : { body: [] }) : undefined);
  await page.goto('/blog');
  await expect(page.getByRole('alert')).toContainText('No pudimos cargar los mensajes.');
  failing = false;
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await expect(page.getByText('Sin mensajes publicados aún.', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Leer mensaje' })).toHaveCount(0);
});

test('an article without cover, date or body keeps the managed background without fabricated metadata', async ({ page }) => {
  await isolate(page, path => path === '/blog/sin-portada' ? { body: { ID: 90, slug: 'sin-portada', title: 'Mensaje sin portada', CreatedAt: 'invalid', redirect_url: null } } : undefined);
  await page.goto('/blog/sin-portada');
  await expect(page.getByRole('article')).toBeVisible();
  await expect(page.locator('main > [aria-hidden="true"] img')).toHaveAttribute('src', photo);
  await expect(page.locator('article time')).toHaveCount(0);
  await expect(page.getByRole('figure')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Escuchar' })).toHaveCount(0);
});

test('audio controls wrap, pause and release playback when leaving the article', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    window.editorialAudio = [];
    window.Audio = class {
      constructor() { this.paused = true; this.duration = 60; this.currentTime = 0; window.editorialAudio.push(this); }
      async play() { this.paused = false; this.onplay?.(); }
      pause() { this.paused = true; this.onpause?.(); }
    };
  });
  await isolate(page, path => path === '/tts' ? { body: { audio: 'AA==', engine: 'fixture' } } : undefined);
  await page.goto(`/blog/${posts[0].slug}`);
  const player = page.getByRole('group', { name: 'Lectura en voz alta' });
  await player.getByRole('button', { name: 'Escuchar', exact: true }).click();
  await expect(player).toContainText('Leyendo el mensaje');
  await player.getByRole('button', { name: 'Pausar', exact: true }).click();
  await expect(player).toContainText('Lectura en pausa');
  await player.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(player).toContainText('Leyendo el mensaje');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', { name: 'Volver al blog', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Blog', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.editorialAudio.every(audio => audio.paused))).toBe(true);
});

test('stopping an audio request prevents late playback and permits retry', async ({ page }) => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let requests = 0;
  await page.addInitScript(() => { window.editorialAudioStarts = 0; window.Audio = class { async play() { window.editorialAudioStarts += 1; } pause() {} }; });
  await isolate(page, async path => {
    if (path !== '/tts') return;
    requests += 1;
    if (requests === 1) await gate;
    return { status: 503, body: { error: 'Audio no disponible' } };
  });
  await page.goto(`/blog/${posts[0].slug}`);
  await page.getByRole('button', { name: 'Escuchar', exact: true }).click();
  await expect.poll(() => requests).toBe(1);
  await page.getByRole('button', { name: 'Detener', exact: true }).click();
  release();
  await expect(page.getByRole('button', { name: 'Escuchar', exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.editorialAudioStarts)).toBe(0);
  await page.getByRole('button', { name: 'Escuchar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reintentar audio', exact: true })).toBeVisible();
});

});
