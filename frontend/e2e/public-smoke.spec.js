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
    await expect(page.locator('img[src*="bg-auth"], img[src*="site-photos"]').first()).toBeVisible({ timeout: 15_000 });
    await page.goto('/register');
    await expect(page.locator('img[src*="bg-registro"], img[src*="site-photos"]').first()).toBeVisible({ timeout: 15_000 });
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

  test('cada célula ofrece una salida real: "Unirme" abre la solicitud', async ({ page }) => {
    // Esto blinda el arreglo de ago-2026. Antes cada fila era un enlace a
    // WhatsApp construido con el teléfono del líder, y como el directorio
    // /leaders está vacío, las 16 abrían WhatsApp SIN destinatario: el
    // visitante recorría toda la página y terminaba en un selector de
    // contactos en blanco, sin que la iglesia se enterara del intento.
    // Ahora la fila abre un formulario que registra la solicitud y la
    // manda al panel del líder de esa célula.
    //
    // NO se envía el formulario a propósito: la suite corre también contra
    // producción (ver playwright.config.js) y un submit dejaría una
    // solicitud falsa en la bandeja real del equipo. Se valida el camino
    // hasta dejarlo listo para enviar, igual que hace donate.spec.js.
    await page.goto('/celulas');
    const card = page.locator('button.liquid-glass').first();
    await card.waitFor({ state: 'visible', timeout: 15_000 });
    await card.click();

    const dialog = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Ninguna fila puede volver a ser un enlace de WhatsApp sin número.
    const waSinNumero = await dialog.locator('a[href^="https://wa.me/?"]').count();
    expect(waSinNumero, 'reapareció un enlace de WhatsApp sin destinatario').toBe(0);

    // Tocar una célula abre su FICHA en una capa encima de la ventana:
    // horarios, líder, qué esperar. La ventana de la categoría se queda
    // detrás, no se cierra.
    const fila = dialog.getByRole('button', { name: /^ver la célula /i }).first();
    await expect(fila, 'las células deben ofrecer una acción de contacto').toBeVisible({ timeout: 10_000 });
    await fila.click();
    await expect(dialog.getByRole('button', { name: /cerrar/i })).toBeVisible();

    // Sigue habiendo UN solo dialog: la capa vive dentro del overlay que
    // ya existe, no en un segundo [role=dialog]. Dos diálogos anidados
    // pelean por el foco y por el bloqueo de scroll.
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).toHaveCount(1);

    // Desde la ficha, el CTA grande abre la solicitud.
    const unirme = dialog.getByRole('button', { name: /^quiero unirme a /i }).first();
    await expect(unirme).toBeVisible();
    await unirme.click();

    // Campos con etiqueta, mismo patrón que la aplicación de Voluntariado.
    await dialog.getByLabel(/tu nombre/i).fill('Prueba E2E');
    await dialog.getByLabel(/tel[eé]fono o whatsapp/i).fill('50200000000');

    // "Continuar" NO envía: lleva al paso que muestra a QUIÉN le va a
    // llegar la solicitud. Ese paso es el punto del diseño — cada célula
    // tiene su propio líder y es él quien la recibe.
    await dialog.getByRole('button', { name: /^continuar$/i }).click();
    await expect(dialog.getByText(/qui[eé]n te va a contactar/i)).toBeVisible();
    await expect(dialog.getByRole('button', { name: /confirmar solicitud/i })).toBeVisible();

    // Hasta aquí llega el test: confirmar dispararía el POST y dejaría una
    // solicitud falsa en la bandeja real del equipo cuando la suite corre
    // contra producción. Se vuelve sin perder la ventana.
    await dialog.getByRole('button', { name: /volver a editar/i }).click();
    await dialog.getByRole('button', { name: /volver a la lista/i }).click();
    await expect(unirme).toBeVisible();
  });
});
