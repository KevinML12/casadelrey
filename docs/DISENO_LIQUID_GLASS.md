# Frontend Casa del Rey — diseño y forma de trabajar

> Guía maestra: el lenguaje visual (Liquid Glass + ventanas sobrepuestas) y
> la metodología para construir/tocar cualquier parte del frontend público.
> Módulos de referencia ya implementados: `CelulasPage.jsx`, `GalleryPage.jsx`,
> `BlogPage.jsx`.

---

## 1. Filosofía visual

El sitio PÚBLICO imita el material **Liquid Glass de Apple** y su **gestor de
ventanas**:

1. **Hero de fondo siempre.** Cada página/sección tiene una foto real de la
   iglesia de fondo, presente pero suavizada. El contenido flota **encima**,
   como cristal sobre una escena.
2. **Cristal transparente, no opaco.** Las cards dejan ver la foto de atrás.
   El realismo viene del *modelado de la luz* (bisel, reflejos), no de tapar.
3. **Ventanas sobrepuestas.** Al entrar a un ítem, se abre una **ventana de
   cristal flotante sobre TODO** (overlay), y detrás asoman las otras opciones
   **apiladas como cartas**. Se salta entre ellas trayéndolas al frente.
   Componente: `components/ui/WindowStack.jsx` (ya extraído y reutilizable).
4. **Distribución desordenada (collage), no grid monótono.** Tamaños,
   inclinaciones y desfases variados — pero determinísticos (estables, no
   aleatorios en cada render).
5. **Calmo y reactivo, no animado solo.** Nada de loops predecibles (se leen
   como "plantilla/IA"). El cristal reacciona al cursor (brillo especular +
   tilt 3D) y a la navegación. Todo respeta `prefers-reduced-motion`.

### Un solo sistema de diseño (desde jul-2026)

Antes el admin era Material Design 3 a propósito. **Ya no** — desde el
commit `e60203d` el panel Admin/Líder/Voluntario usa el mismo material
Liquid Glass que esta guía describe (mismos tokens, mismas clases
`.liquid-glass`/`.card-spring`, mismo set de íconos SVG de `Glass.jsx`).
La diferencia es de **patrones**, no de material: el admin no usa `Tilt`,
`WindowStack` ni el collage desordenado (es un panel de datos denso, no una
vitrina editorial), y no tiene fotos de fondo (usa halos ambientales fijos
en vez de `ParallaxImg`). Ver la guía dedicada: `DISENO_LIQUID_GLASS_ADMIN.md`.

---

## 2. Tokens (público)

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#0A1526` (navy) | Canvas base |
| `--ink` | `#FFFFFF` | Texto |
| `--celeste` | `#3B82F6` / `#7FA9F0` | Acento (con moderación) |
| Tipografía | **Arimo** (`public/fonts/Arimo.woff2`, variable 400-700) | Todo. Clon libre de Helvetica (Apache, sin problema de licencia). NO pasa de 700. |
| Radios | 16-28px | Cards; nada muy redondeado |

Colores en JSX vía clases Tailwind (`bg-bg`, `text-white`, `text-celeste`).

---

## 3. Materiales de cristal (en `index.css`)

- **`.liquid-glass`** — cristal oscuro casi transparente (blur 8px). El
  realismo está en el `box-shadow`: bisel (luz arriba-izq), realce **blanco
  neutro** en el borde inferior (monocromático, sin tinte de color), hairline
  superior, sombra externa. Texto blanco. **El material por defecto.**
- **`.glass-light`** — cristal claro escarchado (blanco translúcido, texto
  navy). Para elementos que flotan sobre foto clara (tarjeta del hero, nav).
- **`.liquid-shine`** — agrega un reflejo de vidrio FIJO y sutil en la esquina
  superior (NO animado — un loop se lee como plantilla/IA). Combínalo con
  `.liquid-glass` en cards interactivas.
- **Brillo al cursor** — `.liquid-glass::after` sigue `--spec-x/--spec-y`
  (los alimenta `Tilt`). No requiere código extra si usas `<Tilt>`.

Regla: monocromático y sobrio. El material ES el acento — evita rellenar de
colores planos o badges de más ("look IA").

⚠️ Se intentó una versión con refracción REAL en WebGL (three.js,
`MeshTransmissionMaterial`) — se descartó por completo tras varias rondas
(siempre se veía opaco/blanco/gris, ver historial de commits jul 2026). El
vidrio del sitio es 100% CSS. No reintroducir WebGL para esto.

---

## 4. Patrones (componentes)

