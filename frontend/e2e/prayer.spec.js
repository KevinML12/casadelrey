// ============================================================
//  E2E — flujo de Peticiones de Oración, de punta a punta:
//   1. /prayer es PÚBLICA (no redirige a /login) — cualquiera manda su
//      petición con sus datos; el equipo pastoral la lee los domingos.
//   2. La petición enviada aparece en el panel admin (/admin/petitions).
//   3. Limpieza: se elimina vía DELETE /admin/petitions/:id (endpoint
//      agregado para el panel y para esta limpieza — regla del repo:
//      todo test borra los datos que crea). El login sí es por UI; solo
//      la limpieza usa la API directa con el token de esa sesión real.
//
//  Correr contra el stack local: PW_BASE_URL=http://localhost:5173
//  (frontend dev) + backend local en :8080. Contra producción usa los
//  defaults (Vercel + Fly).
// ============================================================
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './fixtures/auth.js';

const stamp = Date.now();

// El API vive aparte del frontend (Fly vs Vercel). Para stack local,
// el backend corre en :8080.
const API_URL = (
  process.env.PW_API_URL ||
  (process.env.PW_BASE_URL?.includes('localhost')
    ? 'http://localhost:8080'
    : 'https://casa-del-rey-mvp.fly.dev')
).replace(/\/$/, '') + '/api/v1';

test.describe('Peticiones de oración — flujo completo (público → admin)', () => {
  test('la página es pública, el formulario envía, llega al panel y se limpia', async ({ page }) => {
    const subject = `E2E Petición ${stamp}`;

    // 1 · Página PÚBLICA: no debe redirigir a /login (estuvo un tiempo
    //     detrás de ProtectedRoute por error)
    await page.goto('/prayer');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByText('Petición de Oración')).toBeVisible({ timeout: 15_000 });

    // 2 · Enviar la petición como visitante anónimo
    await page.getByLabel(/nombre \*/i).fill('Visitante E2E');
    await page.getByLabel(/correo/i).fill(`e2e.prayer.${stamp}@example.com`);
    await page.getByLabel(/asunto \*/i).fill(subject);
    await page.getByLabel(/petición \*/i).fill('Petición creada automáticamente por la suite E2E. Puede ignorarse.');

    const [resp] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/contact/petition') && r.request().method() === 'POST'),
      page.getByRole('button', { name: /enviar petición/i }).click(),
    ]);
    expect(resp.status(), `POST /contact/petition respondió ${resp.status()}`).toBe(201);
    const { id: petitionId } = await resp.json();
    expect(petitionId, 'el backend debe devolver el id de la petición').toBeTruthy();

    await expect(page.getByText('¡Recibida con amor!')).toBeVisible({ timeout: 15_000 });

    // 3 · La petición aparece en el panel admin
    await loginAsAdmin(page);
    await page.goto('/admin/petitions');
    await expect(page.getByText(subject)).toBeVisible({ timeout: 15_000 });

    // 4 · Limpieza: DELETE con el token de la sesión real (UI) de arriba
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token, 'debe existir el token de la sesión admin').toBeTruthy();
    const del = await page.request.delete(`${API_URL}/admin/petitions/${petitionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(del.ok(), `DELETE petición respondió ${del.status()}`).toBeTruthy();

    // 5 · Verificar que ya no está en el panel
    await page.reload();
    await expect(page.getByText(subject)).toHaveCount(0, { timeout: 15_000 });
  });
});
