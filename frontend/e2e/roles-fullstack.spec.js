// Real login, real API, real PostgreSQL. The runner only exposes a disposable
// loopback stack; these mutations must never target the shared live database.
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { localAuthToken, localMailLinks } from "./fixtures/local-database";

const enabled = process.env.CDR_LOCAL_E2E === "1";
const API = `${process.env.PW_API_URL || ""}/api/v1`;
const accounts = enabled
  ? JSON.parse(readFileSync(process.env.E2E_QA_USERS_FILE, "utf8"))
  : [];
test.skip(
  !enabled,
  "Run through ops/test_fullstack.py with disposable accounts",
);
test.use({ trace: "off", video: "off" });
test.beforeAll(() => {
  for (const url of [process.env.PW_API_URL, process.env.PW_BASE_URL])
    expect(new URL(url).hostname).toBe("127.0.0.1");
});
const publicRoutes = [
  "/",
  "/about",
  "/celulas",
  "/volunteering",
  "/events",
  "/gallery",
  "/blog",
  "/conectate",
  "/prayer",
  "/donate",
  "/comprobante",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/reset-password",
  "/payment-success",
  "/no-existe",
];
const adminRoutes = [
  "",
  "users",
  "blog",
  "events",
  "petitions",
  "volunteers",
  "cell-reports",
  "boletas",
  "social",
  "announcements",
  "gallery",
  "faqs",
  "leaders",
  "cells",
  "cell-categories",
  "volunteer-areas",
  "donation-purposes",
  "activity-log",
  "receipts",
  "donations",
  "emails",
  "hero",
  "site-photos",
  "settings",
  "connect-cards",
  "support",
  "profile",
].map((path) => `/admin/${path}`);
const leaderRoutes = [
  "",
  "reports",
  "boletas",
  "volunteers",
  "cell-directory",
  "connect-cards",
  "events",
  "my-cell",
  "my-directory",
  "support",
  "profile",
].map((path) => `/leader/${path}`);
async function login(page, role = "admin") {
  const account = accounts.find((item) => item.role === role);
  expect(account).toBeTruthy();
  await page.goto("/login");
  await page.locator("input[type=email]").fill(account.email);
  await page.locator("input[type=password]").fill(account.password);
  // Respect the real shared limiter when many role changes run in seconds.
  let status;
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = page.waitForResponse(
      (item) =>
        item.url() === `${API}/auth/login` &&
        item.request().method() === "POST",
    );
    await page.getByRole("button", { name: /ingresar/i }).click();
    status = (await response).status();
    if (status !== 429) break;
    await page.waitForTimeout(1100);
  }
  expect(status).toBe(200);
  await expect(page).not.toHaveURL(/\/login$/);
}
async function headers(page) {
  return {
    Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem("token"))}`,
  };
}
async function visit(page, route) {
  await page.goto(route);
  await expect(page.locator("main")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByText(/Unexpected Application Error|Algo salió mal/),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    `horizontal overflow: ${route}`,
  ).toBe(true);
}
for (const width of [390, 1440])
  for (const role of ["admin", "leader", "member", "volunteer"])
    test(`${role} navigates every permitted module at ${width}px`, async ({
      page,
    }) => {
      test.setTimeout(300000);
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      const errors = [];
      const failed = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("response", (response) => {
        if (
          response.url().startsWith(API) &&
          response.status() >= 400 &&
          !(
            response.status() === 404 &&
            response.url().startsWith(`${API}/leader/my-cell`)
          )
        )
          failed.push(
            `${response.status()} ${new URL(response.url()).pathname}`,
          );
      });
      await login(page, role);
      const routes =
        role === "admin"
          ? adminRoutes
          : role === "leader"
            ? leaderRoutes
            : role === "volunteer"
              ? ["/volunteer/dashboard", "/profile"]
              : ["/profile"];
      for (const route of [...routes, ...publicRoutes])
        await test.step(route, () => visit(page, route));
      expect(errors).toEqual([]);
      expect([...new Set(failed)]).toEqual([]);
    });
test("actual role barriers protect every administrative resource and private support", async ({
  page,
}) => {
  test.setTimeout(120000);
  for (const role of ["leader", "member", "volunteer"]) {
    await login(page, role);
    const auth = await headers(page);
    for (const path of [
      "/admin/users",
      "/admin/kpis",
      "/admin/settings",
      "/admin/receipts",
      "/admin/email/messages",
    ])
      expect(
        (await page.request.get(API + path, { headers: auth })).status(),
        `${role} ${path}`,
      ).toBe(403);
    if (role !== "leader")
      for (const path of [
        "/leader/kpis",
        "/leader/cell-directory",
        "/support/tickets",
      ])
        expect(
          (await page.request.get(API + path, { headers: auth })).status(),
          `${role} ${path}`,
        ).toBe(403);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/$/);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
  for (const path of ["/admin/users", "/leader/kpis", "/support/tickets"])
    expect((await page.request.get(API + path)).status()).toBe(401);
});

const catalogs = [
  {
    route: "cell-categories",
    api: "/admin/cell-categories",
    feed: "/cell-categories",
    add: "Nueva categoría",
    save: "Guardar categoría",
    primary: "Nombre *",
    fields: [
      ["Nombre *", "Categoría editable E2E"],
      ["Descripción", "Descripción administrada de la categoría."],
    ],
  },
  {
    route: "volunteer-areas",
    api: "/admin/volunteer-areas",
    feed: "/volunteer-areas",
    add: "Nuevo departamento",
    save: "Crear departamento",
    primary: "Título *",
    fields: [
      ["Value (clave estable) *", "e2e_area"],
      ["Título *", "Departamento editable E2E"],
      ["Descripción", "Servicio y acompañamiento comunitario."],
    ],
  },
  {
    route: "donation-purposes",
    api: "/admin/donation-purposes",
    feed: "/donation-purposes",
    add: "Nuevo destino",
    save: "Crear destino",
    primary: /^Título/,
    fields: [
      [/^Value \(clave estable\)/, "e2e_destino"],
      [/^Título/, "Destino editable E2E"],
      ["Descripción", "Destino administrado de verificación."],
    ],
  },
  {
    route: "faqs",
    api: "/admin/faqs/",
    feed: "/faqs/",
    add: "Nueva FAQ",
    save: "Agregar FAQ",
    primary: "Pregunta *",
    fields: [
      ["Pregunta *", "¿Pregunta editable E2E?"],
      ["Respuesta *", "Respuesta administrada desde el panel."],
    ],
  },
  {
    route: "leaders",
    api: "/admin/leader-directory",
    feed: "/leaders",
    add: "Nuevo líder",
    save: "Agregar líder",
    primary: /^Nombre/,
    fields: [
      [/^Nombre/, "Directorio editable E2E"],
      ["Área / célula", "Servicio de comunidad"],
      [
        "Dirección (privada, nunca pública)",
        "Ubicación privada de verificación",
      ],
    ],
  },
  {
    route: "announcements",
    api: "/admin/announcements/",
    feed: "/announcements",
    add: "Nuevo anuncio",
    save: "Crear anuncio",
    primary: /^Título/,
    fields: [
      [/^Título/, "Anuncio editable E2E"],
      [/^Contenido/, "Información de comunidad administrada."],
    ],
  },
  {
    route: "gallery",
    api: "/admin/gallery/",
    feed: "/gallery/",
    add: "Agregar foto",
    save: "Agregar foto",
    primary: "Título",
    fields: [
      ["Álbum", "Álbum editable E2E"],
      ["Título", "Fotografía editable E2E"],
      [
        /^URL de la foto/,
        () => `${process.env.PW_BASE_URL}/images/backgrounds/congregacion.webp`,
      ],
    ],
  },
];
function catalogRow(page, title) {
  return page
    .getByText(title, { exact: true })
    .locator('xpath=ancestor::*[.//button[normalize-space()="Editar"]][1]');
}
for (const catalog of catalogs)
  test(`administrator creates, edits and removes ${catalog.route} through the UI`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await login(page);
    await page.goto(`/admin/${catalog.route}`);
    await page.getByRole("button", { name: catalog.add, exact: true }).click();
    const createForm = page.locator("form").filter({
      has: page.getByRole("button", { name: catalog.save, exact: true }),
    });
    for (const [label, value] of catalog.fields)
      await createForm
        .getByLabel(label, { exact: typeof label === "string" })
        .fill(typeof value === "function" ? value() : value);
    const title = catalog.fields.find(
      ([label]) => String(label) === String(catalog.primary),
    )?.[1];
    expect(typeof title).toBe("string");
    const created = page.waitForResponse(
      (response) =>
        response.url() === API + catalog.api &&
        response.request().method() === "POST",
    );
    await page
      .locator("form")
      .getByRole("button", { name: catalog.save, exact: true })
      .click();
    const response = await created;
    expect(response.ok(), await response.text()).toBe(true);
    const record = await response.json();
    const id = record.ID || record.id;
    let row = catalogRow(page, title);
    await expect(row).toBeVisible();
    await row.hover();
    await row.getByRole("button", { name: "Editar", exact: true }).click();
    const updated = title + " actualizado";
    await page
      .getByLabel(catalog.primary, {
        exact: typeof catalog.primary === "string",
      })
      .fill(updated);
    const put = page.waitForResponse(
      (response) =>
        response.url().replace(/\/$/, "") ===
          `${API}${catalog.api.replace(/\/$/, "")}/${id}` &&
        response.request().method() === "PUT",
    );
    await page
      .locator("form")
      .getByRole("button", {
        name: /^(Actualizar|Guardar cambios|Guardar categoría)$/,
      })
      .click();
    expect((await put).ok()).toBe(true);
    row = catalogRow(page, updated);
    await expect(row).toBeVisible();
    const publicResponse = await page.request.get(API + catalog.feed);
    expect(publicResponse.ok()).toBe(true);
    const publicText = await publicResponse.text();
    expect(publicText).toContain(updated);
    if (catalog.route === "leaders")
      expect(publicText).not.toContain("Ubicación privada de verificación");
    if (catalog.route === "cell-categories") {
      await row.getByRole("button", { name: "Ocultar", exact: true }).click();
      await expect(row.getByText("Oculta", { exact: true })).toBeVisible();
      expect(
        await (await page.request.get(API + catalog.feed)).text(),
      ).not.toContain(updated);
      await row.getByRole("button", { name: "Mostrar", exact: true }).click();
      await expect(row.getByText("Publicada", { exact: true })).toBeVisible();
      return;
    }
    await row.hover();
    page.once("dialog", (dialog) => dialog.accept());
    const deletion = page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        response.url().endsWith("/" + id),
    );
    await row.getByRole("button", { name: "Eliminar", exact: true }).click();
    expect((await deletion).ok()).toBe(true);
    await expect(page.getByText(updated, { exact: true })).toHaveCount(0);
    expect(
      await (await page.request.get(API + catalog.feed)).text(),
    ).not.toContain(updated);
  });

test("member maintains goals and cannot register or promote an account publicly", async ({
  page,
}) => {
  await login(page, "member");
  await page.goto("/profile");
  await page
    .getByPlaceholder("Nueva meta...")
    .fill("Meta de acompañamiento E2E");
  await page.getByRole("button", { name: "Agregar meta", exact: true }).click();
  const goal = page
    .getByText("Meta de acompañamiento E2E", { exact: true })
    .locator('xpath=ancestor::*[.//button[@aria-label="Eliminar meta"]][1]');
  await expect(goal).toBeVisible();
  await goal
    .getByRole("button", { name: "Marcar como completada", exact: true })
    .click();
  await expect(
    goal.getByRole("button", { name: "Marcar como pendiente", exact: true }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await goal
    .getByRole("button", { name: "Eliminar meta", exact: true })
    .click();
  await expect(
    page.getByText("Meta de acompañamiento E2E", { exact: true }),
  ).toHaveCount(0);
  const auth = await headers(page);
  expect(
    (
      await page.request.post(API + "/auth/register", {
        data: {
          name: "Inyección de rol",
          email: "blocked@example.invalid",
          password: "ThisIsNotALivePassword",
          role: "admin",
        },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await page.request.post(API + "/admin/users", {
        headers: auth,
        data: { name: "Escalación", role: "admin" },
      })
    ).status(),
  ).toBe(403);
});

test("leader updates only their own cell, submits a report and receives administrator approval", async ({
  page,
}) => {
  test.setTimeout(90000);
  await login(page, "leader");
  const leaderAuth = await headers(page);
  await page.goto("/leader/my-cell");
  await page
    .getByLabel("Día de reunión", { exact: true })
    .fill("Sábados alternos E2E");
  await page.getByLabel("Hora", { exact: true }).fill("18:30");
  const updated = page.waitForResponse(
    (r) =>
      r.url() === API + "/leader/my-cell" && r.request().method() === "PUT",
  );
  await page
    .getByRole("button", { name: "Guardar cambios", exact: true })
    .click();
  expect((await updated).ok()).toBe(true);
  const cells = await (await page.request.get(API + "/cells")).json();
  expect(cells.find((cell) => cell.code === "J1").day).toBe(
    "Sábados alternos E2E",
  );
  expect(cells.find((cell) => cell.code === "J2").day).toBe("Miércoles");
  await page.goto("/leader/reports");
  await page
    .getByRole("button", { name: "Nuevo reporte", exact: true })
    .click();
  await page
    .getByLabel("Nombre de la célula *", { exact: true })
    .fill("Comunidad E2E");
  await page
    .getByLabel("Fecha de la reunión *", { exact: true })
    .fill("2026-11-02");
  await page
    .getByLabel("Tema de la reunión", { exact: true })
    .fill("Reporte de convivencia E2E");
  await page.getByLabel("Total asistentes", { exact: true }).fill("12");
  const created = page.waitForResponse(
    (r) =>
      r.url() === API + "/admin/cell-reports" &&
      r.request().method() === "POST",
  );
  await page
    .locator("form")
    .getByRole("button", { name: /enviar reporte/i })
    .click();
  const response = await created;
  expect(response.status()).toBe(201);
  const report = await response.json();
  report.ID = report.ID || report.id;
  await login(page, "other_leader");
  const otherAuth = await headers(page);
  expect(
    await (
      await page.request.get(API + "/admin/cell-reports", {
        headers: otherAuth,
      })
    ).text(),
  ).not.toContain("Reporte de convivencia E2E");
  expect(
    (
      await page.request.put(`${API}/admin/cell-reports/${report.ID}/approve`, {
        headers: leaderAuth,
        data: { status: "aprobado" },
      })
    ).status(),
  ).toBe(403);
  await login(page);
  await page.goto("/admin/cell-reports");
  await page.getByRole("button", { name: /Comunidad E2E.*Ver más/ }).click();
  const row = page
    .getByText("Reporte de convivencia E2E", { exact: true })
    .locator(
      'xpath=ancestor::*[.//button[contains(normalize-space(),"Aprobar")]][1]',
    );
  await expect(row).toBeVisible();
  const approval = page.waitForResponse(
    (r) =>
      r.url() === `${API}/admin/cell-reports/${report.ID}/approve` &&
      r.request().method() === "PUT",
  );
  await row.getByRole("button", { name: "Aprobar", exact: true }).click();
  expect((await approval).ok()).toBe(true);
  const own = await (
    await page.request.get(API + "/admin/cell-reports", { headers: leaderAuth })
  ).json();
  expect((own.data || own).find((item) => item.ID === report.ID).status).toBe(
    "aprobado",
  );
});

for (const role of ["admin", "leader"])
  test(`${role} creates a member account with verification and password recovery`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.waitForTimeout(5500);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await login(page, role);
    const email = `created-${role}-${randomBytes(4).toString("hex")}@example.invalid`;
    const password = randomBytes(24).toString("base64url");
    await page.goto(role === "admin" ? "/admin/users" : "/leader/boletas");
    await page
      .getByRole("button", { name: "Crear cuenta", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Crear cuenta de usuario",
      exact: true,
    });
    await dialog
      .getByLabel("Nombre completo", { exact: true })
      .fill("Miembro creado por " + role);
    await dialog
      .getByLabel("Correo de la persona", { exact: true })
      .fill(email);
    await dialog
      .getByLabel("Contraseña inicial", { exact: true })
      .fill(password);
    if (role === "leader")
      await expect(dialog.getByLabel("Rol de la cuenta")).toHaveCount(0);
    const created = page.waitForResponse(
      (r) =>
        r.url() === API + "/admin/users" && r.request().method() === "POST",
    );
    await dialog
      .getByRole("button", { name: "Crear cuenta", exact: true })
      .click();
    expect((await created).status()).toBe(201);
    await expect(dialog.getByRole("status")).toContainText(
      "deberá verificarlo",
    );
    expect(
      (
        await page.request.post(API + "/auth/login", {
          data: { email, password },
        })
      ).status(),
    ).toBe(403);
    const verification = localAuthToken(email, "verification_token");
    expect(verification.length).toBeGreaterThan(20);
    await page.goto("/verify-email?token=" + encodeURIComponent(verification));
    await expect(
      page.getByRole("heading", { name: "¡Correo verificado!", exact: true }),
    ).toBeVisible();
    await page.goto("/login");
    await page.locator("input[type=email]").fill(email);
    await page.locator("input[type=password]").fill(password);
    await page.getByRole("button", { name: /ingresar/i }).click();
    await expect(page).not.toHaveURL(/\/login$/);
    await page.goto("/profile");
    await expect(
      page.getByText("Miembro creado por " + role, { exact: true }),
    ).toBeVisible();
    await page.goto("/forgot-password");
    await page.getByLabel("Correo electrónico", { exact: true }).fill(email);
    await page
      .getByRole("button", { name: "Enviar enlace", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Correo enviado", exact: true }),
    ).toBeVisible();
    const reset = localAuthToken(email, "reset_token");
    expect(reset.length).toBeGreaterThan(20);
    const newPassword = randomBytes(24).toString("base64url");
    await page.goto("/reset-password?token=" + encodeURIComponent(reset));
    await page
      .getByLabel("Nueva contraseña", { exact: true })
      .fill(newPassword);
    await page
      .getByLabel("Confirmar contraseña", { exact: true })
      .fill(newPassword);
    await page
      .getByRole("button", { name: "Guardar contraseña", exact: true })
      .click();
    await expect(page).toHaveURL(/\/login$/);
    // Account creation, verification, login, recovery and reset run faster than
    // a person; allow the unchanged shared authentication limiter to refill.
    await page.waitForTimeout(2100);
    await page.locator("input[type=email]").fill(email);
    await page.locator("input[type=password]").fill(newPassword);
    await page.getByRole("button", { name: /ingresar/i }).click();
    await expect(page).not.toHaveURL(/\/login$/);
    expect(
      (
        await page.request.post(API + "/auth/reset-password", {
          data: { token: reset, newPassword: password },
        })
      ).status(),
    ).toBe(400);
  });

test("leader and administrator follow a private support case with actual image storage", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page, "leader");
  const ownerAuth = await headers(page);
  await page.goto("/leader/support");
  await page.getByRole("button", { name: "Nuevo caso", exact: true }).click();
  const form = page.getByRole("dialog", { name: "Nuevo caso de soporte" });
  await form
    .getByLabel("Asunto", { exact: true })
    .fill("Acompañamiento privado E2E");
  await form
    .getByLabel("Módulo afectado", { exact: true })
    .selectOption("celulas");
  await form
    .getByLabel("Descripción del problema", { exact: true })
    .fill("Necesito acompañamiento para completar el reporte de mi célula.");
  await form
    .getByLabel("Capturas del problema", { exact: true })
    .setInputFiles("e2e/assets/test-cover.jpg");
  const created = page.waitForResponse(
    (r) =>
      r.url() === API + "/support/tickets" && r.request().method() === "POST",
  );
  await form.getByRole("button", { name: "Enviar caso", exact: true }).click();
  const response = await created;
  expect(response.status()).toBe(201);
  const ticket = await response.json();
  const casePath = `/support/tickets/${ticket.ID}`;
  let detail = page.getByRole("dialog", {
    name: `Caso de soporte SUP-${String(ticket.ID).padStart(5, "0")}`,
  });
  await expect(
    detail.getByText("test-cover.jpg", { exact: true }),
  ).toBeVisible();
  await detail.getByRole("button", { name: /test-cover.jpg/ }).click();
  const capture = page.getByRole("dialog", { name: "Captura: test-cover.jpg" });
  await expect(capture.getByRole("img")).toBeVisible();
  await capture.getByRole("button", { name: "Cerrar", exact: true }).click();
  const info = await (
    await page.request.get(API + casePath, { headers: ownerAuth })
  ).json();
  expect(info.attachments).toHaveLength(1);
  const fileURL = `${API}${casePath}/attachments/${info.attachments[0].ID}/file`;
  expect((await page.request.get(fileURL)).status()).toBe(401);
  await detail.getByRole("button", { name: "Cerrar", exact: true }).click();
  await login(page, "other_leader");
  const otherAuth = await headers(page);
  expect(
    (await page.request.get(API + casePath, { headers: otherAuth })).status(),
  ).toBe(404);
  expect(
    (await page.request.get(fileURL, { headers: otherAuth })).status(),
  ).toBe(404);
  await login(page);
  await page.goto(`/admin/support?case=${ticket.ID}`);
  detail = page.getByRole("dialog").last();
  await detail
    .getByLabel("Tu respuesta", { exact: true })
    .fill("Revisa la fecha y vuelve a enviar el formulario.");
  await detail
    .getByRole("button", { name: "Enviar respuesta", exact: true })
    .click();
  await expect(
    detail.getByText("Revisa la fecha y vuelve a enviar el formulario.", {
      exact: true,
    }),
  ).toBeVisible();
  await detail
    .getByLabel("Estado del caso", { exact: true })
    .selectOption("resuelto");
  await detail
    .getByLabel("Solución aplicada", { exact: true })
    .fill("Se revisó el formulario y se verificó el guardado.");
  await detail
    .getByRole("button", { name: "Guardar estado", exact: true })
    .click();
  await expect(
    detail.getByRole("button", { name: "Reabrir caso", exact: true }),
  ).toBeVisible();
  await detail.getByRole("button", { name: "Cerrar", exact: true }).click();
  await login(page, "leader");
  await page.goto(`/leader/support?case=${ticket.ID}`);
  detail = page.getByRole("dialog").last();
  await detail
    .getByRole("button", { name: "Reabrir caso", exact: true })
    .click();
  await expect(
    detail.getByLabel("Tu respuesta", { exact: true }),
  ).toBeVisible();
  expect(
    (await page.request.get(fileURL, { headers: ownerAuth })).headers()[
      "cache-control"
    ],
  ).toBe("private, no-store");
});

test("cash donations remain pending until receipt confirmation and corrections preserve history", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page, "member");
  await page.goto("/donate");
  const donation = page.getByRole("region", {
    name: "Formulario de donación",
    exact: true,
  });
  await donation
    .getByRole("button", { name: "Continuar", exact: true })
    .click();
  await donation.getByRole("button", { name: /^Ofrenda general/ }).click();
  await expect(
    donation.getByRole("button", { name: "Continuar", exact: true }),
  ).toHaveCount(1);
  await donation
    .getByRole("button", { name: "Continuar", exact: true })
    .click();
  await donation.getByRole("button", { name: /^En persona/ }).click();
  await expect(
    donation.getByRole("button", { name: "Continuar", exact: true }),
  ).toHaveCount(1);
  await donation
    .getByRole("button", { name: "Continuar", exact: true })
    .click();
  await donation
    .getByPlaceholder("Tu nombre", { exact: true })
    .fill("Aporte presencial E2E");
  await donation
    .getByPlaceholder("Para confirmación", { exact: true })
    .fill("cash-flow@example.invalid");
  const created = page.waitForResponse(
    (r) =>
      r.url() === API + "/donations/register" &&
      r.request().method() === "POST",
  );
  await donation
    .getByRole("button", { name: "Registrar donación", exact: true })
    .click();
  expect((await created).status()).toBe(201);
  await expect(
    donation.getByText("¡Gracias por sembrar!", { exact: true }),
  ).toBeVisible();
  await login(page);
  const auth = await headers(page);
  await page.goto("/admin/donations");
  await page
    .getByPlaceholder("Nombre o correo", { exact: true })
    .fill("Aporte presencial E2E");
  let row = page
    .getByText("Aporte presencial E2E", { exact: true })
    .locator(
      'xpath=ancestor::*[.//button[normalize-space()="Confirmar recepción"]][1]',
    );
  await expect(row).toBeVisible();
  await row
    .getByRole("button", { name: "Confirmar recepción", exact: true })
    .click();
  let dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "Sí, el aporte fue recibido", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  const data = await (
    await page.request.get(
      API + "/admin/donations?q=Aporte%20presencial%20E2E",
      { headers: auth },
    )
  ).json();
  const record = data.data[0];
  expect(record.is_successful).toBe(true);
  await page
    .getByRole("button", { name: "Volver a pendiente", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Motivo de la corrección", { exact: true })
    .fill("Corrección controlada del registro presencial.");
  await dialog
    .getByRole("button", { name: "Confirmar cambio a pendiente", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  const corrected = await (
    await page.request.get(
      API + "/admin/donations?q=Aporte%20presencial%20E2E",
      { headers: auth },
    )
  ).json();
  expect(corrected.data[0].is_successful).toBe(false);
  await page.goto(
    `/admin/activity-log?resource=donation&resource_id=${record.ID}`,
  );
  await expect(
    page.getByText("Corrección controlada del registro presencial.", {
      exact: false,
    }),
  ).toBeVisible();
});

test("bank receipt is private and rejection email allows an actual correction before approval", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page);
  const auth = await headers(page);
  await page.goto("/admin/settings");
  await page
    .getByRole("button", { name: "Depósitos y contacto", exact: true })
    .click();
  for (const [label, value] of [
    ["Banco", "Banco de simulación local"],
    ["Número de cuenta", "0000000000"],
    ["Tipo de cuenta", "Simulación"],
    ["A nombre de", "Sin operaciones bancarias reales"],
  ]) {
    const input = page.getByLabel(label, { exact: true });
    await input.fill(value);
    await input
      .locator("xpath=ancestor::form")
      .getByRole("button", { name: "Guardar", exact: true })
      .click();
    await expect(
      input
        .locator("xpath=ancestor::form")
        .getByRole("button", { name: "Guardar", exact: true }),
    ).toBeDisabled();
  }
  await page.goto("/comprobante");
  const form = page.getByRole("region", {
    name: "Envío de comprobante",
    exact: true,
  });
  await form
    .getByLabel("Nombre completo *", { exact: true })
    .fill("Comprobante privado E2E");
  await form
    .getByLabel("Correo electrónico *", { exact: true })
    .fill("receipt-flow@example.invalid");
  await form.getByLabel("Monto depositado (Q) *", { exact: true }).fill("75");
  const upload = page.waitForResponse(
    (r) =>
      r.url() === API + "/receipts/upload" && r.request().method() === "POST",
  );
  await form
    .getByLabel("Archivo del comprobante", { exact: true })
    .setInputFiles("e2e/assets/test-cover.jpg");
  expect((await upload).status()).toBe(201);
  const created = page.waitForResponse(
    (r) => r.url() === API + "/receipts" && r.request().method() === "POST",
  );
  await form
    .getByRole("button", { name: "Enviar comprobante", exact: true })
    .click();
  const response = await created;
  expect(response.status()).toBe(201);
  const saved = await response.json();
  const id = saved.id || saved.ID;
  await expect(
    form.getByRole("heading", { name: "Comprobante recibido", exact: true }),
  ).toBeVisible();
  const fileURL = `${API}/admin/receipts/${id}/file`;
  expect((await page.request.get(fileURL)).status()).toBe(401);
  expect((await page.request.get(fileURL, { headers: auth })).status()).toBe(
    200,
  );
  await page.goto("/admin/receipts");
  await page
    .getByText("Comprobante privado E2E", { exact: true })
    .locator('xpath=ancestor::*[.//button[normalize-space()="Verificar"]][1]')
    .getByRole("button", { name: "Verificar", exact: true })
    .click();
  let modal = page.getByRole("dialog").last();
  await modal.getByRole("button", { name: "Rechazar", exact: true }).click();
  await modal
    .getByLabel("Motivo del rechazo", { exact: true })
    .fill("La referencia debe verse completa.");
  await modal
    .getByRole("button", { name: "Rechazar comprobante", exact: true })
    .click();
  await modal
    .getByRole("button", { name: "Sí, rechazar", exact: true })
    .click();
  await expect(modal).toHaveCount(0);
  const correction = localMailLinks("receipt-flow@example.invalid").find(
    (link) =>
      new URL(link).pathname === "/comprobante" &&
      new URL(link).hash.startsWith("#token="),
  );
  expect(correction).toBeTruthy();
  await page.goto(correction);
  const corrected = page.getByRole("region", {
    name: "Corrección de comprobante",
    exact: true,
  });
  await expect(
    corrected.getByRole("heading", { name: "Volver a revisión", exact: true }),
  ).toBeVisible();
  await corrected
    .getByLabel("Archivo del comprobante", { exact: true })
    .setInputFiles("e2e/assets/test-cover.jpg");
  const resubmitted = page.waitForResponse(
    (r) =>
      r.url() === `${API}/receipts/${id}/resubmit` &&
      r.request().method() === "PUT",
  );
  await corrected
    .getByRole("button", { name: "Enviar corrección", exact: true })
    .click();
  expect((await resubmitted).ok()).toBe(true);
  await page.goto("/admin/receipts");
  await page
    .getByText("Comprobante privado E2E", { exact: true })
    .locator('xpath=ancestor::*[.//button[normalize-space()="Verificar"]][1]')
    .getByRole("button", { name: "Verificar", exact: true })
    .click();
  modal = page.getByRole("dialog").last();
  await modal
    .getByRole("button", { name: "Aprobar comprobante", exact: true })
    .click();
  await expect(modal).toHaveCount(0);
  const receipts = await (
    await page.request.get(API + "/admin/receipts", { headers: auth })
  ).json();
  expect(receipts.data.find((item) => item.ID === id).status).toBe(
    "verificado",
  );
  await page.goto("/admin/emails");
  await expect(
    page.getByRole("heading", { name: "Correos", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Falta conectar Brevo", exact: true }),
  ).toBeVisible();
});

test("cell application reaches only its assigned leader and progresses to integrated", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/celulas?tipo=J%C3%B3venes");
  const detail = page.getByRole("dialog").first();
  await detail.getByRole("tab", { name: "Información", exact: true }).click();
  await detail
    .getByRole("button", { name: /^Ver la célula Comunidad E2E/ })
    .click();
  await detail.getByRole("button", { name: /^Quiero unirme a / }).click();
  const form = page.getByRole("dialog").last();
  await form
    .getByLabel("Tu nombre *", { exact: true })
    .fill("Solicitud comunitaria E2E");
  await form
    .getByLabel("Teléfono o WhatsApp *", { exact: true })
    .fill("00000000");
  await form.getByRole("button", { name: "Continuar", exact: true }).click();
  const created = page.waitForResponse(
    (r) =>
      r.url() === API + "/connect-cards" && r.request().method() === "POST",
  );
  await form
    .getByRole("button", { name: "Confirmar y Enviar", exact: true })
    .click();
  expect((await created).status()).toBe(201);
  await expect(
    form.getByRole("heading", { name: "¡Solicitud enviada!", exact: true }),
  ).toBeVisible();
  await login(page, "other_leader");
  expect(
    await (
      await page.request.get(API + "/admin/connect-cards", {
        headers: await headers(page),
      })
    ).text(),
  ).not.toContain("Solicitud comunitaria E2E");
  await login(page, "leader");
  await page.goto("/leader/connect-cards");
  let row = page
    .getByText("Solicitud comunitaria E2E", { exact: true })
    .locator(
      'xpath=ancestor::*[.//button[contains(normalize-space(),"Marcar como")]][1]',
    );
  await expect(row.getByText("Comunidad E2E", { exact: true })).toBeVisible();
  await row
    .getByRole("button", { name: "Marcar como contactado", exact: true })
    .click();
  await row
    .getByRole("button", { name: "Marcar como integrado", exact: true })
    .click();
  const list = await (
    await page.request.get(API + "/admin/connect-cards", {
      headers: await headers(page),
    })
  ).json();
  expect(
    list.data.find((record) => record.name === "Solicitud comunitaria E2E")
      .status,
  ).toBe("integrado");
  await login(page);
  await page.goto("/admin/connect-cards");
  row = page
    .getByText("Solicitud comunitaria E2E", { exact: true })
    .locator('xpath=ancestor::*[.//button[normalize-space()="Eliminar"]][1]');
  await expect(row.getByText("Integrado", { exact: true })).toBeVisible();
});

test("volunteer application becomes an assigned verified account and a reviewed service report", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const email = `volunteer-flow-${randomBytes(4).toString("hex")}@example.invalid`;
  const password = randomBytes(24).toString("base64url");
  await page.goto("/volunteering");
  await page
    .getByRole("region", { name: "Departamentos de voluntariado", exact: true })
    .locator("button.liquid-glass")
    .first()
    .click();
  let modal = page.getByRole("dialog").last();
  await modal.getByRole("tab", { name: "Información", exact: true }).click();
  await modal.getByRole("button", { name: /^Aplicar a / }).click();
  modal = page.getByRole("dialog").last();
  await modal
    .getByLabel("Nombre completo *", { exact: true })
    .fill("Servidor incorporado E2E");
  await modal.getByLabel("Correo electrónico *", { exact: true }).fill(email);
  await modal.getByRole("button", { name: "Continuar", exact: true }).click();
  const registered = page.waitForResponse(
    (r) =>
      r.url() === API + "/volunteer/register" &&
      r.request().method() === "POST",
  );
  await modal
    .getByRole("button", { name: "Confirmar y Enviar", exact: true })
    .click();
  const response = await registered;
  expect(response.status()).toBe(201);
  const { id } = await response.json();
  await expect(
    modal.getByRole("heading", { name: "¡Inscripción recibida!", exact: true }),
  ).toBeVisible();
  await login(page);
  const adminAuth = await headers(page);
  const leaders = await (
    await page.request.get(API + "/admin/leaders", { headers: adminAuth })
  ).json();
  const leader = leaders.find((record) => record.name === "Líder E2E");
  await page.goto("/admin/volunteers");
  await page
    .getByLabel("Líder asignado a Servidor incorporado E2E", { exact: true })
    .selectOption(String(leader.id));
  await login(page, "other_leader");
  const otherAuth = await headers(page);
  expect(
    (
      await page.request.post(`${API}/admin/volunteers/${id}/create-user`, {
        headers: otherAuth,
        data: { password },
      })
    ).status(),
  ).toBe(403);
  await login(page, "leader");
  await page.goto("/leader/volunteers");
  const row = page
    .getByText("Servidor incorporado E2E", { exact: true })
    .locator(
      'xpath=ancestor::*[.//button[normalize-space()="Crear usuario"]][1]',
    );
  await row.getByRole("button", { name: "Crear usuario", exact: true }).click();
  modal = page.getByRole("dialog", { name: "Crear usuario voluntario" });
  await modal.getByLabel("Contraseña temporal", { exact: true }).fill(password);
  await modal
    .getByRole("button", { name: "Crear usuario", exact: true })
    .click();
  await expect(modal).toHaveCount(0);
  await page.waitForTimeout(2100);
  const token = localAuthToken(email, "verification_token");
  await page.goto("/verify-email?token=" + encodeURIComponent(token));
  await expect(
    page.getByRole("heading", { name: "¡Correo verificado!", exact: true }),
  ).toBeVisible();
  await page.goto("/login");
  await page.getByLabel("Correo electrónico", { exact: true }).fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page).toHaveURL(/\/volunteer\/dashboard$/);
  const volunteerAuth = await headers(page);
  await page
    .getByRole("button", { name: "Nuevo Reporte", exact: true })
    .click();
  modal = page.getByRole("dialog", { name: "Reporte de servicio" });
  await modal
    .getByLabel("Área de Servicio *", { exact: true })
    .fill("Alabanza");
  await modal
    .getByLabel("Fecha del Servicio *", { exact: true })
    .fill("2026-11-02");
  await modal
    .getByLabel("Notas o Testimonios", { exact: true })
    .fill("Servicio coordinado y documentado E2E.");
  const submitted = page.waitForResponse(
    (r) =>
      r.url() === API + "/volunteer/reports" && r.request().method() === "POST",
  );
  await modal
    .getByRole("button", { name: "Enviar Reporte", exact: true })
    .click();
  const reportResponse = await submitted;
  expect(reportResponse.status()).toBe(201);
  const report = await reportResponse.json();
  await expect(
    page.getByRole("article", { name: "Reporte de Servidor incorporado E2E" }),
  ).toContainText("Pendiente");
  expect(
    (
      await page.request.put(
        `${API}/admin/volunteer-reports/${report.id}/approve`,
        { headers: volunteerAuth, data: { status: "aprobado" } },
      )
    ).status(),
  ).toBe(403);
  await login(page);
  await page.goto("/admin/volunteers");
  await page
    .getByRole("button", { name: "Reportes de servicio", exact: true })
    .click();
  const review = page.getByRole("article", {
    name: "Reporte de Servidor incorporado E2E",
  });
  await review
    .getByRole("button", { name: "Aprobar reporte", exact: true })
    .click();
  await expect(review).toContainText("Aprobado");
  await page.screenshot({
    path: process.env.CDR_E2E_OUTPUT + "/voluntariado-reportes-390.png",
    fullPage: true,
  });
  const own = await (
    await page.request.get(API + "/volunteer/reports", {
      headers: volunteerAuth,
    })
  ).json();
  expect(own.data.find((item) => item.ID === report.id).status).toBe(
    "aprobado",
  );
});

test("editor publishes and updates a real article then removes it from the public feed", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page);
  await page.goto("/admin/blog");
  await page.getByRole("button", { name: "Nuevo post", exact: true }).click();
  await page
    .getByLabel("Título *", { exact: true })
    .fill("Mensaje administrado E2E");
  await page
    .getByLabel("Slug", { exact: true })
    .fill("mensaje-administrado-e2e");
  await page
    .getByLabel(/^Extracto/)
    .fill("Un contenido que se administra y publica desde el panel.");
  await page
    .locator("[contenteditable=true]")
    .fill("Contenido completo del mensaje administrado.");
  await page.getByLabel("Publicar inmediatamente", { exact: true }).check();
  const created = page.waitForResponse(
    (r) => r.url() === API + "/admin/blog/" && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  const response = await created;
  expect(response.status()).toBe(201);
  const { post } = await response.json();
  await page.goto("/blog/mensaje-administrado-e2e");
  await expect(
    page.getByRole("heading", {
      name: "Mensaje administrado E2E",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Contenido completo del mensaje administrado.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/admin/blog");
  let row = catalogRow(page, "Mensaje administrado E2E");
  await row.hover();
  await row.getByRole("button", { name: "Editar", exact: true }).click();
  await page
    .getByLabel("Título *", { exact: true })
    .fill("Mensaje actualizado E2E");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(
    page.getByText("Mensaje actualizado E2E", { exact: true }),
  ).toBeVisible();
  expect(
    await (
      await page.request.get(API + "/blog/mensaje-administrado-e2e")
    ).text(),
  ).toContain("Mensaje actualizado E2E");
  row = catalogRow(page, "Mensaje actualizado E2E");
  await row.hover();
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Eliminar", exact: true }).click();
  await expect(
    page.getByText("Mensaje actualizado E2E", { exact: true }),
  ).toHaveCount(0);
  expect(
    (await page.request.get(API + "/blog/mensaje-administrado-e2e")).status(),
  ).toBe(404);
  expect(post.ID || post.id).toBeGreaterThan(0);
});

test("hero and social settings publish administrator edits and image upload", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page);
  await page.goto("/admin/hero");
  await page.getByRole("button", { name: "Nuevo hero", exact: true }).click();
  await page
    .getByLabel("Título línea 1 *", { exact: true })
    .fill("Comunidad administrada");
  const upload = page.waitForResponse(
    (r) =>
      r.url().startsWith(API + "/upload") && r.request().method() === "POST",
  );
  await page
    .locator("input[type=file]")
    .setInputFiles("e2e/assets/test-cover.jpg");
  expect((await upload).status()).toBe(201);
  await page.getByRole("button", { name: "Crear hero", exact: true }).click();
  const row = catalogRow(page, "Comunidad administrada");
  await row.getByRole("button", { name: "Activar", exact: true }).click();
  await expect(row.getByText("Activo en sitio", { exact: true })).toBeVisible();
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Comunidad administrada", exact: true }),
  ).toBeVisible();
  await page.goto("/admin/social");
  await page
    .getByLabel("Título del apartado", { exact: true })
    .fill("Comunidad en nuestras redes");
  await page
    .getByLabel("Texto de presentación", { exact: true })
    .fill("Perfiles administrables sin publicaciones individuales.");
  await page
    .getByRole("button", { name: "Guardar presentación", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Guardar presentación", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Enlace del perfil de Instagram", { exact: true })
    .fill("https://www.instagram.com/comunidad_e2e/");
  await page
    .getByLabel("Descripción de Instagram", { exact: true })
    .fill("Conoce a nuestra comunidad.");
  await page
    .getByRole("button", { name: "Guardar Instagram", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Guardar Instagram", exact: true }),
  ).toBeDisabled();
  await page.goto("/about");
  await expect(
    page.getByRole("heading", {
      name: "Comunidad en nuestras redes",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator('a[href="https://www.instagram.com/comunidad_e2e/"]').first(),
  ).toBeVisible();
});

test("role-specific announcements leave the same-tab cache when signing out", async ({
  page,
}) => {
  await login(page);
  const auth = await headers(page);
  for (const target of ["leader", "admin"])
    expect(
      (
        await page.request.post(API + "/admin/announcements/", {
          headers: auth,
          data: {
            title: "Aviso privado para " + target,
            content: "Contenido reservado por rol.",
            role_target: target,
          },
        })
      ).ok(),
    ).toBe(true);
  await page.goto("/");
  await expect(
    page.getByText("Aviso privado para admin", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Aviso privado para leader", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "A Administrador", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Cerrar sesión", exact: true })
    .first()
    .click();
  await expect(
    page.getByText("Aviso privado para admin", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Aviso privado para leader", { exact: true }),
  ).toHaveCount(0);
});

test("administrator publishes, edits and hides an individual cell from the directory", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page);
  await page.goto("/admin/cells");
  await page.getByRole("button", { name: "Nueva célula", exact: true }).click();
  const modal = page.getByRole("dialog", { name: "Nueva célula", exact: true });
  await modal.getByLabel("Código *", { exact: true }).fill("J98");
  await modal
    .getByLabel("Nombre *", { exact: true })
    .fill("Comunidad publicada E2E");
  await modal.getByLabel("Tipo *", { exact: true }).selectOption("jovenes");
  await modal
    .getByLabel("Líder *", { exact: true })
    .selectOption({ label: "Líder E2E" });
  await modal.getByLabel("Día", { exact: true }).fill("Viernes");
  await modal.getByLabel("Hora", { exact: true }).fill("18:00");
  await modal
    .getByRole("button", { name: "Crear célula", exact: true })
    .click();
  await expect(modal).toHaveCount(0);
  let row = page.getByRole("article", {
    name: "Comunidad publicada E2E",
    exact: true,
  });
  await expect(row).toContainText("Publicada");
  expect(await (await page.request.get(API + "/cells")).text()).toContain(
    "Comunidad publicada E2E",
  );
  await row.getByRole("button", { name: "Editar", exact: true }).click();
  const edit = page.getByRole("dialog", { name: "Editar célula", exact: true });
  await edit
    .getByLabel("Nombre *", { exact: true })
    .fill("Comunidad actualizada E2E");
  await edit.getByRole("button", { name: "Actualizar", exact: true }).click();
  await expect(edit).toHaveCount(0);
  row = page.getByRole("article", {
    name: "Comunidad actualizada E2E",
    exact: true,
  });
  await row.getByRole("button", { name: "Ocultar", exact: true }).click();
  await expect(row).toContainText("Oculta");
  expect(await (await page.request.get(API + "/cells")).text()).not.toContain(
    "Comunidad actualizada E2E",
  );
});

test("leader maintains their public directory entry while private address stays private", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, "leader");
  await page.goto("/leader/my-directory");
  await page
    .getByLabel("Área / célula", { exact: true })
    .fill("Acompañamiento comunitario E2E");
  await page
    .getByLabel("Dirección (privada, solo para admin/líderes)", { exact: true })
    .fill("Dirección reservada E2E");
  const updated = page.waitForResponse(
    (r) =>
      r.url() === API + "/leader/my-directory-entry" &&
      r.request().method() === "PUT",
  );
  await page
    .getByRole("button", { name: "Guardar cambios", exact: true })
    .click();
  expect((await updated).ok()).toBe(true);
  const publicData = await (await page.request.get(API + "/leaders")).text();
  expect(publicData).toContain("Acompañamiento comunitario E2E");
  expect(publicData).not.toContain("Dirección reservada E2E");
});

test("leader registers a new-member form that other leaders cannot read or edit", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, "leader");
  await page.goto("/leader/boletas");
  await page.getByRole("button", { name: "Nueva boleta", exact: true }).click();
  const form = page.locator("form").filter({
    has: page.getByRole("button", { name: "Guardar boleta", exact: true }),
  });
  await form
    .getByLabel("Nombre*", { exact: true })
    .fill("Invitado acompañado E2E");
  await form
    .getByLabel("Notas", { exact: true })
    .fill("Seguimiento reservado para el equipo asignado.");
  const created = page.waitForResponse(
    (r) =>
      r.url() === API + "/admin/boletas" && r.request().method() === "POST",
  );
  await form
    .getByRole("button", { name: "Guardar boleta", exact: true })
    .click();
  const response = await created;
  expect(response.status()).toBe(201);
  const record = await response.json();
  await expect(
    page.getByText("Invitado acompañado E2E", { exact: true }),
  ).toBeVisible();
  await login(page, "other_leader");
  const auth = await headers(page);
  expect(
    await (
      await page.request.get(API + "/admin/boletas", { headers: auth })
    ).text(),
  ).not.toContain("Invitado acompañado E2E");
  expect(
    (
      await page.request.put(`${API}/admin/boletas/${record.ID}`, {
        headers: auth,
        data: { notes: "Cambio no permitido" },
      })
    ).status(),
  ).toBe(403);
  await login(page);
  await page.goto("/admin/boletas");
  const row = page
    .getByText("Invitado acompañado E2E", { exact: true })
    .locator('xpath=ancestor::*[.//button[normalize-space()="Eliminar"]][1]');
  await expect(row).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Eliminar", exact: true }).click();
  await expect(
    page.getByText("Invitado acompañado E2E", { exact: true }),
  ).toHaveCount(0);
});

test("leader edits their profile and password, invalidating the previous session", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, "leader");
  const oldAuth = await headers(page);
  const account = accounts.find((item) => item.role === "leader");
  const original = account.password;
  await page.goto("/leader/profile");
  await page
    .getByRole("button", { name: "Editar perfil", exact: true })
    .click();
  await page
    .getByLabel("Nombre", { exact: true })
    .fill("Líder con perfil actualizado");
  await page
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Guardar", exact: true }) })
    .getByRole("button", { name: "Guardar", exact: true })
    .click();
  await expect(
    page
      .locator("main")
      .getByText("Líder con perfil actualizado", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Cambiar contraseña", exact: true })
    .click();
  const form = page
    .locator("form")
    .filter({ has: page.getByLabel("Contraseña actual", { exact: true }) });
  account.password = randomBytes(24).toString("base64url");
  await form.getByLabel("Contraseña actual", { exact: true }).fill(original);
  await form
    .getByLabel("Nueva contraseña", { exact: true })
    .fill(account.password);
  await form
    .getByLabel("Confirmar nueva contraseña", { exact: true })
    .fill(account.password);
  await form
    .getByRole("button", { name: "Cambiar contraseña", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  expect(
    (
      await page.request.get(API + "/leader/kpis", { headers: oldAuth })
    ).status(),
  ).toBe(401);
  await login(page, "leader");
  await page.goto("/leader/profile");
  await page
    .getByRole("button", { name: "Editar perfil", exact: true })
    .click();
  await page.getByLabel("Nombre", { exact: true }).fill(account.name);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await page
    .getByRole("button", { name: "Cambiar contraseña", exact: true })
    .click();
  await page
    .getByLabel("Contraseña actual", { exact: true })
    .fill(account.password);
  await page.getByLabel("Nueva contraseña", { exact: true }).fill(original);
  await page
    .getByLabel("Confirmar nueva contraseña", { exact: true })
    .fill(original);
  await page
    .locator("form")
    .getByRole("button", { name: "Cambiar contraseña", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  account.password = original;
});

test("administrative lists reach records after the first page and filters return to page one", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  const auth = await headers(page);
  for (let index = 0; index < 22; index++)
    expect(
      (
        await page.request.post(API + "/admin/boletas", {
          headers: auth,
          data: {
            date: "2026-11-02",
            guest_name: `Registro paginado E2E ${String(index).padStart(2, "0")}`,
            category: "nuevo",
          },
        })
      ).status(),
    ).toBe(201);
  await page.goto("/admin/boletas");
  await expect(
    page.getByRole("button", { name: "Siguiente", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect(
    page.getByText("Registro paginado E2E 00", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Todas", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Anterior", exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
});

test("user search and role changes operate beyond the first page and revoke the old session", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, "member");
  const memberAuth = await headers(page);
  await login(page);
  const adminAuth = await headers(page);
  const password = randomBytes(24).toString("base64url");
  for (let index = 0; index < 21; index++)
    expect(
      (
        await page.request.post(API + "/admin/users", {
          headers: adminAuth,
          data: {
            name: `Miembro paginado E2E ${String(index).padStart(2, "0")}`,
            email: `paged-${index}-${randomBytes(4).toString("hex")}@example.invalid`,
            password,
            role: "member",
          },
        })
      ).status(),
    ).toBe(201);
  await page.goto("/admin/users");
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect(
    page.getByText("Miembro paginado E2E 00", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Buscar usuarios", { exact: true }).fill("Miembro E2E");
  await expect(
    page.getByLabel("Rol de Miembro E2E", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Siguiente", exact: true }),
  ).toHaveCount(0);
  await page
    .getByLabel("Rol de Miembro E2E", { exact: true })
    .selectOption("leader");
  await expect(
    page.getByLabel("Rol de Miembro E2E", { exact: true }),
  ).toHaveValue("leader");
  expect(
    (
      await page.request.get(API + "/profile/goals", { headers: memberAuth })
    ).status(),
  ).toBe(401);
  const member = accounts.find((account) => account.role === "member");
  await page
    .getByLabel("Rol de Miembro E2E", { exact: true })
    .selectOption("member");
  await expect(
    page.getByLabel("Rol de Miembro E2E", { exact: true }),
  ).toHaveValue("member");
  await login(page, "member");
  await expect(page).toHaveURL(/\/profile$/);
  expect(member.email).toContain("@example.invalid");
});

test("compact public connection form reaches administration and its assigned leader", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/conectate");
  const form = page.getByRole("form", { name: "Formulario de conexión" });
  await form
    .getByLabel("Nombre *", { exact: true })
    .fill("Conexión directa E2E");
  await form.getByLabel("Teléfono *", { exact: true }).fill("00000000");
  await form
    .getByLabel("¿Qué te trae por aquí? *", { exact: true })
    .selectOption("primera_vez");
  const created = page.waitForResponse(
    (response) =>
      response.url() === API + "/connect-cards" &&
      response.request().method() === "POST",
  );
  await form.getByRole("button", { name: "Enviar", exact: true }).click();
  expect((await created).status()).toBe(201);
  await expect(
    page.getByRole("heading", { name: "Ya recibimos tus datos.", exact: true }),
  ).toBeVisible();
  await login(page);
  await page.goto("/admin/connect-cards");
  const field = page.getByLabel("Líder asignado a Conexión directa E2E", {
    exact: true,
  });
  const assignment = page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      response.url().includes("/admin/connect-cards/"),
  );
  await field.selectOption({ label: "Líder E2E" });
  expect((await assignment).ok()).toBe(true);
  await login(page, "leader");
  await page.goto("/leader/connect-cards");
  const row = page
    .getByText("Conexión directa E2E", { exact: true })
    .locator(
      'xpath=ancestor::*[.//button[normalize-space()="Marcar como contactado"]][1]',
    );
  await row
    .getByRole("button", { name: "Marcar como contactado", exact: true })
    .click();
  await expect(
    page.getByText("Conexión directa E2E", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("button", { name: "Marcar como integrado", exact: true })
      .last(),
  ).toBeVisible();
});
