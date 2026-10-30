import { test, expect } from '@playwright/test';

async function isolate(page, custom) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/api/v1')) {
      const result = await custom(url.pathname.split('/api/v1')[1], route.request());
      return route.fulfill({ status: result?.status || 200, contentType: 'application/json', body: JSON.stringify(result?.body ?? (url.pathname.endsWith('/settings') || url.pathname.endsWith('/site-photos') ? {} : [])) });
    }
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
    return route.continue();
  });
}

test('updated rich text editor preserves formatting, preview and administrator save', async ({ page }) => {
  const writes = [];
  await isolate(page, (path, request) => {
    if (path === '/admin/blog/' && request.method() === 'POST') { writes.push(request.postDataJSON()); return { status: 201, body: { ID: 500, ...request.postDataJSON() } }; }
  });
  const token = ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({ user_id: 999, name: 'Synthetic editor', role: 'admin', exp: 2000000000 })).toString('base64url'), 'fixture'].join('.');
  await page.addInitScript(value => localStorage.setItem('token', value), token);
  await page.goto('/admin/blog');
  await page.getByRole('button', { name: 'Nuevo post', exact: true }).click();
  await page.getByLabel('Título *', { exact: true }).fill('Mensaje de la comunidad');
  const editor = page.locator('[contenteditable="true"]');
  await editor.fill('Texto que conserva el formato.');
  await editor.press('ControlOrMeta+a');
  await page.getByRole('button', { name: 'Negrita', exact: true }).click();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.locator('.prose strong')).toHaveText('Texto que conserva el formato.');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0].content).toContain('<strong>Texto que conserva el formato.</strong>');
  expect(writes[0].slug).toBe('mensaje-de-la-comunidad');
});

test('updated sanitizer renders the article without executable attributes or scripts', async ({ page }) => {
  await page.addInitScript(() => { window.articleSafetyCheck = 0; });
  await isolate(page, path => path === '/blog/mensaje-seguro' ? { body: { ID: 1, title: 'Mensaje seguro', content: '<p>Contenido administrado.</p><img src="/missing-photo" onerror="window.articleSafetyCheck=1"><a href="javascript:window.articleSafetyCheck=2">Enlace</a><script>window.articleSafetyCheck=3</script>' } } : undefined);
  await page.goto('/blog/mensaje-seguro');
  await expect(page.getByRole('heading', { name: 'Mensaje seguro', exact: true })).toBeVisible();
  const article = page.locator('.prose-light');
  await expect(article).toContainText('Contenido administrado.');
  await expect(article.locator('[onerror],script,a[href^="javascript:"]')).toHaveCount(0);
  expect(await page.evaluate(() => window.articleSafetyCheck)).toBe(0);
});
