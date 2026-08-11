// ============================================================
//  E2E — REGLAS DE DISEÑO del sitio público, blindadas contra
//  regresión. No prueban funcionalidad: prueban decisiones de
//  identidad visual que el dueño tomó explícitamente y que es fácil
//  deshacer sin darse cuenta al agregar una sección nueva.
//
//  Dos capas a propósito:
//   · Capa DOM (Playwright): lo que el visitante realmente ve.
//   · Capa FUENTE (fs + regex): atrapa el patrón aunque la página que
//     lo reintroduce no esté en la lista de rutas de abajo. Un test de
//     DOM solo cubre las rutas que se le enumeran; el de fuente cubre
//     el repo entero, que es lo que hace falta para una regla "sin
//     excepciones".
//
//  Si un test de aquí falla, la pregunta correcta NO es "cómo lo
//  silencio" sino "el dueño cambió de opinión sobre esta regla?".
// ============================================================
import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'src');

/** Todos los .jsx/.js bajo src/, recursivo. */
function archivosFuente(dir = SRC, acc = []) {
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) archivosFuente(ruta, acc);
    else if (/\.(jsx?|css)$/.test(entrada)) acc.push(ruta);
  }
  return acc;
}

const FUENTES = archivosFuente();

// Los comentarios de este repo son largos y narran el historial de cada
// decisión -- incluidas las que estos tests vigilan ("no queda ningún
// <Icon> en el componente", "⚠️ variante eliminada a pedido del
// usuario"). Escanear el archivo crudo convierte esa documentación en
// falsos positivos, así que las reglas de fuente miran solo el código.
const sinComentarios = (texto) =>
  texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const leer = (f) => ({ ruta: relative(SRC, f), texto: readFileSync(f, 'utf8') });
const leerCodigo = (f) => {
  const { ruta, texto } = leer(f);
  return { ruta, texto: sinComentarios(texto) };
};

// Rutas públicas que un visitante anónimo puede abrir sin sesión.
const RUTAS_PUBLICAS = ['/', '/about', '/celulas', '/volunteering', '/events', '/donate', '/gallery', '/blog', '/conectate', '/prayer'];

test.describe('Reglas de diseño — anti-iconos', () => {
  // El dueño es "antiiconos" por identidad, no por estética pasajera:
  // "la atención está sobre las fotos, el liquid glass y su estilo tan
  // sofisticado y minimalista, los íconos y todo eso no debería ni
  // estar". Confirmado dos veces, incluido el caso límite de un ícono
  // que era dato editable por el admin ("se va todo, todo se va").
  test('ninguna página pública renderiza un ícono SVG', async ({ page }) => {
    for (const ruta of RUTAS_PUBLICAS) {
      await page.goto(ruta);
      // Espera a que el contenido real monte, no solo el HTML vacío.
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
      const svgs = await page.locator('svg').count();
      expect(svgs, `${ruta} renderizó ${svgs} <svg> — el sitio público no lleva íconos`).toBe(0);
    }
  });

  test('el código fuente no reintroduce <Icon> fuera de los 2 spinners permitidos', () => {
    // Única excepción viva: el spinner de carga. Es feedback de
    // movimiento, no un pictograma, y no tiene sustituto de solo texto.
    const PERMITIDOS = new Set(['components/blog/TTSPlayer.jsx', 'pages/public/VerifyEmail.jsx']);
    const infractores = [];
    for (const f of FUENTES) {
      const { ruta, texto } = leerCodigo(f);
      if (!/<Icon[\s/>]/.test(texto)) continue;
      if (PERMITIDOS.has(ruta) && /animate-spin/.test(texto)) continue;
      infractores.push(ruta);
    }
    expect(infractores, `<Icon> reapareció en: ${infractores.join(', ')}`).toEqual([]);
  });

  test('el código fuente no usa emojis en la interfaz', () => {
    // Rango de pictogramas/emoticones. Se excluyen comentarios de
    // caja (─ │ ═) y tipografía normal, que no caen en estos rangos.
    const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;
    const infractores = [];
    for (const f of FUENTES) {
      const { ruta, texto } = leerCodigo(f);
      texto.split('\n').forEach((linea, i) => {
        if (EMOJI.test(linea)) infractores.push(`${ruta}:${i + 1} → ${linea.trim().slice(0, 70)}`);
      });
    }
    expect(infractores, `emojis encontrados en: ${infractores.join(', ')}`).toEqual([]);
  });
});

