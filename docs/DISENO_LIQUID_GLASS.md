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

### Un solo sistema de diseño, dos variantes de luz (desde jul-2026)

Antes el admin era Material Design 3, y por un tiempo después pasó por el
mismo material OSCURO (`.liquid-glass`) que describe este documento. Desde
jul-2026 el panel Admin/Líder/Voluntario usa una variante **CLARA** del mismo
lenguaje: canvas `bg-paper` (no navy), cards `.glass-light` (no
`.liquid-glass`), tinta navy sobre blanco (no blanco sobre navy) — mismos
radios, mismo motion, mismo set de íconos SVG de `Glass.jsx`, pero invertido
en luz. La diferencia no es solo de **patrones** (el admin no usa `Tilt`,
`WindowStack` ni el collage desordenado — es un panel de datos denso, no una
vitrina editorial — y no tiene fotos de fondo, usa halos ambientales fijos en
vez de `ParallaxImg`), sino también de **qué clase de cristal usa**. Ver la
guía dedicada y autocontenida: `DISENO_LIQUID_GLASS_ADMIN.md`.

---

## 2. Tokens (público)

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#0A1526` (navy) | Canvas base |
| `--ink` | `#FFFFFF` | Texto |
| `--acento` | `#E8823C` | Acento **único**. Cuatro trabajos, ninguno más (ver abajo) |
| `--rose` / `--amber` / `--emerald` | — | **Solo** estados de formulario (error/aviso/éxito). Nunca decorativos |
| Tipografía | **Arimo** (`public/fonts/Arimo.woff2`, variable 400-700) | Todo. Clon libre de Helvetica (Apache). NO pasa de 700 |
| Display | `text-d1` / `text-d2` / `text-d3` | Los **únicos** tres tamaños de titular |
| Radios | 22px (card) / 28px (panel) | Cards y contenedores; nada muy redondeado |

Colores en JSX vía clases Tailwind (`bg-bg`, `text-white`, `text-acento`).

### El acento es uno solo, y viene de las fotos

`#E8823C` es la luz cálida de escenario muestreada de las fotos reales de la
iglesia (los píxeles cálidos de `bg-ubicacion.jpg` promedian `#925D38`,
`albums/alabanza.jpg` `#A38B69`, `bg-hero.jpg` `#B18768`). Contraste 6.70:1
contra el canvas navy, en ambas direcciones.

**Tiene cuatro trabajos y ninguno más**: link activo del header, borde de la
cita bíblica, halo de hover de las cards de categoría, y el número de día del
evento destacado. **El CTA primario sigue siendo blanco sobre navy** (18:1) —
el acento no se convierte en color de botón.

> ⚠️ Nota histórica (ago-2026). Hasta este cambio la paleta era
> `--celeste #3B82F6` + `--rose #F43F5E` + `--amber #F59E0B` +
> `--emerald #10B981`, y el halo de hover de Células/Voluntariado era un
> arreglo de cinco colores asignado por índice de array. Se verificó
> programáticamente que **los cinco eran exactamente la rampa 500 de Tailwind
> sin tocar** (blue-500, rose-500, amber-500, emerald-500, violet-500), y que
> `--ink-2`/`--ink-3` eran slate-400/slate-600. Nadie elige cinco colores y
> aterriza en el stop 500 cinco veces seguidas: era el default del starter, no
> una decisión — y es lo primero que delata a un sitio generado. Si vuelves a
> necesitar un color, **no lo saques de la paleta de Tailwind**: muéstrealo de
> una foto real de la iglesia.

### La escala de display es cerrada

`text-d1` (hero de página) · `text-d2` (titular de sección) · `text-d3` (dato
editorial / cierre). Traen tamaño, `line-height`, `letter-spacing` y peso ya
horneados en `tailwind.config.js`.

**Prohibido `style={{ fontSize: 'clamp(...)' }}` en JSX.** Antes la clase
`.display-mega` definía peso y tracking pero no tamaño, así que sus 24 usos lo
resolvían cada uno por su cuenta: 16 valores de `clamp()` distintos, y cuatro
secciones de Nosotros repetían el mismo carácter por carácter mientras otras
inventaban el suyo. Cada sección decidía sin memoria de lo que se decidió dos
archivos atrás — que es literalmente cómo trabaja un generador.

Y **nada de `font-extrabold`/`font-black`**: Arimo topa en 700, así que pintan
el mismo trazo que `font-bold` fingiendo una jerarquía que la pantalla nunca
cumple.

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

### Scrims: tres, con nombre

Las capas oscuras que van **sobre** una foto para que el texto encima se lea.
Definidas en `index.css`, y no hay más:

- **`.scrim-hero`** — titular centrado sobre la foto (óvalo oscuro al centro,
  desvanecido al canvas abajo; la foto respira en los bordes).
- **`.scrim-card`** — texto anclado al tercio inferior.
- **`.scrim-band`** — texto a un lado, foto entera visible al otro.

**Dos reglas que van juntas:**

1. **Ninguna imagen lleva `opacity-` menor a 100.** El contraste lo pone el
   scrim, que solo oscurece donde hay texto.
2. **Prohibido escribir `bg-gradient-to-* from-bg via-bg/N` a mano.**

