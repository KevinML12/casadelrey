// ============================================================
//  E2E — acordeón de donación (/donate): los 4 pasos de la operación
//  (Monto → Destino → Pago → Confirmar) se despliegan en cascada
//  hacia abajo; los completados quedan colapsados con su valor y son
//  editables al tocarlos. NO envía la donación (no ensuciar
//  producción): valida el flujo de UI hasta dejar listo el submit.
// ============================================================
import { test, expect } from '@playwright/test';

test.describe('Donar — acordeón de pasos', () => {
  test('despliega los 4 pasos en cascada, exige boleta en transferencia y edita pasos previos', async ({ page }) => {
    await page.goto('/donate');

    // Paso 1 · Monto (Q100 preseleccionado)
    await expect(page.getByText('¿Cuánto quieres sembrar?')).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Q250', exact: true }).click();
    await page.getByRole('button', { name: /continuar/i }).click();

    // Paso 2 · Destino se despliega; el paso 1 queda colapsado con Q250
    await expect(page.getByText('¿A dónde va tu siembra?')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /monto.*q250/i })).toBeVisible();
    await page.getByRole('button', { name: /células/i }).click();
    await page.getByRole('button', { name: /continuar/i }).click();

    // Paso 3 · Pago — transferencia por defecto. BankDetails es
    // administrable (/admin/settings): sin cuenta configurada NUNCA
    // muestra un número — invita a coordinar por contacto. Con cuenta
    // configurada, muestra los datos reales. Ambos casos son válidos;
    // solo verificamos que el bloque de pago renderizó algo coherente,
    // no un número hardcodeado que ya no existe en el código.
    await expect(page.getByText('¿Cómo quieres darlo?')).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText(/coordinar tu depósito/i).or(page.getByText('Banco'))
    ).toBeVisible({ timeout: 10_000 });
    // Esperar a que el paso anterior termine su animación de salida (durante
    // ~300ms coexisten dos "Continuar" y el strict mode revienta)
    await expect(page.getByRole('button', { name: /continuar/i })).toHaveCount(1, { timeout: 5_000 });
    await expect(page.getByRole('button', { name: /continuar/i })).toBeDisabled();

    // En persona → desbloquea
    await page.getByRole('button', { name: /en persona/i }).click();
    await expect(page.getByRole('button', { name: /continuar/i })).toBeEnabled();
    await page.getByRole('button', { name: /continuar/i }).click();

    // Paso 4 · Confirmar — resumen con lo elegido
    await expect(page.getByText('Últimos datos y listo.')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/células · en persona/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /registrar donación/i })).toBeDisabled();
    await page.getByPlaceholder('Tu nombre').fill('Prueba E2E');
    await expect(page.getByRole('button', { name: /registrar donación/i })).toBeEnabled();

    // Editar un paso completado: tocar su encabezado colapsado
    await page.getByRole('button', { name: /pago.*editar/i }).click();
    await expect(page.getByText('¿Cómo quieres darlo?')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /monto.*editar/i }).click();
    await expect(page.getByText('¿Cuánto quieres sembrar?')).toBeVisible({ timeout: 10_000 });
  });
});