test.describe('Reglas de diseño — anti-eyebrow', () => {
  // Se eliminó el pill de cristal con punto brillante que iba encima de
  // casi cada titular ("• Identidad", "• Comunidad"). Se leía como
  // etiqueta de categoría puesta por un sistema, no como contenido
  // editorial: "la idea es que todos los módulos se sientan orgánicos
  // y se sobreentiendan".
  test('el componente Eyebrow no existe en el código', () => {
    const infractores = FUENTES.map(leerCodigo).filter(({ texto }) => /\bEyebrow\b/.test(texto)).map(({ ruta }) => ruta);
    expect(infractores, `Eyebrow reapareció en: ${infractores.join(', ')}`).toEqual([]);
  });

  test('PageHero no acepta un prop eyebrow', () => {
    const { texto } = leerCodigo(join(SRC, 'components', 'layout', 'PageHero.jsx'));
    expect(texto).not.toMatch(/\beyebrow\b/i);
  });
});

test.describe('Reglas de diseño — las fotos van a color', () => {
  // Las fotos reales de la iglesia son la única fuente de color del
  // sitio; apagarlas con un filtro gris deja el canvas navy solo con
  // blanco encima.
  test('ninguna imagen del sitio público lleva filtro grayscale', async ({ page }) => {
    for (const ruta of ['/', '/about', '/celulas', '/gallery']) {
      await page.goto(ruta);
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
      const grises = await page.evaluate(() =>
        [...document.querySelectorAll('img')]
          .filter((img) => (getComputedStyle(img).filter || '').includes('grayscale'))
          .map((img) => img.getAttribute('src') || '(sin src)')
      );
      expect(grises, `${ruta} tiene imágenes en blanco y negro: ${grises.join(', ')}`).toEqual([]);
    }
  });

  test('el código fuente no aplica grayscale a imágenes', () => {
    // -moz-osx-font-smoothing: grayscale en index.css es antialiasing
    // de texto, no un filtro de imagen — no cuenta.
    const infractores = [];
    for (const f of FUENTES) {
      const { ruta, texto } = leerCodigo(f);
      texto.split('\n').forEach((linea, i) => {
        if (!/grayscale/.test(linea)) return;
        if (/font-smoothing/.test(linea)) return;
        infractores.push(`${ruta}:${i + 1}`);
      });
    }
    expect(infractores, `grayscale reapareció en: ${infractores.join(', ')}`).toEqual([]);
  });
});

test.describe('Reglas de diseño — estructura editorial', () => {
  test('cada página pública tiene exactamente un h1', async ({ page }) => {
    // Sin el eyebrow, el titular es lo único que orienta al visitante
    // al entrar: tiene que existir y ser uno solo (jerarquía real, y
    // además es lo que leen los lectores de pantalla y Google).
    for (const ruta of RUTAS_PUBLICAS) {
      await page.goto(ruta);
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
      const h1s = await page.locator('h1').allTextContents();
      expect(h1s.length, `${ruta} tiene ${h1s.length} <h1>: ${h1s.join(' | ')}`).toBe(1);
    }
  });

  test('las secciones con foto de fondo la cargan de verdad', async ({ page }) => {
    // "Hero de fondo siempre" es la regla 1 del lenguaje visual. Una
    // foto rota deja la sección como un bloque navy plano, que es
    // exactamente lo que el material de cristal necesita detrás para
    // leerse como cristal.
    for (const ruta of ['/', '/about', '/celulas']) {
      await page.goto(ruta);
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
      const rotas = await page.evaluate(() =>
        [...document.querySelectorAll('img')]
          .filter((img) => img.complete && img.naturalWidth === 0)
          .map((img) => img.getAttribute('src') || '(sin src)')
      );
      expect(rotas, `${ruta} tiene imágenes rotas: ${rotas.join(', ')}`).toEqual([]);
    }
  });
});
