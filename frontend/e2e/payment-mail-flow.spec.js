import { test, expect } from "@playwright/test";
const image = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  "base64",
);
const reference = "receipt-private:01234567-89ab-4cde-8012-3456789abcde.png";
const event = {
  ID: 71,
  title: "Encuentro de la comunidad",
  date: "2027-02-15",
  time: "18:00",
  location: "Casa del Rey",
  description: "Encuentro de la comunidad.",
  cover_image: "/images/public_bg_eventos.jpg",
  requires_payment: true,
  price_gtq: 50,
  is_active: true,
  capacity: 20,
  spots_remaining: 20,
  is_full: false,
};
async function isolate(page, custom) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.includes("/api/v1")) {
      const path = url.pathname.split("/api/v1")[1].replace(/\/$/, "");
      const selected = await custom?.(path, request);
      const defaults =
        path === "/settings"
          ? {
              bank_account: "CONTROLLED-ACCOUNT",
              bank_name: "Banco configurado",
              bank_holder: "Casa del Rey",
            }
          : path === "/site-photos"
            ? {}
            : path === "/events"
              ? [event]
              : path === "/donation-purposes"
                ? [
                    {
                      value: "community",
                      title: "Comunidad",
                      description: "Destino administrado",
                    },
                  ]
                : path === "/receipts/upload"
                  ? { url: reference }
                  : [];
      return route.fulfill({
        status: selected?.status || 200,
        contentType: selected?.type || "application/json",
        body: selected?.raw ?? JSON.stringify(selected?.body ?? defaults),
      });
    }
    if (!["127.0.0.1", "localhost"].includes(url.hostname))
      return route.abort();
    return route.continue();
  });
}
async function file(page) {
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "controlled.png",
      mimeType: "image/png",
      buffer: image,
    });
  await expect(
    page.getByRole("img", { name: "Vista previa del comprobante" }),
  ).toHaveAttribute("src", /^blob:/);
}
async function noOverflow(page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
}