> ⚠️ Nota histórica (ago-2026). Antes esto eran **25 gradientes inline
> distintos** haciendo lo mismo con el número puesto al azar — cuatro secciones
> consecutivas de Nosotros tenían cuatro valores medios diferentes. Y encima
> del scrim, la foto llevaba `opacity-45`, así que llegaba al visitante entre
> el **14% y el 33%** de su color real: las caras de la congregación, lo único
> irrepetible que tiene este sitio, se leían como una textura gris azulada
> indistinguible de un stock.

### Máximo dos fotos ambientales por página

Si una sección no puede justificar por qué su foto es **contenido** y no
ambiente, la foto se borra y la sección queda sobre navy limpio. El contraste
entre "sección con foto entera" y "sección sin foto" es lo que crea ritmo:
cuando el 100% de las secciones tiene foto al 45%, ninguna foto significa nada.

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
- **Nada de tipografía > 700** (Arimo no da más). No declares
  `font-extrabold`/`font-black`: pintan igual que `font-bold`.
- **Sin animaciones en loop** (ni sweeps, ni blobs). Movimiento = reacción a
  cursor/scroll/navegación.
- **CERO iconos, emojis, pictogramas o glifos.** Es identidad del dueño, no una
  preferencia de temporada: "la atención está sobre las fotos, el liquid glass
  y su estilo tan sofisticado y minimalista". Aplica a TODO el proyecto, panel
  admin incluido, y a los datos editables por el admin. Única excepción viva:
  el spinner de carga (feedback de movimiento, no pictograma). Hay tests que
  fallan si reaparecen — ver `e2e/design-rules.spec.js`.
- **CERO eyebrows.** Nada de etiquetas de categoría encima de los titulares —
  ni el pill de cristal con punto (ya borrado), ni su fórmula tipográfica
  disfrazada (micro-mayúsculas con tracking sobre el título). El titular se
  sostiene solo: "la idea es que todos los módulos se sientan orgánicos y se
  sobreentiendan".
- **Las fotos van a color, siempre.** Nada de `grayscale` ni filtros que
  apaguen una foto.
- **Tilt solo donde hay navegación**: `<Tilt>` únicamente si el nodo es
  navegable (`as={Link}`/`as="a"`/`as="button"`/`onClick`) y mide ≥ ~200px.
  Cuando todo se inclina, la inclinación deja de predecir nada — llegaron a
  haber 30 Tilt de los cuales 19 no se podían clickear.
- **El titular de sección nunca se revela.** Es el ancla estable contra la que
  llega el contenido; si también entra animado, no hay punto fijo y el scroll
  se siente gelatinoso. Nada above-the-fold se anima al entrar.
- **Un solo vocabulario de movimiento**: `src/lib/motion.js`. Tres presses
  según el ROL del botón (`PRESS_PRIMARY`/`PRESS_SECONDARY`/`PRESS_MICRO`), no
  según el archivo. Prohibido declarar un `const PRESS` local — llegó a estar
  duplicado en 7 archivos con la amplitud variando por archivo, de modo que un
  CTA primario y un chip de redes vecinos tenían física idéntica.
- **Un titular es un dato que solo esta iglesia puede decir.** Test antes de
  aprobar cualquier titular: si sigue siendo cierto cambiando "Casa del Rey"
  por cualquier otra iglesia, no es un titular — es relleno. Llegó a haber 15
  de 15 frases con 2-4 palabras y punto final ("Alimenta tu espíritu.",
  "Siembra con alegría.", "Momentos vivos."): eso no es criterio, es una firma
  estadística. El dato específico va en la talla grande.
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
- **`e2e/design-rules.spec.js`** — blinda las reglas de identidad visual
  (cero iconos/emojis, cero eyebrows, fotos a color, un `h1` por página) contra
  regresión. Son las decisiones que es más fácil deshacer sin darse cuenta al
  agregar una sección nueva. Corre en dos capas: **DOM** (lo que el visitante
  ve, por ruta) y **fuente** (regex sobre todo `src/`, para cubrir también las
  páginas que no están en la lista de rutas). Las reglas de fuente ignoran
  comentarios a propósito: este repo documenta su historial en comentarios
  largos que mencionan justamente los patrones vigilados.
  Si un test de aquí falla, la pregunta correcta **no** es "cómo lo silencio"
  sino "¿el dueño cambió de opinión sobre esta regla?".
- Para revisar el sitio en local **con contenido real**, crea
  `frontend/.env.local` con `VITE_API_URL=https://casa-del-rey-mvp.fly.dev`.
  Sin eso, `VITE_API_URL` cae a `http://localhost:8080` y —con el backend Go
  apagado— cada página se renderiza con sus datos de respaldo: una vista
  engañosa para juzgar diseño.
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

1. `<main relative overflow-hidden>` + `<PageHero>` (que ya trae foto vía
   `useSitePhoto` + `.scrim-hero`). Elige `align="left"` si la página es
   narrativa, `align="center"` si es de acción — el mismo hero centrado en
   todas hace que el visitante llegue a 9 pantallas que abren igual.
2. Encabezado: **solo** `<h1 className="text-d1">`. Sin eyebrow, sin etiqueta,
   sin pill. El titular dice algo que solo esta iglesia puede decir.
3. Contenido en **collage** (spans/inclinaciones variados), cards con
   `.liquid-glass .liquid-shine` y `<Tilt>` — pero solo si la card es
   navegable (ver Reglas firmes). Lo que es una **lista** se compone como
   lista (`divide-y divide-white/10` sobre el canvas), no como pila de cards:
   cuando todo es una card, la card deja de ser una decisión.
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
