// Login real por UI (no atajos de API) — la filosofía del proyecto es
// "usar el flujo real en todo momento". Las credenciales NUNCA van
// hardcodeadas: se leen de variables de entorno (ver .env.e2e.local,
// gitignored) para que este archivo sea seguro de commitear.
export async function loginAsAdmin(page) {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'Faltan E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD. Corre con --env-file=.env.e2e.local o expórtalas en el shell.'
    );
  }

  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /ingresar/i }).click();
  await page.waitForURL(/\/admin/, { timeout: 15_000 });
}
