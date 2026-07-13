// ============================================================
//  E2E — wizard de donación (/donate): los 4 pasos de la operación
//  (Monto → Destino → Pago → Confirmar) avanzan, validan y regresan.
//  NO envía la donación (no ensuciar producción): valida el flujo de
//  UI hasta dejar listo el submit.
// ============================================================
import { test, expect } from '@playwright/test';

test.describe('Donar — wizard de pasos', () => {
  test('avanza por los 4 pasos, exige boleta en transferencia y regresa con Atrás', async ({ page }) => {
    await page.goto('/donate');

    // Paso 1 · Monto (Q100 preseleccionado)
    await expect(page.getByText('¿Cuánto quieres sembrar?')).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Q250', exact: true }).click();
    await page.getByRole('button', { name: /continuar/i }).click();

    // Paso 2 · Destino
    await expect(page.getByText('¿A dónde va tu siembra?')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /células/i }).click();
    await page.getByRole('button', { name: /continuar/i }).click();

    // Paso 3 · Pago — transferencia por defecto: muestra banco y BLOQUEA sin boleta
    await expect(page.getByText('¿Cómo quieres darlo?')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Banrural')).toBeVisible();
    await expect(page.getByRole('button', { name: /continuar/i })).toBeDisabled();

    // En persona → desbloquea
    await page.getByRole('button', { name: /en persona/i }).click();
    await expect(page.getByRole('button', { name: /continuar/i })).toBeEnabled();
    await page.getByRole('button', { name: /continuar/i }).click();

    // Paso 4 · Confirmar — resumen con el monto y destino elegidos
    await expect(page.getByText('Q250')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/células · en persona/i)).toBeVisible();
    // Sin nombre, el submit está bloqueado
    await expect(page.getByRole('button', { name: /registrar donación/i })).toBeDisabled();
    await page.getByPlaceholder('Tu nombre').fill('Prueba E2E');
    await expect(page.getByRole('button', { name: /registrar donación/i })).toBeEnabled();

    // Atrás regresa al paso de pago
    await page.getByRole('button', { name: /atrás/i }).click();
    await expect(page.getByText('¿Cómo quieres darlo?')).toBeVisible({ timeout: 10_000 });

    // Los pasos completados son clickeables (volver a Monto)
    await page.getByRole('button', { name: /monto/i }).click();
    await expect(page.getByText('¿Cuánto quieres sembrar?')).toBeVisible({ timeout: 10_000 });
  });
});