- **Hero de fondo administrable**: `useSitePhoto('hero_X', '/images/bg-X.jpg')`
  (de `lib/feed.js`) + `<ParallaxImg src={heroImg} className="opacity-45" />`
  + `<div className="absolute inset-0 bg-gradient-to-b from-bg/75 via-bg/55 to-bg" />`
  para legibilidad. Va como primer hijo del `<main relative overflow-hidden>`.
  El admin puede cambiar el fondo desde `/admin/site-photos` sin deploy — el
  archivo local es solo el fallback si no ha subido nada. Agregar un slot
  nuevo = una línea en `backend/handlers/site_photo.handler.go` (`knownSlots`).
- **Tilt 3D**: `<Tilt glass className="liquid-glass ...">` — inclina la card al
  cursor y alimenta el brillo especular. No combinar con `.card-spring`.
- **Reveal / RevealList**: entrada en scroll (`components/ui/Reveal.jsx`).
- **Collage** (distribución desordenada): array determinístico de
  `{ span, rot, y }` por índice + `whileHover={{ rotate: 0, scale }}` para que
  el "recorte" se enderece al pasar el cursor. Ver `COLLAGE`/`SPANS`/`ROT` en
  CelulasPage/GalleryPage/PostCollage.
- **Ventanas sobrepuestas**: `<WindowStack items={[{key,image,badge,title}]}
  openKey={openKey} onChange={setOpenKey} renderContent={(item) => ...} />`
  — ya extraído, no reimplementar `stackPose` a mano. Overlay `fixed inset-0
  z-[100]` + backdrop blur + pila con profundidad (scale/y/x/rotate/opacity
  decrecientes) + X/Escape/flechas/dots + bloquea scroll del fondo mientras
  está abierta.
  - **Cuándo NO usarla**: contenido que se comparte como enlace directo (un
    artículo de blog) — una ventana modal no tiene URL navegable ni SEO. Ahí
    va ruta propia (`ArticleReader.jsx`) con el mismo lenguaje inmersivo pero
    sin el overlay.

---

## 5. Reglas firmes

- **El header es lo único NO transparente** (fondo sólido, blur alto). Todo lo
  demás es cristal.
- **Nada de tipografía > 700** (Arimo no da más; los `.display-mega` en 800 se
  ven en 700, es correcto).
- **Sin animaciones en loop** (ni sweeps, ni blobs). Movimiento = reacción a
  cursor/scroll/navegación.
- **Fotos**: siempre reales, de la iglesia, nunca stock/placeholder.
- **Privacidad**: nunca direcciones exactas de células en público (solo
  nombre · líder · zona). Ver `docs/CONTEXTO_IGLESIA.md`.
- **Fuentes**: solo libres/self-host (Arimo = Apache). NO Helvetica/Myriad
  (comerciales) en el repo público.

---

## 6. "Nada estático" — la regla más importante del proyecto

**Todo dato visible en el sitio viene de BD → backend → frontend. Nada se
inventa ni se hardcodea en el frontend simulando ser real.**

- ❌ **Prohibido**: arrays `MOCK_X_FALLBACK` con contenido INVENTADO (títulos
  de sermones, eventos, posts falsos) que se muestran como si fueran reales
  cuando la API falla o está vacía. Si no hay datos reales, el componente
  muestra un **estado vacío genuino** (`if (items.length === 0) return null`
  o un mensaje "aún no hay contenido").
- ✅ **Permitido como fallback**: datos REALES curados a mano (el directorio
  de células real, fotos reales de la iglesia) cuando la API aún no tiene
  nada — siempre con la foto/dato real, nunca inventado. Ejemplo:
  `GROUPS_FALLBACK` en CelulasPage (directorio real jul-2026), `ALBUMS_FALLBACK`
  en Home (fotos reales de DOMINGOS 2026).
- ✅ **Permitido**: fondos ambiente de sección (`SitePhoto`) con fallback local
  — son decoración, no contenido, y garantizan que la página nunca tenga un
  hueco en blanco sin depender de la red.
- **Fotos de "contenido" (galería, eventos) van a Cloudflare R2 + DB — NUNCA
  como archivos estáticos en `public/images/` del repo.** Ver sección 8.

---

## 7. Flujo de fotos reales (de cámara a producción)

1. **Fuente**: `frontend/DOMINGOS 2026/` (gitignored, carpetas por categoría:
   ALABANZA, DANZA, NIÑOS, MIEMBROS, LIDER DE JOVENES, DIA DE LA MADRE,
   SERVIDORES, LÍDERES, MEDIOS). Cientos de fotos — verlas todas no es viable.
2. **Curar sin ver todo**: script Python con PIL que arma **hojas de
   contactos** (mosaico de miniaturas con nombre de archivo) por carpeta →
   revisar el mosaico → elegir a mano los mejores. Patrón reutilizable, no
   hay script fijo guardado — se genera on-demand en el scratchpad.
3. **Optimizar**: PIL, `thumbnail((1400-1900,1400-1900))`, `quality=78-82`,
   de 4-10MB originales a 100-250KB.
