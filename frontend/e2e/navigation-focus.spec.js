import { test, expect } from '@playwright/test';

async function isolate(page) {
  const warnings = [];
  const session = await page.context().newCDPSession(page);
  await session.send('Log.enable');
  session.on('Log.entryAdded', ({ entry }) => {
    if (/aria-hidden|retained focus/i.test(entry.text)) warnings.push(entry.text);
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/api/v1')) {
      const path = url.pathname.split('/api/v1')[1];
      const body = ['/settings', '/site-photos'].includes(path) ? {} : path === '/hero/active' ? null : [];
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    }
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
    return route.continue();
  });
  return warnings;
}

for (const width of [320, 768, 1024]) {
  test(`all mobile navigation links release focus before hiding at ${width}px`, async ({ page }) => {
    const warnings = await isolate(page);
    await page.setViewportSize({ width, height: 1024 });
    await page.goto('/volunteering');
    const menu = page.getByRole('button', { name: 'Menú', exact: true });
    const sheet = page.locator('#mobile-menu');
    for (const label of ['Galería', 'Nosotros', 'Células', 'Voluntariado', 'Eventos', 'Blog', 'Inicio', 'Ingresar', 'Dar', 'Conéctate']) {
      await menu.click();
      await sheet.getByRole('link', { name: label, exact: true }).click();
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
      await expect(menu).toBeFocused();
      expect(await sheet.evaluate(el => el.contains(document.activeElement))).toBe(false);
      expect(await sheet.evaluate(el => el.inert)).toBe(true);
      expect(await page.locator('body').evaluate(el => el.style.overflow)).not.toBe('hidden');
    }
    expect(warnings).toEqual([]);
  });
}

test('closing by Escape, outside pointer and desktop resize keeps focus visible', async ({ page }) => {
  const warnings = await isolate(page);
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/gallery');
  const menu = page.getByRole('button', { name: 'Menú', exact: true });
  const link = page.locator('#mobile-menu').getByRole('link', { name: 'Voluntariado', exact: true });
  await menu.click(); await link.focus(); await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await menu.click(); await link.focus(); await page.mouse.click(4, 900);
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  expect(await page.locator('#mobile-menu').evaluate(el => el.contains(document.activeElement))).toBe(false);
  await menu.click(); await link.focus(); await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('button[aria-controls="mobile-menu"]')).toHaveAttribute('aria-expanded', 'false');
  const focused = page.locator(':focus');
  await expect(focused).toBeVisible();
  expect(await focused.evaluate(el => el.closest('#mobile-menu') !== null)).toBe(false);
  expect(await focused.evaluate(el => el.tagName)).toBe('A');
  expect(warnings).toEqual([]);
});
