import { test, expect } from '@playwright/test';

async function isolate(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/api/v1')) {
      const path = url.pathname.split('/api/v1')[1];
      const body = ['/settings', '/site-photos'].includes(path) ? {} : ['/hero/active', '/volunteer/me'].includes(path) ? null : [];
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    }
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
    return route.continue();
  });
}

for (const width of [390, 1440]) {
  test(`public pages keep the shared glass system at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await isolate(page);
    for (const path of ['/', '/about', '/celulas', '/events', '/donate', '/volunteering', '/gallery', '/blog', '/prayer', '/conectate', '/login', '/register']) {
      await page.goto(path);
      await expect(page.locator('h1, h2').first()).toBeVisible();
      await expect(page.getByText('Unexpected Application Error!', { exact: true })).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), path).toBe(false);
      if (['/', '/about', '/donate'].includes(path)) await page.screenshot({ path: `../docs/release-2026-10-26/${width}-${path.slice(1) || 'home'}.png` });
    }
  });
}

test('dark glass stays almost transparent without pointer-follow reflections', async ({ page }) => {
  await isolate(page);
  await page.goto('/');
  const card = page.locator('.liquid-glass').first();
  await expect(card).toBeVisible();
  const material = await card.evaluate(el => ({ background: getComputedStyle(el).backgroundImage, after: getComputedStyle(el, '::after').content }));
  expect(material.background).toContain('0.05');
  expect(material.after).toBe('none');
  await card.hover();
  expect(await card.evaluate(el => getComputedStyle(el).backgroundImage)).toBe(material.background);
  expect(await card.getAttribute('style') || '').not.toContain('--spec-');
});

test('an HTML response from an API rewrite is rejected before rendering a feed', async ({ page }) => {
  await isolate(page);
  await page.route('**/api/v1/fixture/html', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body>SPA fallback</body></html>' }));
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { default: api } = await import('/src/lib/apiClient.js');
    try { await api.get('/fixture/html'); return 'accepted'; }
    catch (err) { return err.message; }
  });
  expect(result).toBe('La API devolvió una respuesta inválida.');
});
