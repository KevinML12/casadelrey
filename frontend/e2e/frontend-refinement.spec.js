import { test, expect } from '@playwright/test';

async function isolate(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/api/v1')) {
      const path = url.pathname.split('/api/v1')[1];
      const body = ['/settings', '/site-photos'].includes(path) ? {} : path === '/hero/active' ? null : [];
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
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveAttribute('aria-label', 'Danza');
  await page.getByRole('button', { name: 'Anterior', exact: true }).click();
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
  await expect(heroPhoto).toHaveAttribute('srcset', /640.webp.*1600.webp/);
  expect(await heroPhoto.evaluate(el => el.currentSrc)).toContain('/optimized/');
  const valid = await heroPhoto.evaluate(el => el.complete && el.naturalWidth > 0);
  expect(valid).toBe(true);
});
