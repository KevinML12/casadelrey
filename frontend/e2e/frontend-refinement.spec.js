import { test, expect } from '@playwright/test';
import { volunteerAreas } from './fixtures/published-content.js';

async function isolate(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/api/v1')) {
      const path = url.pathname.split('/api/v1')[1];
      const body = ['/settings', '/site-photos'].includes(path) ? {} : path === '/volunteer-areas' ? volunteerAreas : path === '/hero/active' ? null : [];
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    }
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
    return route.continue();
  });
}

for (const width of [320, 768, 1024]) {
  test(`main layouts fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await isolate(page);
    for (const path of ['/about', '/conectate', '/donate', '/volunteering', '/events', '/gallery', '/blog']) {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true);
      if (path === '/conectate') await page.screenshot({ path: `../docs/release-2026-10-26/${width}-connect-refined.png`, fullPage: true });
    }
  });
}

test('mobile navigation closes with Escape and removes hidden links from focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await isolate(page);
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'Menú', exact: true });
  const sheet = page.locator('#mobile-menu');
  expect(await sheet.evaluate(el => el.inert)).toBe(true);
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(sheet.getByRole('link', { name: 'Galería', exact: true })).toBeVisible();
  expect(await page.locator('body').evaluate(el => el.style.overflow)).toBe('hidden');
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  expect(await sheet.evaluate(el => el.inert)).toBe(true);
  expect(await page.locator('body').evaluate(el => el.style.overflow)).not.toBe('hidden');
  await menu.click();
  await sheet.getByRole('link', { name: 'Galería', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Galería', exact: true })).toBeVisible();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
});

test('flat glass windows sit above navigation and restore focus', async ({ page }) => {
  await isolate(page);
  await page.goto('/about');
  const trigger = page.getByRole('button', { name: /^Alabanza/ });
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('#root [role="dialog"]')).toHaveCount(0);
  expect(await page.locator('#root').evaluate(el => el.inert)).toBe(true);
  await page.getByRole('dialog').getByRole('button', { name: /^Siguiente/ }).click();
  await expect(page.getByRole('dialog')).toHaveAttribute('aria-label', 'Danza');
  await page.getByRole('dialog').getByRole('button', { name: /^Anterior/ }).click();
  await expect(page.getByRole('dialog')).toHaveAttribute('aria-label', 'Alabanza');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.locator('#root').evaluate(el => el.inert)).toBe(false);
  await expect(trigger).toBeFocused();
});

test('public surfaces keep the real logo without decorative icons or 3D', async ({ page }) => {
  await isolate(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const path of ['/', '/about', '/celulas', '/volunteering', '/events', '/gallery', '/blog', '/conectate']) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('canvas, model-viewer, spline-viewer, svg')).toHaveCount(0);
    await expect(page.locator('header img')).toHaveAttribute('src', '/logo.png');
    const perspective = await page.locator('main *').evaluateAll(nodes => nodes.some(el => {
      const style = getComputedStyle(el);
      return style.perspective !== 'none' || style.transformStyle === 'preserve-3d' || style.transform.startsWith('matrix3d');
    }));
    expect(perspective, path).toBe(false);
    expect(await page.locator('body').innerText()).not.toMatch(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]/u);
  }
});

test('events keeps its hero visible while loading and can retry a failed feed', async ({ page }) => {
  await isolate(page);
  let release;
  let recovered = false;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/api/v1/events/**', async route => {
    await gate;
    await route.fulfill({ status: recovered ? 200 : 503, contentType: 'application/json', body: recovered ? '[]' : '{"error":"unavailable"}' });
  });
  await page.goto('/events');
  await expect(page.getByRole('heading', { name: 'Eventos', exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Cargando los eventos');
  release();
  await expect(page.getByRole('alert')).toContainText('No pudimos cargar');
  recovered = true;
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByText('Sin eventos publicados aún.', { exact: true })).toBeVisible();
});

test('first photo is prioritized and local photos use responsive WebP', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await isolate(page);
  await page.goto('/about');
  const heroPhoto = page.locator('.page-hero img');
  await expect(heroPhoto).toHaveAttribute('loading', 'eager');
  await expect(heroPhoto).toHaveAttribute('fetchpriority', 'high');
  await expect(heroPhoto).toHaveAttribute('srcset', /\.webp 640w, .*\.webp 1600w/);
  expect(await heroPhoto.evaluate(el => el.currentSrc)).toMatch(/\.webp$/);
  const valid = await heroPhoto.evaluate(el => el.complete && el.naturalWidth > 0);
  expect(valid).toBe(true);
});

for (const width of [390, 1440]) {
  test(`volunteer detail preserves administered content and background photos at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await isolate(page);
    await page.route('**/api/v1/volunteer-areas', route => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([{ value: 'equipo_nuevo', title: 'Equipo administrado', description: 'Descripción publicada desde el panel.', why: 'Motivo actualizado por el administrador.' }]),
    }));
    await page.route('**/api/v1/site-photos', route => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ voluntariado_seccion: '/images/components/voluntariado_general.jpg', voluntariado_equipo_nuevo: '/images/components/vol_intercesor.jpg', voluntariado_equipo_nuevo_2: '/images/components/vol_alabanza.jpg' }),
    }));
    await page.goto('/volunteering');
    const trigger = page.getByRole('button', { name: /^Equipo administrado/ });
    await expect(trigger.locator('img')).toHaveCount(0);
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Equipo administrado' });
    await expect(dialog.getByRole('tab', { name: 'Galería', exact: true })).toHaveAttribute('aria-selected', 'true');
    await dialog.getByRole('button', { name: 'Equipo administrado Ver fotos', exact: true }).click();
    await expect(dialog.getByRole('tab', { name: 'Fotos', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(dialog.getByRole('heading', { name: 'Equipo administrado', exact: true })).toBeVisible();
    await expect(dialog.locator('.glass-light img, .glass-light .glass-light-nested')).toHaveCount(0);
    const photo = dialog.locator('img').last();
    await expect(photo).toHaveAttribute('src', /vol_intercesor/);
    await dialog.getByRole('button', { name: 'Foto 2', exact: true }).click();
    await expect(photo).toHaveAttribute('src', /vol_alabanza/);
    await expect(dialog.getByRole('button', { name: 'Foto 2', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await dialog.getByRole('tab', { name: 'Información', exact: true }).click();
    await expect(dialog.getByText('Motivo actualizado por el administrador.')).toBeVisible();
    await dialog.getByRole('button', { name: 'Aplicar a Equipo administrado', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Continuar', exact: true })).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Formulario', exact: true }).getByRole('heading', { name: 'Equipo administrado', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await page.locator('#root').evaluate(el => el.inert)).toBe(false);
  });
}

test('the quiz opens the chosen department information in the same slider', async ({ page }) => {
  await isolate(page);
  await page.goto('/volunteering');
  await page.getByRole('button', { name: 'Dos preguntas y te decimos dónde', exact: true }).click();
  const quiz = page.getByRole('dialog', { name: 'Formulario', exact: true });
  await quiz.getByRole('button', { name: 'Me encanta la música y el arte', exact: true }).click();
  await quiz.getByRole('button', { name: 'Al frente, visible', exact: true }).click();
  await quiz.getByRole('button', { name: 'Ver detalle', exact: true }).first().click();
  await expect(quiz).toHaveCount(0);
  const detail = page.getByRole('dialog', { name: 'Alabanza', exact: true });
  await expect(detail).toBeVisible();
  await expect(detail.getByRole('tab', { name: 'Información', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(detail.getByRole('heading', { name: 'Alabanza', exact: true })).toBeVisible();
  expect(await page.locator('#root').evaluate(el => el.inert)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(detail).toHaveCount(0);
  expect(await page.locator('#root').evaluate(el => el.inert)).toBe(false);
});

for (const width of [390, 1440]) {
  test(`every department has a successive scene with one glass card at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await isolate(page);
    await page.goto('/volunteering');
    const carousel = page.getByRole('region', { name: 'Departamentos de voluntariado', exact: true });
    const trigger = carousel.getByRole('button', { name: /Explorar departamento$/ });
    const nav = carousel.getByRole('navigation', { name: 'Navegar departamentos' });
    const photo = page.locator('section[aria-labelledby="volunteer-departments"] [data-scene-photo]');
    const titles = ['Alabanza', 'Danza', 'Servidores', 'Protocolo', 'Pancartas', 'Maestros de Niños', 'Técnicos Audiovisuales', 'Multimedia', 'Oración', 'Logística'];
    const scenes = new Set();
    for (const title of titles) {
      await expect(carousel.getByRole('heading', { name: title, exact: true })).toBeVisible();
      await expect(trigger).toHaveCount(1);
      await expect(trigger.locator('img')).toHaveCount(0);
      scenes.add(await photo.getAttribute('data-scene-photo'));
      await nav.getByRole('button', { name: /^Siguiente/ }).click();
    }
    expect(scenes.size).toBe(10);
    await expect(carousel.getByRole('heading', { name: 'Alabanza', exact: true })).toBeVisible();
    await nav.getByRole('button', { name: /^Anterior/ }).click();
    await expect(carousel.getByRole('heading', { name: 'Logística', exact: true })).toBeVisible();
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toHaveCount(1);
    const pane = dialog.locator('.glass-light');
    const before = await pane.boundingBox();
    await expect(dialog.getByRole('button', { name: /^Siguiente/ })).toContainText('Alabanza');
    await dialog.getByRole('button', { name: /^Siguiente/ }).click();
    await expect(dialog).toHaveAttribute('aria-label', 'Alabanza');
    const after = await pane.boundingBox();
    expect(Math.abs(after.x - before.x)).toBeLessThan(1);
    expect(Math.abs(after.y - before.y)).toBeLessThan(1);
    expect(Math.abs(after.height - before.height)).toBeLessThan(1);
    const gallery = dialog.getByRole('tab', { name: 'Galería', exact: true });
    await gallery.focus();
    await page.keyboard.press('ArrowRight');
    await expect(dialog.getByRole('tab', { name: 'Fotos', exact: true })).toBeFocused();
    await expect(dialog).toHaveAttribute('aria-label', 'Alabanza');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('a failed managed background falls back to the matching department scene', async ({ page }) => {
  await isolate(page);
  await page.route('**/api/v1/site-photos', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ voluntariado_alabanza: '/fixture/missing-background.jpg' }) }));
  await page.route('**/fixture/missing-background.jpg', route => route.fulfill({ status: 404, body: '' }));
  await page.goto('/volunteering');
  const background = page.locator('section[aria-labelledby="volunteer-departments"] [data-scene-photo]');
  await expect(background).toHaveAttribute('data-scene-photo', '/images/backgrounds/vol-alabanza.webp');
  await expect(background.locator('img').last()).toBeVisible();
  expect(await background.locator('img').last().evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
});