4. **Destino según tipo de contenido**:
   - **Fondos de sección / categorías fijas** (hero de página, foto de cada
     tipo de célula) → `public/images/` del repo, referenciadas por
     `SitePhoto` o arrays fijos en el código. Son "chrome" del sitio, no
     contenido dinámico.
   - **Contenido de galería / eventos** → **Cloudflare R2 + registro real en
     DB**, vía un script Go one-off en `backend/scripts/` (patrón:
     `seed_curated_gallery/main.go`) que sube con `storage.New()` y crea los
     registros con el mismo formato que usaría el admin subiendo a mano.
     Nunca archivos estáticos en el repo para esto — infla el bundle sin
     necesidad y esquiva el flujo real de datos.
5. **Texto con acentos**: nunca sembrar vía `curl -d` en shell de Windows
   (corrompe UTF-8 — "años"→"a�os"). Usar un script Go con literales de Go.

---

## 8. Componentes multi-archivo, no monolitos

Cuando una página crece (hero + listado + detalle + reproductor…), se separa
en `components/<módulo>/`, con la página como orquestador delgado. Ejemplo
real: `pages/public/BlogPage.jsx` (routing list vs detail) +
`components/blog/{BlogHero,PostCollage,ArticleReader,TTSPlayer}.jsx`.

---

## 9. Testing E2E (Playwright)

`frontend/e2e/` — Playwright, contra el sitio **REAL desplegado**
(Vercel + Fly + Supabase), no mocks. Misma filosofía de "nada estático":
si el test pasa, es porque el flujo real funciona, no porque se simuló.

- `playwright.config.js` — apunta a `https://casadelreyhue.vercel.app` por
  defecto; `PW_BASE_URL` para apuntar a `localhost` si se levanta el dev
  server aparte.
- `e2e/fixtures/auth.js` — login real por UI (nunca atajos de API). Lee
  credenciales de env vars, **nunca hardcodeadas**.
- Credenciales van en `frontend/.env.e2e.local` (gitignored por el patrón
  `.env.*.local` ya existente) — sacarlas de `docs/CREDENCIALES.local.md`.
- Correr: `cd frontend && export $(grep -v '^#' .env.e2e.local | xargs -d '\n') && npx playwright test`
  (o en Windows/PowerShell equivalente con `$env:`).
- Cada test que crea datos (ej. un evento) **debe borrarlo al final** — no
  ensuciar producción en corridas repetidas.
- Cuando un test falla, **no asumas que el test está mal** — puede haber
  encontrado un bug real. Ejemplo real: la suite de Eventos detectó que el
  panel admin mostraba la lista CACHEADA (20s) tras crear un evento, porque
  reusaba el endpoint público con `Cache-Control`. El fix fue en el
  producto (cache-bust en `AdminEvents.jsx`), no en el test.

---

## 10. Flujo de deploy

1. `npm run build` (frontend) — siempre verificar que compila antes de
   commitear.
2. Commit + push.
3. **`git push origin main` Y `git push origin main:frontend`** — Vercel
   despliega desde la rama `frontend`, no `main` (ver `PROJECT.md`/memoria
   para el detalle; arreglo permanente pendiente en el dashboard de Vercel).
4. Backend: `cd backend && fly deploy` cuando se toca `models/`, `handlers/`,
   `routes/`, o `database.go` (AutoMigrate corre solo, agrega el modelo
   nuevo a la lista explícita en `database.go` o la tabla nunca se crea).
5. Verificar en vivo: comparar el hash del bundle local
   (`ls dist/assets/ | grep index-*.js`) contra el de producción
   (`curl -s https://casadelreyhue.vercel.app/ | grep -oE 'assets/index-[^"]+\.js'`)
   hasta que coincidan — Vercel puede tardar unos minutos.

---

## 11. Cómo construir un módulo público nuevo

1. `<main relative overflow-hidden>` + hero `ParallaxImg` vía `useSitePhoto` + gradiente.
2. Encabezado: `<Eyebrow>` + `<h1 className="display-mega">`.
3. Contenido en **collage** (spans/inclinaciones variados), cards con
   `.liquid-glass .liquid-shine` y `<Tilt>`.
4. Al entrar a un ítem → **`<WindowStack>`** con su galería; los demás ítems
   apilados detrás. Si es contenido de lectura larga/compartible → ruta
   propia en su lugar (ver sección 4).
5. Cada ítem con su **acceso directo** (enlace de acción real, no un botón
   decorativo).
6. Si el módulo necesita datos propios que aún no existen en el backend
   (ej. una tabla nueva), seguir el patrón: modelo en `models.go` → agregar a
   `AutoMigrate` → handler → rutas → **luego** el frontend.
7. Si aplica, cubrir el flujo con un test E2E (sección 9).
8. Deploy (sección 10).
