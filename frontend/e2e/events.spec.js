// Real event publication and RSVP, limited to the disposable local stack.
import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./fixtures/auth.js";
test.skip(
  process.env.CDR_LOCAL_E2E !== "1",
  "Run through ops/test_fullstack.py",
);
test.use({ trace: "off", video: "off" });
const API = process.env.PW_API_URL + "/api/v1";
test.beforeAll(() => {
  for (const url of [process.env.PW_API_URL, process.env.PW_BASE_URL])
    expect(new URL(url).hostname).toBe("127.0.0.1");
});
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

test("paid event reserves seats and confirms one registration after private receipt review", async ({
  page,
  browser,
}) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await loginAsAdmin(page);
  const auth = {
    Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem("token"))}`,
  };
  const original = await (await page.request.get(API + "/settings")).json();
  const bank = {
    bank_name: "Banco de simulación local",
    bank_account: "0000000000",
    bank_account_type: "Simulación",
    bank_holder: "Sin operaciones bancarias reales",
  };
  const visitor = await browser.newContext({
    baseURL: process.env.PW_BASE_URL,
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  try {
    for (const [key, value] of Object.entries(bank))
      expect(
        (
          await page.request.put(`${API}/admin/settings/${key}`, {
            headers: auth,
            data: { value },
          })
        ).ok(),
      ).toBe(true);

    // Publication/upload are exercised above; this scenario isolates the full
    // visitor -> private receipt -> administrator -> confirmed RSVP handoff.
    const title = "Encuentro con aporte y revisión E2E";
    const created = await page.request.post(API + "/admin/events/", {
      headers: auth,
      data: {
        title,
        date: "2099-12-02",
        description: "Encuentro temporal de la suite aislada.",
        cover_image: `${process.env.PW_BASE_URL}/images/backgrounds/congregacion.webp`,
        requires_payment: true,
        price_gtq: 50,
        capacity: 3,
        reservation_hours: 24,
      },
    });
    expect(created.status()).toBe(201);
    const event = await created.json();
    const guest = await visitor.newPage();
    await guest.goto(`/events?id=${event.ID}`);
    await guest
      .getByRole("region", { name: "Próximos eventos", exact: true })
      .getByRole("button", { name: "Registrarme", exact: true })
      .click();
    let dialog = guest.getByRole("dialog").last();
    const name = "Asistente con comprobante E2E";
    await dialog.getByLabel("Nombre *", { exact: true }).fill(name);
    await dialog
      .getByLabel("Correo *", { exact: true })
      .fill("paid-attendee@example.invalid");
    await dialog.getByLabel("Asistentes", { exact: true }).fill("2");
    const gate = guest.waitForResponse(
      (r) => r.url() === `${API}/events/${event.ID}/rsvp`,
    );
    await dialog
      .getByRole("button", { name: "Verificar y registrar", exact: true })
      .click();
    expect((await gate).status()).toBe(402);
    dialog = guest.getByRole("dialog").last();
    await expect(
      dialog.getByText("Comprobante requerido", { exact: true }),
    ).toBeVisible();
    const uploaded = guest.waitForResponse(
      (r) =>
        r.url() === API + "/receipts/upload" && r.request().method() === "POST",
    );
    await dialog
      .getByLabel("Archivo del comprobante", { exact: true })
      .setInputFiles("e2e/assets/test-cover.jpg");
    expect((await uploaded).status()).toBe(201);
    const registered = guest.waitForResponse(
      (r) =>
        r.url() === `${API}/events/${event.ID}/rsvp` &&
        r.request().method() === "POST",
    );
    await dialog
      .getByRole("button", { name: "Enviar comprobante y registrar", exact: true })
      .click();
    const submitted = await registered;
    expect(submitted.status()).toBe(201);
    const { registration } = await submitted.json();
    expect(registration.payment_status).toBe("pendiente");
    expect(registration.receipt_id).toBeGreaterThan(0);
    await expect(
      dialog.getByRole("heading", { name: "Registro recibido", exact: true }),
    ).toBeVisible();
    expect(
      await guest.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true);

    // A repeated request must not create another receipt or reserve twice.
    const retry = await guest.request.post(`${API}/events/${event.ID}/rsvp`, {
      headers: {
        "Idempotency-Key": submitted.request().headers()["idempotency-key"],
      },
      data: submitted.request().postDataJSON(),
    });
    expect(retry.status()).toBe(200);
    expect((await retry.json()).registration.ID).toBe(registration.ID);
    const availability = async () =>
      (await (await guest.request.get(API + "/events")).json()).find(
        (item) => item.ID === event.ID,
      );
    expect(await availability()).toMatchObject({
      attendee_count: 2,
      spots_remaining: 1,
    });
    const fileURL = `${API}/admin/receipts/${registration.receipt_id}/file`;
    expect((await guest.request.get(fileURL)).status()).toBe(401);
    expect((await page.request.get(fileURL, { headers: auth })).status()).toBe(200);

    await page.goto("/admin/receipts");
    await page
      .getByText(name, { exact: true })
      .locator('xpath=ancestor::*[.//button[normalize-space()="Verificar"]][1]')
      .getByRole("button", { name: "Verificar", exact: true })
      .click();
    const review = page.getByRole("dialog", { name: "Revisión de comprobante" });
    await expect(review.getByRole("img")).toBeVisible();
    await review
      .getByRole("button", { name: "Aprobar comprobante", exact: true })
      .click();
    await expect(review).toHaveCount(0);
    const rsvps = await (
      await page.request.get(`${API}/admin/events/${event.ID}/rsvps`, {
        headers: auth,
      })
    ).json();
    expect(rsvps.data).toHaveLength(1);
    expect(rsvps.data[0]).toMatchObject({
      ID: registration.ID,
      payment_status: "verificado",
      attendee_count: 2,
    });
    expect(await availability()).toMatchObject({
      attendee_count: 2,
      spots_remaining: 1,
    });
    await page.goto("/admin/events");
    const row = page.locator("div.group").filter({ hasText: title });
    await row.getByText(title, { exact: true }).click();
    await expect(row.getByText(name, { exact: true })).toBeVisible();
    await expect(row.getByText("Pago verificado", { exact: true })).toBeVisible();
  } finally {
    await visitor.close();
    for (const key of Object.keys(bank))
      expect(
        (
          await page.request.put(`${API}/admin/settings/${key}`, {
            headers: auth,
            data: { value: original[key] || "" },
          })
        ).ok(),
      ).toBe(true);
  }
});
