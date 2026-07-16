# Panel Admin/Líder/Voluntario — Liquid Glass

> Desde jul-2026 los 3 paneles (`pages/admin/*`, `pages/leader/*`,
> `pages/volunteer/*`) usan el **mismo material Liquid Glass** que el sitio
> público — ya NO es Material Design 3. Esta guía documenta las clases y el
> patrón para construir cualquier página nueva del panel.
>
> El sitio **público** tiene su propia guía en `DISENO_LIQUID_GLASS.md` —
> comparten los mismos tokens/materiales de `index.css`, pero el admin NO usa
> `Tilt`, `WindowStack` ni el collage desordenado (es un panel de datos denso,
> no una experiencia editorial). Ver diferencias en la sección 6.

---

## 1. La diferencia clave: sin foto de fondo

El público apoya el cristal sobre fotos reales (`ParallaxImg` + gradiente). El
admin es un canvas navy plano (`--bg: #0A1526`) sin fotos — la "identidad" que
reemplaza a la foto es:

1. **Halos ambientales fijos** — `<Halos variant="section" />` (de
   `components/ui/Glass.jsx`) montado UNA vez en cada layout (`AdminLayout`,
   `LeaderLayout`, `VolunteerLayout`), detrás del sidebar y del contenido.
   Dos blobs radiales celestes muy tenues (opacity 0.12-0.14, blur 80px),
   posicionados absolutos respecto al contenedor `h-screen` — quedan fijos
   aunque el `<main>` haga scroll, como una luz de ambiente constante.
2. **El propio material del cristal** — `.liquid-glass` no necesita nada
   detrás para leerse como vidrio: el bisel + realce inferior + hairline
   superior (todo `box-shadow`) ya modelan la luz. Sobre el halo se ve mejor,
   pero funciona sobre navy liso también.
3. **El brillo que sigue al cursor** (`useGlassSpecular`, sección 5) — es lo
   que más vende la sensación de "cristal real" sin foto: al mover el mouse
   sobre cualquier card, un punto de luz se desliza por dentro.

No se necesita imagen para que una card se sienta de cristal — con halo +
bisel + specular basta.

---

## 2. Tokens (los mismos que el público)

Definidos en `index.css` (`:root`) y espejados en `tailwind.config.js`. El
admin los usa vía clases Tailwind normales: `bg-bg`, `text-white`,
`text-celeste-hov`, etc.

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#0A1526` | Canvas del panel |
| `--bg-soft` | `#131F33` | Superficie sólida ocasional (inputs, no cards) |
| `--celeste` | `#3B82F6` | Acento primario (botón "filled", activo del nav) |
| `--celeste-hov` | `#60A5FA` | Texto/ícono sobre fondos celeste-soft |
| `--celeste-soft` | `#1E3A8A` | Fondo de chip/ícono con tinte celeste |
| `--rose` / `--rose-soft` | `#F43F5E` / `#881337` | Error, logout, rechazar |
| `--amber` / `--amber-soft` | `#F59E0B` / `#78350F` | Advertencia, "Recaudado" |
| `--emerald` / `--emerald-soft` | `#10B981` / `#064E3B` | Éxito, aprobado |
| Texto | `text-white`, `text-white/50`, `text-white/40` | Primario / secundario / terciario — NO usar los tokens viejos `text-on-surf-var` en código nuevo, aunque siguen funcionando (alias) |

Los tokens legacy MD3 (`--pri`, `--on-surf`, `--outline-var`…) siguen
declarados en `tailwind.config.js` como **alias** de estos mismos valores —
código viejo que aún los use no se ve roto, pero **no uses esos nombres en
código nuevo**: usa los tokens de arriba o clases `white/N` directas.

---

## 3. Materiales de cristal (clases de `index.css`)

| Clase | Qué es | Cuándo usarla |
|---|---|---|
| `.liquid-glass` | Cristal oscuro casi transparente: `backdrop-filter: blur(8px) saturate(150%)`, bisel + realce inferior blanco neutro + hairline, sombra externa. Texto blanco. | **La card por defecto de todo el panel.** Sidebar, formularios, listas, estados vacíos, StatCard. |
| `.glass-light` | Cristal claro escarchado, texto navy. | Casi nunca en admin (es para elementos sobre fotos claras del público) — no usar salvo caso excepcional. |
| `.card-spring` | Hover: `translateY(-2px) scale(1.005)`, sombra más grande, el radio "respira" a 20px. | Combinar con `.liquid-glass` en TODA card clicable/interactiva. |
| `card-spring` en un botón | usa en su lugar `.btn-spring` (ya incluida en `Button`/`GlassButton`) | Botones, no cards |

**Patrón estándar de card**, tres clases juntas:

```jsx
<div className="liquid-glass rounded-[24px] card-spring p-6">
  {/* contenido */}
</div>
```

Radios según tamaño de card (mismo criterio squircle del público):
- `rounded-[24px]` — card estándar (formularios, filas de lista contenedoras)
- `rounded-[20px]` — card chica (inputs de imagen, íconos de 20x20 well)
- `rounded-[28px]` — panel grande (sidebar completo, estado vacío grande)