test("paid event commits receipt and registration through one request on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const writes = [];
  await isolate(page, (path, request) => {
    if (request.method() === "POST" && path !== "/receipts/upload") {
      writes.push({
        path,
        body: request.postDataJSON(),
        key: request.headers()["idempotency-key"],
      });
      if (path === "/events/71/rsvp")
        return request.postDataJSON().receipt
          ? {
              status: 201,
              body: {
                message: "Registro recibido.",
                registration: { ID: 9, payment_status: "pendiente" },
              },
            }
          : {
              status: 402,
              body: { error: "Sube tu comprobante", requires_payment: true },
            };
    }
  });
  await page.goto("/events");
  await page.getByRole("button", { name: "Registrarme", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Nombre", { exact: false })
    .fill("Visitante controlado");
  await dialog
    .getByLabel("Correo", { exact: false })
    .fill("controlled@example.invalid");
  await dialog.getByLabel("Asistentes", { exact: true }).fill("2");
  await dialog
    .getByRole("button", { name: "Verificar y registrar", exact: true })
    .click();
  await expect(
    dialog.getByRole("button", {
      name: "Enviar comprobante y registrar",
      exact: true,
    }),
  ).toBeDisabled();
  await file(page);
  await dialog
    .getByRole("button", {
      name: "Enviar comprobante y registrar",
      exact: true,
    })
    .click();
  await expect(
    dialog.getByRole("heading", { name: "Registro recibido", exact: true }),
  ).toBeVisible();
  const submitted = writes.find(
    (item) => item.path === "/events/71/rsvp" && item.body.receipt,
  );
  expect(submitted.body.receipt.amount).toBe(100);
  expect(submitted.body.receipt.receipt_image_url).toBe(reference);
  expect(submitted.key).toMatch(/^[0-9a-f-]{36}$/);
  expect(writes.some((item) => item.path === "/receipts")).toBe(false);
  await noOverflow(page);
});
test("standalone donation receipt includes managed destination and retains idempotency after ambiguous response", async ({
  page,
}) => {
  const keys = [];
  let attempts = 0;
  await isolate(page, (path, request) => {
    if (path === "/receipts" && request.method() === "POST") {
      attempts++;
      keys.push(request.headers()["idempotency-key"]);
      expect(request.postDataJSON().donation_purpose).toBe("community");
      return attempts === 1
        ? { status: 503, body: { error: "Conserva los datos y reintenta." } }
        : { status: 200, body: { id: 21 } };
    }
  });
  await page.goto("/comprobante");
  await page
    .getByLabel("Nombre completo *", { exact: true })
    .fill("Donante controlado");
  await page
    .getByLabel("Correo electrónico *", { exact: true })
    .fill("controlled@example.invalid");
  await page.getByLabel("Monto depositado (Q) *", { exact: true }).fill("100");
  await file(page);
  await page
    .getByRole("button", { name: "Enviar comprobante", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("reintenta");
  await page
    .getByRole("button", { name: "Enviar comprobante", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Comprobante recibido", exact: true }),
  ).toBeVisible();
  expect(keys).toHaveLength(2);
  expect(keys[0]).toBe(keys[1]);
});
test("secure correction consumes a fragment credential without exposing it in a URL or upload", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  const writes = [];
  await isolate(page, (path, request) => {
    if (path === "/receipts/91/replacement") {
      expect(request.postDataJSON().token).toBe("controlled-token");
      return {
        body: {
          amount: 125,
          payer_name: "Donante controlado",
          payer_email: "controlled@example.invalid",
          purpose: "donacion",
          rejection_reason: "La referencia no es legible.",
        },
      };
    }
    if (path === "/receipts/91/resubmit") {
      writes.push(request.postDataJSON());
      return { body: { message: "Recibido" } };
    }
  });
  await page.goto("/comprobante?receipt=91#token=controlled-token");
  await expect(
    page.getByText("La referencia no es legible.", { exact: false }),
  ).toBeVisible();
  expect(page.url()).not.toContain("controlled-token");
  await expect(page.getByLabel("Monto depositado (Q) *")).toHaveValue("125");
  await expect(page.getByLabel("Monto depositado (Q) *")).toHaveAttribute(
    "readonly",
    "",
  );
  await file(page);
  await page
    .getByRole("button", { name: "Enviar corrección", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Comprobante recibido", exact: true }),
  ).toBeVisible();
  expect(writes[0].token).toBe("controlled-token");
  expect(writes[0]).not.toHaveProperty("amount");
  await noOverflow(page);
});
test("mail administration distinguishes provider acceptance from uncertain delivery", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() =>
    localStorage.setItem(
      "token",
      [
        "eyJhbGciOiJIUzI1NiJ9",
        btoa(
          JSON.stringify({
            user_id: 999,
            name: "Controlled administrator",
            role: "admin",
            exp: 2000000000,
          }),
        ),
        "fixture",
      ].join("."),
    ),
  );
  await isolate(page, (path) =>
    path === "/admin/email/status"
      ? {
          body: {
            configured: false,
            api_key_configured: false,
            sender_configured: false,
            frontend_configured: true,
            local_limit_24h: 250,
          },
        }
      : path === "/admin/email/messages"
        ? {
            body: {
              data: [
                {
                  id: 1,
                  subject: "Tu pago — Casa del Rey",
                  recipient: "c…@example.invalid",
                  status: "accepted",
                  attempts: 1,
                  created_at: "2026-10-30T08:00:00Z",
                },
                {
                  id: 2,
                  subject: "Tu inscripción",
                  recipient: "c…@example.invalid",
                  status: "uncertain",
                  attempts: 1,
                  last_error: "delivery_unknown",
                  created_at: "2026-10-30T08:00:00Z",
                },
              ],
              meta: { total: 2 },
            },
          }
        : undefined,
  );
  await page.goto("/admin/emails");
  await expect(
    page.getByRole("heading", { name: "Falta conectar Brevo" }),
  ).toBeVisible();
  await expect(
    page.getByText("Aceptado por Brevo · Intentos: 1", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Comprueba el registro en Brevo antes de reenviar para evitar duplicados.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reintentar", exact: true }),
  ).toHaveCount(0);
  await noOverflow(page);
});

test("cash donation needs an explicit receipt confirmation and keeps admin history responsive", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() =>
    localStorage.setItem(
      "token",
      [
        "eyJhbGciOiJIUzI1NiJ9",
        btoa(
          JSON.stringify({
            user_id: 999,
            name: "Controlled admin",
            role: "admin",
            exp: 2000000000,
          }),
        ),
        "fixture",
      ].join("."),
    ),
  );
  const writes = [];
  let received = false;
  await isolate(page, (path, request) => {
    if (path === "/admin/donations")
      return {
        body: {
          data: [
            {
              ID: 88,
              name: "Donante controlado",
              email: "controlled@example.invalid",
              donation_purpose: "community",
              amount: 50,
              currency: "GTQ",
              payment_method: "presencial",
              is_successful: received,
              CreatedAt: "2026-10-30T08:00:00Z",
            },
          ],
          meta: { total: 1, pages: 1, page: 1 },
        },
      };
    if (path === "/admin/donations/88/cash") {
      writes.push(request.postDataJSON());
      received = request.postDataJSON().received;
      return { body: { is_successful: received } };
    }
  });
  await page.goto("/admin/donations");
  await page
    .getByRole("button", { name: "Confirmar recepción", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Recepción de donación" });
  expect(writes).toHaveLength(0);
  await dialog
    .getByRole("button", { name: "Sí, el aporte fue recibido", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Volver a pendiente", exact: true }),
  ).toBeVisible();
  expect(writes).toEqual([{ received: true }]);
  await noOverflow(page);
});

test("a failed destinations request never shows invented donation purposes", async ({
  page,
}) => {
  await isolate(page, (path) =>
    path === "/donation-purposes"
      ? { status: 503, body: { error: "Unavailable" } }
      : undefined,
  );
  await page.goto("/donate");
  await expect(page.getByRole("alert")).toContainText(
    "No se pudieron cargar los destinos",
  );
  await expect(
    page.getByRole("button", { name: "Reintentar", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Q100", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Fondo General", { exact: true })).toHaveCount(0);
});
