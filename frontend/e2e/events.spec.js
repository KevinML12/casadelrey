// ============================================================
//  E2E — flujo de Eventos, de punta a punta contra el sitio real
//  (Vercel + Fly + Supabase, no mocks). Cubre:
//   1. Admin crea un evento GRATIS con foto real → aparece en el
//      panel admin y en la vista pública → RSVP se confirma directo
//   2. Admin crea un evento CON COSTO → la vista pública muestra el
//      banner de pago → sin comprobante subido, el RSVP pide boleta
//      primero (nunca confirma sin pago)
//  Cada test limpia el evento que crea (borra al final) para no
//  ensuciar producción en corridas repetidas.
// ============================================================
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { loginAsAdmin } from './fixtures/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHOTO = path.join(__dirname, 'assets', 'test-cover.jpg');

const stamp = Date.now();

async function createEventViaAdmin(page, { title, requiresPayment = false, photo }) {
  await page.goto('/admin/events');
  await page.getByRole('button', { name: /nuevo evento/i }).click();

  await page.getByLabel(/título/i).fill(title);

  const dateInput = page.locator('input[type="date"]').first();
  const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await dateInput.fill(future);

  await page.getByLabel(/ubicación/i).fill('Auditorio Central — E2E');
  await page.getByLabel(/descripción/i).fill('Evento creado automáticamente por la suite E2E de Playwright.');

  if (photo) {
    await page.locator('input[type="file"][accept="image/*"]').setInputFiles(photo);
    // Esperar a que termine "Subiendo…" y aparezca el preview de la imagen
    await expect(page.getByText(/subiendo/i)).toHaveCount(0, { timeout: 20_000 });
    await expect(page.locator('img[alt="Portada"]')).toBeVisible({ timeout: 10_000 });
  }

  if (requiresPayment) {
    await page.getByText('Este evento requiere pago').click();
    await page.getByLabel(/precio/i).fill('150');
    const deadline = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await page.locator('input[type="date"]').nth(1).fill(deadline);
  }

  const [resp] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/admin/events') && r.request().method() === 'POST'),
    page.getByRole('button', { name: /guardar evento/i }).click(),
  ]);
  if (!resp.ok()) {
    console.log(`[DEBUG] POST /admin/events respondió ${resp.status()}:`, await resp.text().catch(() => '(sin body)'));
  }
  expect(resp.ok(), `POST /admin/events falló con status ${resp.status()}`).toBeTruthy();
  await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });
}

async function deleteEventViaAdmin(page, title) {
  await page.goto('/admin/events');
  const row = page.locator('div.group', { hasText: title }).first();
  // Sin early-return silencioso: si la fila no aparece, el test debe
  // FALLAR (antes un `return` temprano dejaba eventos huérfanos en
  // producción sin que la suite se diera cuenta).
  await expect(row).toBeVisible({ timeout: 10_000 });
  page.once('dialog', (d) => d.accept());
  // El ícono "delete" (Material Symbols) es texto real → accessible
  // name = "delete", más confiable que una posición ordinal.
  await row.getByRole('button', { name: 'delete' }).click();
  await expect(page.getByText(title)).toHaveCount(0, { timeout: 10_000 });
}

test.describe('Eventos — flujo completo (admin → público → RSVP)', () => {
  test('evento gratis: crear con foto, verlo en público, RSVP se confirma', async ({ page }) => {
    const title = `E2E Culto de Prueba ${stamp}`;

    await loginAsAdmin(page);
    await createEventViaAdmin(page, { title, photo: PHOTO });

    // Vista pública — puede estar en carrusel o grid según el estado del toggle
    await page.goto('/events');
    await expect(page.getByText(title)).toBeVisible({ timeout: 15_000 });

    const card = page.locator('.liquid-shine', { hasText: title });
    await card.getByRole('button', { name: /confirmar|registrarme/i }).click();

    // Modal de RSVP
    // "Confirmar asistencia" aparece tanto en el título del modal (<p>) como
    // en el botón de enviar — scoping al párrafo para no chocar con strict mode.
    await expect(page.locator('p', { hasText: 'Confirmar asistencia' })).toBeVisible();
    await page.locator('input[placeholder="Tu nombre completo"]').fill('Visitante E2E');
    await page.locator('input[placeholder="El mismo correo del comprobante"]').fill(`e2e.${stamp}@example.com`);
    await page.getByRole('button', { name: /confirmar asistencia/i }).click();

    await expect(page.getByText('¡Registro confirmado!')).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /listo/i }).click();

    await deleteEventViaAdmin(page, title);
  });

  test('evento con costo: muestra banner de pago y exige comprobante antes de registrar', async ({ page }) => {
    const title = `E2E Retiro con Costo ${stamp}`;

    await loginAsAdmin(page);
    await createEventViaAdmin(page, { title, requiresPayment: true, photo: PHOTO });

    await page.goto('/events');
    await expect(page.getByText(title)).toBeVisible({ timeout: 15_000 });

    // La card debe mostrar el precio y el CTA "Registrarme" (no "Confirmar")
    const card = page.locator('.liquid-shine', { hasText: title });
    await expect(card.getByText('Q150')).toBeVisible();
    await card.getByRole('button', { name: /registrarme/i }).click();

    // El modal debe mostrar el banner de pago. Los datos bancarios son
    // administrables (/admin/settings) — sin cuenta configurada invita a
    // coordinar por contacto en vez de mostrar un número hardcodeado.
    await expect(page.getByText('Evento con costo')).toBeVisible();
    await expect(
      page.getByText(/coordinar tu depósito/i).or(page.getByText('Banco'))
    ).toBeVisible({ timeout: 10_000 });

    await page.locator('input[placeholder="Tu nombre completo"]').fill('Visitante E2E Pago');
    await page.locator('input[placeholder="El mismo correo del comprobante"]').fill(`e2e.pago.${stamp}@example.com`);
    await page.getByRole('button', { name: /verificar y registrar/i }).click();

    // Sin comprobante subido, el backend responde 402 → pantalla de "sube tu comprobante"
    await expect(page.getByText('Comprobante requerido')).toBeVisible({ timeout: 15_000 });

    await page.keyboard.press('Escape').catch(() => {});
    await deleteEventViaAdmin(page, title);
  });
});
