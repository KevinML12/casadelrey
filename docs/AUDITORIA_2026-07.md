# Auditoría general — Casa del Rey (13 jul 2026)

> Frontend, backend, integración, arquitectura y escalabilidad.
> Estado al commit `10aa6d9`. Los ítems marcados ✅ se corrigieron
> durante esta misma auditoría; los ⚠️ quedan como deuda priorizada.

---

## 1. Veredicto general

El proyecto está en buen estado para su propósito y escala (iglesia
local, cientos de visitantes, decenas de usuarios con rol). La
arquitectura Vercel + Fly + Supabase + R2 es correcta y barata; el
backend está mejor construido de lo habitual para un MVP (rate
limiting, cache por endpoint, abstracción de storage, 221 tests
unitarios + suites de seguridad); el frontend tiene un sistema de
diseño documentado y ahora aplicado de forma consistente. Los riesgos
reales pendientes son operativos (datos bancarios sin confirmar, anon
key sin rotar, repo público), no estructurales.

## 2. Frontend

### Lo sólido
- Sistema Liquid Glass centralizado (`index.css` + `Tilt`/`Glass`/
  `WindowStack`/`Reveal`) y documentado en `DISENO_LIQUID_GLASS.md`.
  Tras la normalización de esta semana, TODAS las páginas públicas lo
  siguen (ProfilePage era la última y fue reescrita ✅).
- Accesibilidad de movimiento: `prefers-reduced-motion` y
  `prefers-reduced-transparency` con fallbacks reales en el material.
- WindowStack ahora es un dialog modal real (focus trap, aria-modal,
  Escape/flechas) ✅.
- SEO base: meta description, Open Graph con foto real, títulos por
  ruta y por artículo ✅ (antes no había nada).
- Fuentes 100% self-host (Arimo + Material Symbols ✅ — antes el
  @import de Google Fonts bloqueaba el render para todos).
- "Nada estático" se cumple: se eliminaron los eventos inventados del
  Home ✅; los fallbacks restantes son datos reales curados
  (directorio de células, categorías estructurales).

### Deuda (priorizada)
- ⚠️ **Bundle principal 700KB** (225KB gzip). Causas: casi todas las
  páginas públicas son eager en `router.jsx` + framer-motion + lenis en
  el shell. El chunk three.js (868KB) sí está aislado y lazy. Camino:
  lazy en Blog/Gallery/Celulas/About (las de menos tráfico primero) y
  `manualChunks` para vendor. Ganancia estimada: −30-40% del initial.
- ⚠️ **AdminBlog 384KB** (editor TipTap entero en un chunk) — aceptable
  porque es lazy y solo admin, pero es el segundo chunk más pesado.
- ⚠️ **Lint: 47 avisos reales** (`setState` síncrono en effects ×15,
  funciones impuras en render ×11, fast-refresh ×7…). Ninguno es bug
  activo conocido; son focos de re-renders en cascada. Arreglarlos por
  archivo, con verificación visual, no en bloque. La config ya está
  reparada ✅ (los 19 falsos positivos de `motion` murieron).
- ⚠️ Imágenes: `public/images` está optimizado (3.6MB total), pero no
  hay `srcset`/`sizes` — el móvil descarga la misma foto que desktop.

## 3. Backend (Go + Echo + GORM)

### Lo sólido
- Capas limpias: `routes → handlers → models` con `storage.Store` como
  interfaz única (R2 o disco) — el refactor de upload lo demostró: los
  handlers no saben qué motor hay detrás.
- Seguridad: JWT con roles (admin/leader/volunteer), rate limit global
  + específico de auth, CORS explícito, sanitización de filenames
  (con tests de path traversal), suite `tests/security` dedicada.
- Rendimiento: `Cache-Control` por tipo de contenido (20s eventos/hero,
  300s categorías), pool de DB tuneado (100 max open / 10 idle).
- Tests: **221 unitarios en verde** (handlers con sqlmock, auth,
  middleware, storage, e2e internos, seguridad). La suite estaba ROTA
  (no compilaba) por 4 grupos de tests desactualizados — reparada ✅:
  sanitize movido a storage, upload contra Store, PayPal a 410 Gone,
  volunteers al contrato paginado.

### Deuda
- ⚠️ **AutoMigrate en cada arranque** contra Supabase remoto: ~60-90s
  de introspección columna por columna. En deploy con 2 máquinas Fly
  (rolling) no hay downtime, pero el cold start es lento y cada boot
  golpea la DB. Camino: flag `RUN_MIGRATIONS=true` solo en el primer
  deploy tras cambio de modelos, o migraciones versionadas (golang-
  migrate) cuando duela.
- ⚠️ **Contratos inconsistentes**: unos endpoints devuelven
  `PagedResponse {data, meta}` (volunteers, petitions) y otros array
  plano (events, cells). El frontend ya normaliza (`res.data?.data ||
  res.data`), pero es fricción para cada feature nueva. Definir: todo
  listado nuevo → paginado.
