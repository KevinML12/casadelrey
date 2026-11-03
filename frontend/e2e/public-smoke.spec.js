// ============================================================
//  E2E — smoke del sitio público: las páginas clave cargan con su
//  contenido real y el header ofrece "Ingresar" al visitante anónimo
//  (antes no había NINGUNA entrada visible a /login — imposible llegar
//  al panel admin sin teclear la URL a mano).
// ============================================================
import { test, expect } from '@playwright/test';

test.describe('Sitio público — smoke', () => {
  test('el header muestra "Ingresar" sin sesión y lleva a /login', async ({ page }) => {
    await page.goto('/');
    const ingresar = page.getByRole('link', { name: /ingresar/i }).first();
    await expect(ingresar).toBeVisible({ timeout: 15_000 });
    await ingresar.click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('las páginas públicas clave renderizan su contenido', async ({ page }) => {
    // [ruta, texto que prueba que el contenido real montó]
    const casos = [
      ['/celulas', 'Células'],
      ['/gallery', 'Galería'],
      ['/blog', 'Blog'],
      ['/events', /eventos/i],
      ['/donate', 'Tu generosidad transforma.'],
      ['/about', /nosotros/i],
    ];
    for (const [ruta, texto] of casos) {
      await page.goto(ruta);
      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.getByText(texto).first()).toBeVisible({ timeout: 15_000 });
    }
  });

  test('login y registro tienen foto real de fondo (no navy plano)', async ({ page }) => {
    // Sin foto detrás, el cristal se lee como caja gris — la guía exige
    // "hero de fondo siempre".
    await page.goto('/login');
    await expect(page.locator('main img').first()).toBeVisible({ timeout: 15_000 });
    await page.goto('/register');
    await expect(page.locator('main img').first()).toBeVisible({ timeout: 15_000 });
    // Los 3 pasos del camino de cuenta
    await expect(page.getByText('Habla con tu líder')).toBeVisible();
    await expect(page.getByText('Te crean la cuenta')).toBeVisible();
    await expect(page.getByText('Ingresa y listo')).toBeVisible();
  });

  test('células abre su ventana sobrepuesta (WindowStack) accesible', async ({ page }) => {
    await page.goto('/celulas');
    // Abrir la primera card del collage
    const card = page.locator('button.liquid-glass').first();
    await card.waitFor({ state: 'visible', timeout: 15_000 });
    await card.click();
    // La ventana es un dialog modal real (focus trap + aria)
    const dialog = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    // Escape la cierra (navegación de teclado)
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0, { timeout: 10_000 });
  });

  test('cada célula ofrece una solicitud accesible sobre su ficha', async ({ page }) => {
    await page.goto('/celulas');
    const scene = page.getByRole('region', { name: 'Tipos de células', exact: true });
    await scene.locator('button.liquid-glass').first().click();
    const detail = page.getByRole('dialog').first();
    await detail.getByRole('tab', { name: 'Información', exact: true }).click();
    await detail.getByRole('button', { name: /^Ver la célula /i }).first().click();
    await detail.getByRole('button', { name: /^Quiero unirme a /i }).click();
    const application = page.getByRole('dialog').last();
    await application.getByLabel('Tu nombre *', { exact: true }).fill('Visitante de verificación');
    await application.getByLabel('Teléfono o WhatsApp *', { exact: true }).fill('00000000');
    await application.getByRole('button', { name: 'Continuar', exact: true }).click();
    await expect(application.getByText('¿Quién te va a contactar?', { exact: true })).toBeVisible();
    await expect(application.getByRole('button', { name: 'Confirmar y Enviar', exact: true })).toBeVisible();
    // GET-only smoke: actual submission and leader routing run in the isolated suite.
    await application.getByRole('button', { name: 'Volver a editar', exact: true }).click();
    await expect(application.getByLabel('Tu nombre *', { exact: true })).toHaveValue('Visitante de verificación');
    await application.getByRole('button', { name: 'Cerrar', exact: true }).click();
    await expect(detail.getByRole('button', { name: /^Quiero unirme a /i })).toBeVisible();
  });
});
