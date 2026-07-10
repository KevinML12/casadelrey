# Lenguaje de diseño — Casa del Rey

> Liquid Glass + **ventanas de cristal sobrepuestas**. Esta es la guía maestra
> para construir cualquier módulo nuevo con el mismo lenguaje. Módulo de
> referencia ya implementado: `frontend/src/pages/public/CelulasPage.jsx`.

---

## 1. Filosofía

El sitio imita el material **Liquid Glass de Apple** y su **gestor de ventanas**:

1. **Hero de fondo siempre.** Cada página/sección tiene una foto real de la
   iglesia de fondo (de `public/images/`), presente pero suavizada. El
   contenido flota **encima**, como cristal sobre una escena.
2. **Cristal transparente, no opaco.** Las cards dejan ver la foto de atrás.
   El realismo viene del *modelado de la luz* (bisel, reflejos), no de tapar.
3. **Ventanas sobrepuestas.** Al entrar a un ítem, se abre una **ventana de
   cristal flotante sobre TODO** (overlay), y detrás asoman las otras opciones
   **apiladas como cartas**. Se salta entre ellas trayéndolas al frente.
4. **Distribución desordenada (collage), no grid monótono.** Tamaños,
   inclinaciones y desfases variados — pero determinísticos (estables, no
   aleatorios en cada render).
5. **Calmo y reactivo, no animado solo.** Nada de loops predecibles (se leen
   como "plantilla/IA"). El cristal reacciona al cursor (brillo especular +
   tilt 3D) y a la navegación. Todo respeta `prefers-reduced-motion`.

---

## 2. Tokens

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#0A1526` (navy) | Canvas base |
| `--ink` | `#FFFFFF` | Texto |
| `--celeste` | `#3B82F6` / `#7FA9F0` | Acento (con moderación) |
| Tipografía | **Arimo** (`public/fonts/Arimo.woff2`, variable 400-700) | Todo. Clon libre de Helvetica. NO pasa de 700. |
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
- **`.liquid-shine`** — agrega un reflejo de vidrio fijo y sutil en la esquina
  superior (NO animado). Combínalo con `.liquid-glass` en cards interactivas.
- **Brillo al cursor** — `.liquid-glass::after` sigue `--spec-x/--spec-y`
  (los alimenta `Tilt`). No requiere código extra si usas `<Tilt>`.

Regla: monocromático y sobrio. El material ES el acento — evita rellenar de
colores planos o badges de más ("look IA").

---

## 4. Patrones (componentes)

- **Hero de fondo**: `<ParallaxImg src="/images/bg-X.jpg" className="opacity-45" />`
  + un `<div className="absolute inset-0 bg-gradient-to-b from-bg/75 via-bg/55 to-bg" />`
  para legibilidad. Va como primer hijo del `<main relative overflow-hidden>`.
- **Tilt 3D**: `<Tilt glass className="liquid-glass ...">` — inclina la card al
  cursor y alimenta el brillo especular. No combinar con `.card-spring`.
- **Reveal / RevealList**: entrada en scroll (`components/ui/Reveal.jsx`).
- **Collage** (distribución desordenada): array determinístico de
  `{ span, rot, y }` por índice + `whileHover={{ rotate: 0, scale }}` para que
  el "recorte" se enderece al pasar el cursor. Ver `COLLAGE` en CelulasPage.
- **Ventanas sobrepuestas** (el patrón estrella): overlay `fixed inset-0
  z-[100]` + backdrop que difumina el fondo + una pila de ventanas de cristal.
  `stackPose(depth)` calcula scale/y/x/rotate/opacity/zIndex por profundidad
  (0 = frente). Navegación: X, Escape, flechas ←→, dots; bloquea el scroll del
  fondo (`document.body.style.overflow = 'hidden'`) mientras hay ventana.
  Ver la sección "VENTANAS SOBREPUESTAS" de CelulasPage.

---

## 5. Reglas firmes

- **El header es lo único NO transparente** (fondo sólido, blur alto). Todo lo
  demás es cristal.
- **Nada de tipografía > 700** (Arimo no da más; los `.display-mega` en 800 se
  ven en 700, es correcto).
- **Sin animaciones en loop** (ni sweeps, ni blobs). Movimiento = reacción a
  cursor/scroll/navegación.
- **Fotos**: siempre reales, de la iglesia, optimizadas (~1600px, q82) con
  `python -m PIL`. Fuente: `frontend/DOMINGOS 2026/` (gitignored — solo se
  versiona el resultado en `public/images/`).
- **Privacidad**: nunca direcciones exactas de células en público (solo
  nombre · líder · zona). Ver `docs/CONTEXTO_IGLESIA.md`.
- **Fuentes**: solo libres/self-host (Arimo = Apache). NO Helvetica/Myriad
  (comerciales) en el repo público.

---

## 6. Cómo construir un módulo nuevo

1. `<main relative overflow-hidden>` + hero `ParallaxImg` + gradiente.
2. Encabezado: `<Eyebrow>` + `<h1 className="display-mega">`.
3. Contenido en **collage** (spans/inclinaciones variados), cards con
   `.liquid-glass .liquid-shine` y `<Tilt>`.
4. Al entrar a un ítem → **ventana sobrepuesta** con su galería; los demás
   ítems apilados detrás (reutiliza el patrón `stackPose` de CelulasPage).
5. Cada ítem de la galería con su **acceso directo** (enlace de acción).
6. `npm run build`, commit, push a `main` **y** `main:frontend` (Vercel
   despliega desde `frontend`).

---

## 7. Pendiente de replicar

Aplicar este lenguaje (hero + collage + ventanas sobrepuestas) a: **Eventos,
Blog, Galería, Home**. Cuando el patrón `stackPose`/ventana se repita en un 2º
módulo, extraerlo a un componente reutilizable (p.ej. `components/ui/WindowStack.jsx`).
