// ============================================================
//  seed-demo-events — crea eventos de muestra REALES vía automatización
//  de browser (Playwright), no vía API directa: login real por UI,
//  llenar el formulario de /admin/events, subir la foto de portada de
//  verdad, guardar. Mismo "flujo real" que seguiría un admin humano.
//
//  A propósito NO es un archivo *.spec.js — vive fuera del testDir
//  que corre `npx playwright test`, para que nunca se dispare por
//  accidente ni duplique eventos en cada corrida de la suite de
//  regresión. Se ejecuta a mano, una vez:
//
//    node e2e/seed-demo-events.mjs
//
//  (requiere las mismas env vars que la suite: E2E_ADMIN_EMAIL /
//  E2E_ADMIN_PASSWORD, ver .env.e2e.local)
// ============================================================
import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.PW_BASE_URL || 'https://casadelreyhue.vercel.app';
const PHOTOS_DIR = path.join(__dirname, 'assets', 'demo-events');

const EVENTS = [
  {
    title: 'Noche de Alabanza y Adoración',
    daysFromNow: 21,
    time: '19:00',
    location: 'Auditorio Central, Casa del Rey',
    description: 'Una noche completa dedicada a exaltar Su nombre — ven a adorar junto a toda la congregación.',
    photo: 'noche-alabanza.jpg',
    requiresPayment: false,
  },
  {
    title: 'Retiro de Jóvenes 2026',
    daysFromNow: 45,
    time: '08:00',
    location: 'Campamento El Retiro, km 45',
    description: 'Tres días fuera de la rutina para crecer en comunidad y en la Palabra. Incluye hospedaje y alimentación.',
    photo: 'retiro-jovenes.jpg',
    requiresPayment: true,
    price: 250,
    paymentDeadlineDaysFromNow: 35,
  },
  {
    title: 'Conferencia de Liderazgo',
    daysFromNow: 60,
    time: '17:00',
    location: 'Salón de Eventos, Casa del Rey',
    description: 'Formación y capacitación para líderes de célula y ministerios — obligatoria para todo el equipo de liderazgo.',
    photo: 'conferencia-lideres.jpg',
    requiresPayment: false,
  },
  {
    title: 'Festival de Alabanza y Danza',
    daysFromNow: 75,
    time: '16:00',
    location: 'Auditorio Central, Casa del Rey',
    description: 'Nuestros ministerios de danza y alabanza se unen en una tarde de celebración para toda la familia.',
    photo: 'festival-danza.jpg',
    requiresPayment: false,
  },
];

function futureDate(daysFromNow) {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

async function main() {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Faltan E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD en el entorno.');
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL: BASE_URL });

  console.log(`[seed] Login como ${email}…`);
  await page.goto(`${BASE_URL}/login`);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /ingresar/i }).click();
  await page.waitForURL(/\/admin/, { timeout: 15_000 });
  console.log('[seed] Login OK.');

  let created = 0;
  for (const ev of EVENTS) {
    console.log(`\n[seed] Creando: "${ev.title}"…`);
    await page.goto(`${BASE_URL}/admin/events`);

    // Evitar duplicados si el script se corre más de una vez
    const already = await page.getByText(ev.title).count();
    if (already > 0) {
      console.log(`[seed] Ya existe, se omite.`);
      continue;
    }

    await page.getByRole('button', { name: /nuevo evento/i }).click();
    await page.getByLabel(/título/i).fill(ev.title);
    await page.locator('input[type="date"]').first().fill(futureDate(ev.daysFromNow));
    await page.getByLabel(/^hora/i).fill(ev.time);
    await page.getByLabel(/ubicación/i).fill(ev.location);
    await page.getByLabel(/descripción/i).fill(ev.description);

    const photoPath = path.join(PHOTOS_DIR, ev.photo);
    await page.locator('input[type="file"][accept="image/*"]').setInputFiles(photoPath);
    await page.waitForSelector('img[alt="Portada"]', { timeout: 20_000 });
    console.log('[seed] Foto subida.');

    if (ev.requiresPayment) {
      await page.getByText('Este evento requiere pago').click();
      await page.getByLabel(/precio/i).fill(String(ev.price));
      await page.locator('input[type="date"]').nth(1).fill(futureDate(ev.paymentDeadlineDaysFromNow));
    }

    const [resp] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/admin/events') && r.request().method() === 'POST'),
      page.getByRole('button', { name: /guardar evento/i }).click(),
    ]);
    if (!resp.ok()) {
      console.error(`[seed] ✗ Falló al guardar "${ev.title}": ${resp.status()} ${await resp.text().catch(() => '')}`);
      continue;
    }
    await page.waitForSelector(`text=${ev.title}`, { timeout: 10_000 });
    console.log(`[seed] ✓ Creado.`);
    created++;
  }

  await browser.close();
  console.log(`\n[seed] Listo — ${created}/${EVENTS.length} eventos nuevos creados.`);
}

main().catch((err) => {
  console.error('[seed] Error fatal:', err);
  process.exit(1);
});
