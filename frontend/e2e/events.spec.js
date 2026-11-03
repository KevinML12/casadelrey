// Real event publication and RSVP, limited to the disposable local stack.
import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./fixtures/auth.js";
test.skip(
  process.env.CDR_LOCAL_E2E !== "1",
  "Run through ops/test_fullstack.py",
);
test.use({ trace: "off", video: "off" });
const API = process.env.PW_API_URL + "/api/v1";
for (const paid of [false, true])
  test(`event ${paid ? "paid gate" : "free RSVP"}: actual upload, publication and registration`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await loginAsAdmin(page);
    const title = `Encuentro E2E ${paid ? "con aporte" : "gratuito"}`;
    await page.goto("/admin/events");
    await page
      .getByRole("button", { name: "Nuevo evento", exact: true })
      .click();
    await page.getByLabel("Título *", { exact: true }).fill(title);
    await page.getByLabel("Fecha *", { exact: true }).fill("2099-12-01");
    await page
      .getByLabel("Ubicación", { exact: true })
      .fill("Auditorio de verificación");
    await page
      .getByLabel("Descripción", { exact: true })
      .fill("Un encuentro temporal de la suite aislada.");
    const upload = page.waitForResponse(
      (r) => r.url() === API + "/upload" && r.request().method() === "POST",
    );
    await page
      .locator("input[type=file]")
      .setInputFiles("e2e/assets/test-cover.jpg");
    expect((await upload).status()).toBe(201);
    await expect(page.getByAltText("Portada", { exact: true })).toBeVisible();
    if (paid) {
      await page
        .getByLabel("Este evento requiere pago", { exact: true })
        .check();
      await page.getByLabel("Precio (Q)", { exact: true }).fill("150");
    }
    const created = page.waitForResponse(
      (r) =>
        r.url() === API + "/admin/events/" && r.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Guardar evento", exact: true })
      .click();
    const response = await created;
    expect(response.status()).toBe(201);
    const event = await response.json();
    await page.goto(`/events?id=${event.ID}`);
    const scene = page.getByRole("region", {
      name: "Próximos eventos",
      exact: true,
    });
    await expect(
      scene.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await scene
      .getByRole("button", { name: "Ver detalles", exact: true })
      .click();
    const details = page.getByRole("dialog").last();
    await expect(
      details.getByText("Un encuentro temporal de la suite aislada.", {
        exact: true,
      }),
    ).toBeVisible();
    await details
      .getByRole("button", {
        name: paid ? "Registrarme" : "Confirmar",
        exact: true,
      })
      .click();
    const dialog = page.getByRole("dialog").last();
    if (paid) {
      await expect(
        dialog.getByRole("heading", {
          name: "Registro no disponible aún",
          exact: true,
        }),
      ).toBeVisible();
      return;
    }
    await dialog.getByLabel("Nombre *", { exact: true }).fill("Asistente E2E");
    await dialog
      .getByLabel("Correo *", { exact: true })
      .fill("attendee@example.invalid");
    const registered = page.waitForResponse(
      (r) =>
        r.url() === `${API}/events/${event.ID}/rsvp` &&
        r.request().method() === "POST",
    );
    await dialog
      .getByRole("button", { name: "Confirmar asistencia", exact: true })
      .click();
    expect((await registered).status()).toBe(201);
    await expect(
      page.getByText("¡Registro confirmado!", { exact: true }),
    ).toBeVisible();
    await page.goto("/admin/events");
    const row = page.locator("div.group").filter({ hasText: title });
    await row.getByText(title, { exact: true }).click();
    await expect(row.getByText("Asistente E2E", { exact: true })).toBeVisible();
  });
