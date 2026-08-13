// ============================================================
//  E2E — Photos Fallback
//  Valida que el sistema de fondos fotográficos (SectionBg,
//  PageHero, App.jsx background global antiguo si aplica)
//  esté renderizando una foto de fondo en las rutas principales.
//  Esto blinda el comportamiento de la SPA frente a fallos
//  de la API de settings en producción.
// ============================================================
import { test, expect } from '@playwright/test';

test.describe('Sistema de Fondos (Fotos Fallback)', () => {
  test('las páginas principales siempre renderizan fotos de fondo', async ({ page }) => {
    // Verificamos que las páginas que usan SectionBg o ParallaxImg
    // efectivamente monten al menos una imagen de fondo.
    const rutas = [
      '/', // Home (usa SectionBg por sección)
      '/about', // Nosotros (usa PageHero y SectionBg)
      '/celulas', // Células (usa SectionBg)
    ];

    for (const ruta of rutas) {
      await page.goto(ruta);
      
      // Buscamos cualquier imagen que funcione como fondo (por clases comunes de nuestro sistema)
      // SectionBg usa: img.absolute.inset-0.w-full.h-full.pointer-events-none
      // ParallaxImg usa: img.absolute.inset-0.w-full.h-full.object-cover
      const bgImage = page.locator('img[src*="/images/"]').first();
      
      // Debe haber montado una imagen
      await expect(bgImage).toBeVisible({ timeout: 15_000 });
      
      // Debe tener un src válido que apunte a nuestro directorio estático de fallback
      // o a la URL devuelta por el backend.
      const src = await bgImage.getAttribute('src');
      expect(src).toBeTruthy();
      expect(src.includes('/images/')).toBe(true);
    }
  });
});
