import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUT_DIR = '/Users/kevv/.gemini/antigravity/brain/1c83d67d-16a9-44d1-bd56-ed8b314661d7';
const FRONTEND_DIR = path.resolve(__dirname, '..');

async function main() {
  console.log('Iniciando vite preview en puerto 4173...');
  const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--host', '127.0.0.1'], {
    cwd: FRONTEND_DIR,
    stdio: 'pipe',
  });

  // Esperar a que el servidor de preview esté listo
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-web-security'],
  });

  const viewports = [
    { name: 'mobile_390', width: 390, height: 844, isMobile: true },
    { name: 'tablet_768', width: 768, height: 1024, isMobile: false },
    { name: 'desktop_1440', width: 1440, height: 900, isMobile: false },
  ];

  try {
    for (const vp of viewports) {
      console.log(`Capturando viewport: ${vp.name}...`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile,
        hasTouch: vp.isMobile,
      });
      await context.addInitScript(() => {
        sessionStorage.setItem('cdr-splash-seen', '1');
      });
      const page = await context.newPage();

      // ── 1. Células Page ──
      await page.goto('http://127.0.0.1:4173/celulas', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2500);
      await page.screenshot({
        path: path.join(OUT_DIR, `screenshot_celulas_top_${vp.name}.png`),
      });

      // Scroll to collage
      await page.evaluate(() => window.scrollBy(0, 520));
      await page.waitForTimeout(800);
      await page.screenshot({
        path: path.join(OUT_DIR, `screenshot_celulas_collage_${vp.name}.png`),
      });

      // Abrir una ventana flotante de categoría (WindowStack)
      const firstCellCard = page.locator('button.liquid-glass').first();
      if (await firstCellCard.isVisible()) {
        await firstCellCard.click();
        await page.waitForTimeout(1500);
        await page.screenshot({
          path: path.join(OUT_DIR, `screenshot_celulas_modal_${vp.name}.png`),
        });
        // Cerrar modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(600);
      }

      // ── 2. Voluntariado Page ──
      await page.goto('http://127.0.0.1:4173/voluntariado', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2500);
      await page.screenshot({
        path: path.join(OUT_DIR, `screenshot_voluntariado_top_${vp.name}.png`),
      });

      // Scroll to departments grid
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(OUT_DIR, `screenshot_voluntariado_grid_${vp.name}.png`),
      });

      // Abrir ventana flotante de voluntariado
      const firstDeptCard = page.locator('section button').first();
      if (await firstDeptCard.isVisible()) {
        await firstDeptCard.click();
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: path.join(OUT_DIR, `screenshot_voluntariado_modal_${vp.name}.png`),
        });
      }

      await context.close();
    }

    console.log('¡Todas las capturas se guardaron exitosamente!');
  } finally {
    await browser.close();
    preview.kill();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