**No repetir a mano** el bisel/sombra — SIEMPRE vía la clase `.liquid-glass`,
nunca `box-shadow` inline.

---

## 4. Set de íconos SVG (`components/ui/Glass.jsx`)

El panel dejó de usar Material Symbols (`<span className="ms">nombre</span>`)
— esa fuente por ligadura fallaba en silencio (si tardaba en cargar, se veía
el nombre del ícono como texto en inglés: "campaign", "delete"…). Ahora usa
el mismo componente `Icon` que el público:

```jsx
import { Icon } from '../../components/ui/Glass'; // ajustar profundidad relativa

<Icon name="calendar_month" className="w-[22px] h-[22px] text-celeste-hov" stroke={1.8} />
```

- `name` — string, debe existir en el objeto `PATHS` de `Glass.jsx` (~116
  íconos ya cubiertos: dashboard, settings, article, calendar_month,
  photo_library, share, help_center, campaign, manage_accounts, badge,
  group_add, contact_page, volunteer_activism, groups, person_add,
  receipt_long, history, logout, public, chevron_left/right, download,
  payments, notifications_active, bar_chart, church, savings, edit, delete,
  add, image, save, cancel, undo, print, inbox, verified, visibility,
  account_balance, tag, info, open_in_new, publish, task_alt, apps, circle,
  hourglass_empty, expand_more, warning, arrow_back, broken_image,
  check_circle, mark_email_read, add_circle, login, star, shield, thumb_up,
  play_circle, y varios alias de nombres MD equivalentes — `person`→`user`,
  `groups`/`contacts`→`users`, `favorite`→`heart`, `email`→`mail`,
  `location_on`→`pin`, `photo_camera`→`camera`, `schedule`→`clock`,
  `calendar_today`/`event`→`calendar`, etc.).
- **Si necesitas un ícono que no existe**: agrégalo a `PATHS` en `Glass.jsx`
  (un `<path>`/`<circle>`/`<polyline>` con `viewBox="0 0 24 24"`, estilo
  stroke consistente con los demás) o alíalo a uno existente si el glifo es
  casi igual (`PATHS.nuevo_nombre = PATHS.existente;` al final del archivo).
  **Nunca** vuelvas a usar `<span className="ms">`.
- `className` controla tamaño (`w-[Npx] h-[Npx]`) y color (clases de texto).
- `stroke` — grosor del trazo, `1.8` es el estándar del panel (`2` para
  botones/acciones destacadas, `2.2` para checks pequeños).

---

## 5. `useGlassSpecular` — el brillo que sigue al cursor

`hooks/useGlassSpecular.js` — un hook sin argumentos, se llama **una sola
vez por layout** (ya está en `AdminLayout`, `LeaderLayout`,
`VolunteerLayout`):

```jsx
import useGlassSpecular from '../../hooks/useGlassSpecular';

export default function MiLayout() {
  useGlassSpecular();
  // ...
}
```

Qué hace: un único listener delegado (`document.addEventListener('pointermove', …)`
+ `touchmove` para tablets) que detecta cuál `.liquid-glass`/`.glass-light`
está bajo el cursor/dedo y le mueve `--spec-x`/`--spec-y` (las variables que
consume `.liquid-glass::after` para el brillo). En touch fuerza `--spec-o:1`
porque no existe `:hover` real; con mouse el `:hover` de CSS ya se encarga.

**No hay que envolver cada card** ni pasarle props — cualquier elemento con
`.liquid-glass` en cualquier página, presente o futura, hereda el efecto
automáticamente en cuanto el layout que lo contiene llama el hook una vez.
Si agregas un panel nuevo fuera de los 3 layouts existentes (poco probable),
llama `useGlassSpecular()` ahí también.

A diferencia de `Tilt.jsx` (público): NO hace inclinación 3D ni usa
framer-motion — en un panel denso en datos/formularios el tilt por card
estorbaría la usabilidad. Solo el brillo, más barato y menos intrusivo.

---

## 6. Componentes compartidos del panel (`components/ui/`)

Todos migrados de MD3 a liquid-glass; mismas props/API que antes — el código
viejo que los use no se rompe, solo se ve distinto.

### `Button.jsx` (default export) + `IconButton`/`FAB`

```jsx
import Button, { IconButton, FAB } from '../../components/ui/Button';

<Button variant="filled">Guardar</Button>   {/* pill blanco, texto navy — CTA primario */}
<Button variant="tonal">Cancelar</Button>   {/* .liquid-glass — el más usado */}
<Button variant="outlined">…</Button>       {/* borde blanco/20, transparente */}
<Button variant="text">…</Button>           {/* mínimo, texto white/60 */}
<Button variant="glass">…</Button>          {/* alias de tonal */}
<Button size="sm|md|lg" as="link" to="/admin/x">…</Button>
```

`IconButton` (círculo 40px): `variant="standard|filled|tonal|outlined"`.
`FAB`: círculo/squircle flotante, `bg-celeste` + `shadow-pop`.

### `Chip.jsx` (default) + `FilterChip`

