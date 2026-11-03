import { test, expect } from "@playwright/test";
const photo = "/images/backgrounds/congregacion.webp";
const hero = (ID, title, image = photo) => ({
  ID,
  title_line_1: title,
  background_image_url: image,
  cta_primary_text: "Conéctate",
  cta_primary_url: "/conectate",
});
async function isolate(page, heroes, events = []) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes("/api/v1")) {
      const path = url.pathname.split("/api/v1")[1];
      const data =
        path === "/hero/active"
          ? heroes
          : path === "/events/"
            ? events
            : ["/settings", "/site-photos"].includes(path)
              ? {}
              : [];
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(data),
      });
    }
    if (!["localhost", "127.0.0.1"].includes(url.hostname))
      return route.abort();
    return route.continue();
  });
}
for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
  { width: 844, height: 390 },
])
  test(`home has one clear action and usable photographic navigation at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await isolate(page, [
      hero(1, "Una comunidad que camina junta"),
      hero(2, "Encuentra tu lugar en la comunidad"),
    ]);
    await page.goto("/");
    const scene = page.getByRole("region", {
      name: "Portadas de inicio",
      exact: true,
    });
    await expect(
      scene.getByRole("heading", {
        name: "Una comunidad que camina junta",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      scene.getByRole("link", { name: "Conéctate", exact: true }),
    ).toHaveCount(1);
    const next = scene.getByRole("button", { name: /^Siguiente/ });
    await next.click();
    await expect(
      scene.getByRole("heading", {
        name: "Encuentra tu lugar en la comunidad",
        exact: true,
      }),
    ).toBeVisible();
    await next.press("ArrowLeft");
    await expect(
      scene.getByRole("heading", {
        name: "Una comunidad que camina junta",
        exact: true,
      }),
    ).toBeVisible();
    expect((await next.boundingBox()).height).toBeGreaterThanOrEqual(44);
    const action = scene.getByRole("link", { name: "Conéctate", exact: true });
    await action.scrollIntoViewIfNeeded();
    const box = await action.boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

test("hero holds the loaded scene while the next photo loads, without automatic movement", async ({
  page,
}) => {
  await isolate(page, [
    hero(1, "Primera portada administrada"),
    hero(2, "Segunda portada administrada", "/fixture/slow-scene.webp"),
  ]);
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/fixture/slow-scene.webp", async (route) => {
    await gate;
    await route.fulfill({
      path: "public/images/backgrounds/comunidad-templo.webp",
      contentType: "image/webp",
    });
  });
  await page.clock.install();
  await page.goto("/");
  const scene = page.getByRole("region", {
    name: "Portadas de inicio",
    exact: true,
  });
  await expect(
    scene.getByRole("heading", {
      name: "Primera portada administrada",
      exact: true,
    }),
  ).toBeVisible();
  await page.clock.fastForward(9000);
  await expect(
    scene.getByRole("heading", {
      name: "Primera portada administrada",
      exact: true,
    }),
  ).toBeVisible();
  await scene.getByRole("button", { name: /^Siguiente/ }).click();
  await expect(
    scene.getByRole("heading", {
      name: "Primera portada administrada",
      exact: true,
    }),
  ).toBeVisible();
  release();
  await expect(
    scene.getByRole("heading", {
      name: "Segunda portada administrada",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page
      .locator("#inicio")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
});

test("hero opens the actual selected event and omits an empty duplicate action card", async ({
  page,
}) => {
  await isolate(
    page,
    [hero(1, "Portada administrada")],
    [
      {
        ID: 42,
        title: "Encuentro publicado",
        date: "2099-12-01",
        cover_image: photo,
        is_active: true,
      },
    ],
  );
  await page.goto("/");
  const scene = page.getByRole("region", {
    name: "Portadas de inicio",
    exact: true,
  });
  await scene.getByRole("button", { name: /^Siguiente/ }).click();
  await expect(
    scene.getByRole("link", { name: "Reservar mi lugar", exact: true }),
  ).toHaveAttribute("href", "/events?id=42");
  await expect(
    page.getByRole("complementary", { name: "Próximo encuentro" }),
  ).toHaveCount(0);
});

test("mobile account forms fit below navigation and keep readable input size", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await isolate(page, []);
  await page.goto("/login");
  const input = page.getByLabel("Correo electrónico", { exact: true });
  await expect(input).toBeVisible();
  expect(
    await input.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(16);
  const card = page.locator("main .liquid-glass");
  const nav = page.getByRole("navigation", { name: "Navegación principal" });
  expect((await card.boundingBox()).y).toBeGreaterThan(
    (await nav.boundingBox()).y + (await nav.boundingBox()).height,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

for (const width of [390, 1440])
  test(`simple connection form preserves its draft on errors and sends the existing contract at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await isolate(page, []);
    const sent = [];
    await page.route("**/api/v1/connect-cards", (route) => {
      sent.push(route.request().postDataJSON());
      return route.fulfill({
        status: sent.length === 1 ? 503 : 201,
        contentType: "application/json",
        body: JSON.stringify(
          sent.length === 1
            ? { error: "No se pudo guardar todavía." }
            : { id: 44 },
        ),
      });
    });
    await page.goto("/conectate");
    await expect(page.locator("main .glass-light")).toHaveCount(1);
    const form = page.getByRole("form", { name: "Formulario de conexión" });
    await form
      .getByLabel("Nombre *", { exact: true })
      .fill("  Visitante E2E  ");
    await form.getByLabel("Teléfono *", { exact: true }).fill("00000000");
    await form
      .getByLabel("¿Qué te trae por aquí? *", { exact: true })
      .selectOption("primera_vez");
    await form.getByText("Más información (opcional)", { exact: true }).click();
    await form
      .getByLabel("Correo", { exact: true })
      .fill("contact@example.invalid");
    await form
      .getByLabel("¿Cómo nos conociste?", { exact: true })
      .selectOption("redes");
    await form.getByRole("button", { name: "Enviar", exact: true }).click();
    await expect(form.getByRole("alert")).toHaveText(
      "No se pudo guardar todavía.",
    );
    await expect(form.getByLabel("Teléfono *", { exact: true })).toHaveValue(
      "00000000",
    );
    await form.getByRole("button", { name: "Enviar", exact: true }).click();
    await expect(
      page.getByRole("heading", {
        name: "Ya recibimos tus datos.",
        exact: true,
      }),
    ).toBeVisible();
    expect(sent).toHaveLength(2);
    expect(sent[1]).toEqual({
      name: "Visitante E2E",
      phone: "00000000",
      email: "contact@example.invalid",
      category: "primera_vez",
      how_found: "redes",
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

test("volunteer sign-out returns to the sign-in screen with the session removed", async ({
  page,
}) => {
  await isolate(page, []);
  const token = [
    Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url"),
    Buffer.from(
      JSON.stringify({
        user_id: 999,
        role: "volunteer",
        name: "Voluntario E2E",
        exp: 2000000000,
      }),
    ).toString("base64url"),
    "ui-fixture",
  ].join(".");
  await page.addInitScript(
    (value) => localStorage.setItem("token", value),
    token,
  );
  await page.goto("/volunteer/dashboard");
  await page.getByRole("button", { name: "Salir", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem("token"))).toBeNull();
  await expect(
    page.getByLabel("Correo electrónico", { exact: true }),
  ).toBeVisible();
});