- ⚠️ PayPal quedó como stub 410 y Stripe se descartó — el flujo real de
  pago es manual (boleta + verificación). Está bien para la escala,
  pero `DonationHandler` arrastra código muerto de ambos.

## 4. Integración frontend ↔ backend

- Patrón general correcto: axios con interceptor (token + logout en
  401), `useApi`/`fetchOnce` con TTL en memoria, fallbacks reales.
- ✅ Flujo verificado de punta a punta con E2E reales (6/6 en verde
  contra stack local: frontend dev + backend local + Supabase):
  eventos (crear→público→RSVP→pago→limpieza), peticiones
  (público→panel→limpieza), smoke público, WindowStack accesible.
- ⚠️ El bug histórico de "lista cacheada en admin" (el panel reusaba el
  endpoint público con Cache-Control) se arregló para eventos con
  cache-bust; el MISMO riesgo existe para cualquier panel nuevo que
  reuse un GET público cacheado. Regla: los paneles admin no consumen
  endpoints con `cacheShort/cacheLong`, o le agregan `?t=`.
- ⚠️ `Petition.Email` es opcional en el form público pero el equipo
  pastoral no tiene forma de responder si viene vacío — decidir si
  debe ser obligatorio (decisión de producto, no técnica).

## 5. Arquitectura y operación

```
Vercel (frontend estático)  ←—  rama `frontend` (⚠️ no `main`)
Fly.io  (backend Go, 2 máquinas, rolling deploy + health checks)
Supabase (PostgreSQL administrado)
Cloudflare R2 (fotos de contenido, URLs públicas r2.dev)
```

- El flujo funciona y es barato. Riesgos operativos:
- ⚠️ **Vercel despliega desde la rama `frontend`** — cada push exige
  `git push origin main && git push origin main:frontend`. Es el
  arreglo pendiente más fácil de olvidar (cambiar la production branch
  en el dashboard de Vercel y borrar la rama espejo).
- ⚠️ **Repo PÚBLICO** con historia que expuso un anon key de Supabase
  (commit 3e0d138). El key sigue sin rotarse (pendiente en
  CREDENCIALES.local.md §Pendiente). Hacer ambas cosas: rotar key +
  repo privado.
- ⚠️ JWT en localStorage: aceptable a esta escala, pero un XSS lo
  exfiltra. El sanitizado de DOMPurify en el blog mitiga el vector
  principal. Alternativa futura: cookie httpOnly.
- 🔴 **CRÍTICO — datos bancarios sin confirmar**: `ReceiptPage` y el
  RSVP de eventos muestran `Banrural 3061234567890` — el MISMO número
  del mockup de Figma (Frame 4), es decir, casi seguro inventado. Si
  alguien deposita ahí, el dinero no llega. Confirmar cuenta real y
  Tigo Money con el pastor y corregir en `ReceiptPage.jsx` (BANK_INFO)
  y donde el RSVP muestre el banner de pago.

## 6. Escalabilidad

Para la carga esperable (≤ miles de visitas/día, decenas de admins):
**sobra capacidad**. Los límites reales, en orden de aparición:

1. **Cold start de Fly + AutoMigrate** (~90s) — molesto hoy, no bloqueante.
2. **Bundle inicial** — afecta al primer visitante móvil con 3G; es el
   ítem con mejor relación esfuerzo/beneficio.
3. **Sin CDN de imágenes con resize** — R2 sirve el original; a más
   fotos, más peso móvil. Cloudflare Images o resize on-upload cuando
   la galería crezca (>500 fotos).
4. **Postgres de Supabase (plan free/starter)** — el pool de 100
   conexiones del backend supera el límite del pooler free (60);
   bajar `SetMaxOpenConns` a ~40 o usar el pooler en modo transaction.
5. El diseño actual (SPA + API stateless + storage externo) escala
   horizontal sin cambios: más máquinas Fly y listo.

## 7. Roadmap recomendado (orden)

1. 🔴 Confirmar/corregir datos bancarios (5 min de código, riesgo real).
2. Rotar anon key de Supabase + repo privado (operativo, 15 min).
3. Arreglar la production branch de Vercel (dashboard, 5 min).
4. `SetMaxOpenConns(40)` (1 línea, evita agotar el pooler).
5. Lazy de páginas públicas pesadas + manualChunks (1-2 h).
6. Refactor del panel admin (ya planeado — el login visible ✅ era el
   prerequisito).
7. Lint: limpiar los 47 avisos por archivo (sesiones cortas).
8. E2E: agregar flujos de donación/boleta y conectate (los specs de
   eventos/peticiones ya cubren el patrón).

---

*Método: revisión de código completa (frontend/src, backend), lint,
build, suite Go (221 tests), 6 E2E Playwright contra stack local
(frontend dev + backend local + Supabase producción), backend
desplegado a Fly y verificado en vivo.*