```jsx
import Chip, { FilterChip } from '../../components/ui/Chip';

<Chip color="default|primary|secondary|tertiary|error" icon="tag">Etiqueta</Chip>
<FilterChip selected={activo} onClick={...} count={5}>Pendientes</FilterChip>
```

Pastilla de cristal (`bg-white/8 border border-white/12`) o con tinte
celeste/rosa según `color`. `icon` acepta el mismo `name` que `<Icon>`.

### `Input.jsx` (default) + `Select`, `Textarea`

```jsx
import Input, { Select, Textarea } from '../../components/ui/Input';

<Input label="Título" value={..} onChange={..} />
<Select label="Rol" options={[{value:'admin', label:'Admin'}]} />
<Textarea label="Descripción" rows={4} />
```

Usan la clase `.input-squircle` (ya definida en `index.css`, compartida con
los formularios públicos): fondo `--bg-soft`, hairline, focus con anillo
celeste. `size="sm|md|lg"` en `Input` ajusta padding.

### `Paginator.jsx` (default)

```jsx
<Paginator meta={{ page, pages, total }} onPage={setPage} />
```

Flechas `chevron_left/right` vía `Icon`, página activa en `bg-celeste`.

### `StatCard.jsx` (default) — nuevo, antes vivía duplicado dentro de `Dashboard.jsx`

```jsx
import StatCard from '../../components/ui/StatCard';

<StatCard icon="payments" label="Recaudado" value="Q2000" tint="sec" sub="Este período" />
```

`tint`: `pri` (celeste, default) · `sec` (ámbar — úsalo para dinero/montos,
evita azul-sobre-azul) · `ter` (celeste alterno) · `err` (rosa) · `ok`
(verde). Card `liquid-glass rounded-[24px]` con chip de ícono + valor grande.

---

## 7. Cómo construir una página nueva del panel

1. **Layout**: la página vive bajo una ruta ya envuelta por `AdminLayout` /
   `LeaderLayout` / `VolunteerLayout` (el router ya lo resuelve) — no montes
   el layout a mano, y no vuelvas a llamar `useGlassSpecular()` desde la
   página (ya corre en el layout padre).
2. **Contenedor de página**: `<div className="p-6 max-w-5xl mx-auto">` (o
   `max-w-3xl` si es más angosta) — mismo patrón que `Dashboard.jsx`.
3. **Encabezado de sección** (opcional, para separar bloques dentro de la
   página): ícono `white/40` + label uppercase `text-[12.5px] text-white/40
   tracking-widest` + línea `flex-1 h-px bg-white/10` — ver `SectionLabel`
   en `Dashboard.jsx`.
4. **Cards de contenido**: `liquid-glass rounded-[24px] card-spring` (sección
   3). Formularios adentro usan `Input`/`Select`/`Textarea`. Botones de
   acción usan `Button`.
5. **Listas/tablas**: envolver en una sola card `liquid-glass rounded-[24px]
   overflow-hidden`, con `divide-y divide-white/8` entre filas y
   `hover:bg-white/5` por fila — no crear una card por fila (eso sí lo hace
   el collage público, no el admin).
6. **Estado vacío**: card `liquid-glass rounded-[24px] card-spring flex
   flex-col items-center py-20 gap-4`, con un ícono grande en un pozo
   `bg-white/8 rounded-[28px]` — patrón ya repetido en Eventos, Anuncios,
   Boletas, etc.
7. **Íconos**: siempre `<Icon name="..." />` (sección 4), nunca
   `<span className="ms">`.
8. **Badges de notificación en el nav** (si tu módulo tiene pendientes):
   agrega la entrada a `NAV_GROUPS` en `AdminLayout.jsx` con `badge:
   'nombre_del_contador'`, y el contador real en
   `hooks/useNotificationCounts.js` + el endpoint de kpis del backend.
9. **Verificar**: `npm run build` limpio, y probar en el navegador contra el
   backend real (login real, no mocks — mismo principio de "nada estático"
   que el público).

---

## 8. Diferencias con el público (no copiar esos patrones al admin)

| Patrón público | En el admin |
|---|---|
| `<Tilt glass>` (tilt 3D + framer-motion por card) | NO — usar solo `.liquid-glass card-spring` + `useGlassSpecular` (ya cubre el brillo, sin inclinación) |
| `<WindowStack>` (ventanas apiladas modales) | NO — el admin usa formularios inline/expandibles (`expand_more` como toggle) o rutas propias, nunca el patrón de ventana de galería |
| Collage desordenado (spans/rotaciones variados) | NO — el admin es grid/lista ordenada, es una herramienta de trabajo, no una vitrina editorial |
| `ParallaxImg` + foto de fondo por sección | NO — el admin no tiene fotos de fondo, usa los halos ambientales del layout (sección 1) |
| Fuente Arimo | Igual — se hereda global desde `index.css`, no hace falta nada especial en el admin |

---

## 9. Historial

Redise "diseñado" en jul-2026 (commit `e60203d`): reemplaza el MD3 viejo del
panel (roto — íconos de Material Symbols mostrando texto crudo cuando la
fuente tardaba en cargar, `StatCard` con texto invisible por bug de
contraste). Ver `project_casadelrey.md` (memoria) para el detalle de la
migración.
