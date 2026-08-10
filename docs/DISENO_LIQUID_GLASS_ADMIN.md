# Sistema de diseño "Liquid Glass" — Panel Admin/Líder/Voluntario

> Este documento es autocontenido: no asume que hayas leído nada más de este
> repositorio ni que conozcas el historial del proyecto. Si tu tarea es
> construir o modificar una página del panel de administración de esta app,
> lee esto completo antes de escribir código.

> **Nota histórica (ago-2026):** esta guía describía originalmente un panel
> **oscuro** (mismo `.liquid-glass` navy que el sitio público). En jul-2026 el
> panel migró a **modo claro** (`bg-paper` + `.glass-light`) por legibilidad en
> pantallas de datos densos (tablas, formularios largos), pero el documento no
> se actualizó de inmediato. Varias páginas del panel (Ajustes, FAQs, Líderes,
> Destinos de donación, Voluntario, entre otras) se construyeron durante esa
> ventana siguiendo la versión vieja de esta guía — es la explicación más
> probable de por qué esas páginas se sienten "de otra época" comparadas con
> el resto. Esta versión describe el sistema real tal como existe hoy.

## 0. Contexto mínimo del proyecto

- Stack: **React 19 + Vite**, estilos con **Tailwind CSS** + clases custom
  definidas en `frontend/src/index.css`, sin librería de componentes UI
  externa (todo es propio, en `frontend/src/components/ui/`).
- La app tiene tres "áreas" de páginas protegidas por rol, cada una con su
  propio layout:
  - `frontend/src/pages/admin/*.jsx` — envuelto por
    `frontend/src/components/layout/AdminLayout.jsx`
  - `frontend/src/pages/leader/*.jsx` — envuelto por
    `frontend/src/components/layout/LeaderLayout.jsx`
  - `frontend/src/pages/volunteer/*.jsx` — envuelto por
    `frontend/src/components/layout/VolunteerLayout.jsx`
- Esas tres áreas comparten **un solo sistema visual**, variante CLARA de
  Liquid Glass: canvas off-white (`bg-paper`), cards de cristal blanco
  escarchado (`.glass-light`), tinta navy, acento celeste muy puntual. Es
  el mismo lenguaje de vidrio que el sitio público (mismo tipo de bisel,
  mismos radios, mismo motion), pero **invertido**: el público es oscuro con
  fotos reales de fondo; el panel es claro con halos ambientales en vez de
  fotos (el panel es una herramienta de datos, no una vitrina editorial).
- Todo lo que necesitas para construir en este sistema — colores, clases
  CSS, componentes reutilizables, íconos — está documentado abajo con
  ejemplos de código copiables. No hace falta ir a leer otros archivos del
  repo salvo que este documento te remita explícitamente a uno.

---

## 1. Paleta y tokens

Estos colores ya existen como variables CSS (`index.css`, bloque `:root`) y
como clases de Tailwind (`tailwind.config.js`). Úsalos por su nombre de clase
Tailwind directamente en `className`, nunca escribas un color hexadecimal
a mano en JSX.

| Clase Tailwind | Valor | Uso |
|---|---|---|
| `bg-paper` | `#F2F5FA` | Canvas de fondo de toda la app del panel (off-white frío, no blanco puro — para que las cards blancas resalten encima) |
| `text-bg` / `bg-bg` | `#0A1526` (navy) | **Doble rol**: tinta de texto principal Y color de acento sólido (botón primario, ítem de nav activo, pozo de ícono por defecto). Es el mismo token `--bg` que el sitio público usa como fondo — aquí se reutiliza como tinta, no como canvas. |
| `text-bg/60`, `/50`, `/45`, `/40` | navy con opacidad | Texto secundario, terciario, labels, metadatos — la opacidad reemplaza a los pasos de gris de un sistema tradicional |
| `border-bg/10`, `/12` | navy muy translúcido | Bordes generales, hairlines |
| `divide-bg/8` | navy muy translúcido | Separador entre filas de una lista (`divide-y divide-bg/8`) |
| `bg-bg/4`, `/6`, `/8` | navy muy translúcido | Fondo "elevado" tenue — hover de fila, pozo de ícono neutro. **Esto no reemplaza a una card** — ver aclaración en la sección 2. |
| `celeste` / `celeste-hov` | `#3B82F6` / `#60A5FA` | Acento puntual: focus ring, algún link, chip `primary`/`tertiary` — nunca color de bloque grande |
| `celeste-soft` | `#1E3A8A` | Pozo de ícono con tinte celeste (úsalo como fondo de un `well` chico, no de una superficie grande) |
| `rose` / `amber` / `emerald` | `#F43F5E` / `#F59E0B` / `#10B981` | Error, cerrar sesión, rechazar, eliminar · advertencia, montos de dinero · éxito, aprobado, verificado |

**Regla dura**: la marca de este panel es **monocromática navy + blanco** — el
celeste queda reservado para focus rings, enlaces puntuales y como mucho un
acento por pantalla, nunca como color de fondo de una fila entera de tarjetas.
Cita textual de un comentario real en `StatCard.jsx`: *"pri/ter usaban celeste
(azul brillante saturado) — se leía 'de juguete/IA'"*. El acento por defecto
de casi todo (pozos de ícono, nav activo, botón primario) es el mismo navy que
la tinta, no un azul nuevo.

**Nunca uses los alias legacy heredados de un sistema anterior**
(`border-pri`, `text-err`, `bg-err`, `bg-err-con`, `bg-sec-con`,
`text-on-sec-con`, `bg-ter-con`, `text-on-ter-con`, etc.). Técnicamente
resuelven al mismo color que sus equivalentes de la tabla de arriba, pero
delatan código de otra generación de diseño — usa siempre el nombre real
(`celeste`, `rose`, `amber`, `emerald`, `bg`).

### Colores del Sidebar (Admin y Líder)

| Elemento | Clase |
|---|---|
| Contenedor del sidebar | `glass-light rounded-[28px]` (card de cristal flotante, no un panel sólido) |
| Ítem de nav activo | `bg-bg text-white shadow-card` |
| Ítem de nav inactivo | `text-bg/60 hover:text-bg hover:bg-bg/6` |
| Separadores/bordes | `border-bg/10` |
| Badge de notificación | `bg-rose text-white` |

---

## 2. Las clases de cristal (CSS)

Ya están definidas en `frontend/src/index.css` — no las reescribas, solo
aplícalas por nombre.

### `.glass-light` — LA clase base de cualquier card del panel

```css
.glass-light {
  background: linear-gradient(155deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.42) 55%, rgba(255,255,255,0.28) 100%);
  backdrop-filter: blur(26px) saturate(180%) brightness(1.06);
  border: 1px solid rgba(255,255,255,0.7) rgba(255,255,255,0.42) rgba(255,255,255,0.42) rgba(255,255,255,0.62);
  box-shadow: /* bisel superior-izq + realce inferior + hairline + sombra externa, 6 capas */ …;
  position: relative;
  overflow: hidden;
}
```

Efecto visual: vidrio blanco escarchado translúcido, con un bisel de luz
arriba-izquierda, un realce blanco en el borde inferior, y una sombra externa
que lo despega del fondo (halos ambientales, sección 3). Sube la intensidad
un poco al hacer `:hover` (ya incluido en la clase). Es **la clase por
defecto de todo el panel** — donde la guía vieja decía "usa `.liquid-glass`",
ahora es `.glass-light`.

### `.glass-light-nested` — segunda capa, DENTRO de otra `.glass-light`

Más transparente que `.glass-light`. Referencia: el Control Center de iOS —
círculo de cristal dentro de otro círculo de cristal, cada capa más
transparente que la anterior, así se distinguen como capas de verdad y no
como una sola superficie plana repetida. **Necesita algo semi-opaco detrás**
(otro `.glass-light` o el halo brillante) — nunca la pongas directo sobre
`bg-paper` liso, se lava. `StatCard` acepta `nested` para este caso exacto
(ver sección 6).

### `.liquid-glass` — el material oscuro. NO se usa en este panel

`.liquid-glass` (cristal casi transparente sobre navy, texto blanco) es el
material del **sitio público**. En el panel admin/líder/voluntario, que es
siempre `bg-paper` claro, `.liquid-glass` se ve mal (fue diseñado para
oscurecer sobre navy, no para flotar sobre blanco). Si ves `.liquid-glass` en
una página de `pages/admin/`, `pages/leader/` o `pages/volunteer/`, es un
resto de una versión anterior — reemplázalo por `.glass-light`.

### El brillo especular ("como agua")

El pseudo-elemento `::after` de `.glass-light` dibuja el punto de luz que
sigue al cursor (alimentado por `hooks/useGlassSpecular.js`, sección 5). Ya
está en `index.css`, no lo toques — basta con poner la clase.

### `.card-spring` — micro-interacción de hover, se combina con `.glass-light`

```css
.card-spring {
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275),
              box-shadow 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275),
              border-radius 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.card-spring:hover {
  transform: translateY(-2px) scale(1.005);
  box-shadow: var(--sh-card-lg);
  border-radius: 20px; /* el radio "respira" un poco al hover */
}
```

**Patrón obligatorio para toda card**: las dos clases juntas, más un radio
explícito:

```jsx
<div className="glass-light rounded-[24px] card-spring p-6">
  {/* contenido de la card */}
</div>
```

Radios estándar (elige según tamaño):
- `rounded-[24px]` → card normal (formulario, bloque de lista, panel)
- `rounded-[20px]` → card chica (preview de imagen, well de ícono mediano)
- `rounded-[28px]` → panel grande (sidebar completo, estado vacío grande)

Si la card NO es clicable/interactiva (contenedor solo informativo), puedes
omitir `card-spring` y dejar solo `glass-light rounded-[24px]`.

### Aclaración importante: `.glass-light` real vs. "caja plana"

Una card real siempre es `.glass-light rounded-[Npx] card-spring` — con blur,
bisel de luz y brillo al cursor. **Esto no es lo mismo** que un `<div>` con
`bg-bg/4 border border-bg/10 rounded-2xl` sin la clase `.glass-light`: eso es
una caja plana sin ningún efecto de vidrio. En una captura de pantalla
estática pueden parecer similares; en la app real se nota de inmediato (sin
blur, sin bisel, sin brillo al mover el cursor, hover distinto). Varias
páginas del panel usan hoy la caja plana como si fuera una card — es
exactamente el patrón que esta reescritura busca prevenir hacia adelante.

Los usos legítimos de `bg-bg/4` / `bg-bg/6` / `bg-bg/8` **sin** `.glass-light`
son puntuales: el fondo de hover de una fila dentro de una lista
(`hover:bg-bg/8`), o un pozo de ícono neutro. Nunca como sustituto de una card
contenedora.

---

## 3. El fondo del panel: halos ambientales (sin fotos)

El sitio público de esta app pone fotos reales detrás del cristal. El panel
admin NO tiene fotos — en su lugar, cada layout (`AdminLayout.jsx`,
`LeaderLayout.jsx`, `VolunteerLayout.jsx`) monta un componente `<Halos
variant="section" />` una sola vez, como fondo ambiente fijo:

```jsx
import { Halos } from '../ui/Glass'; // frontend/src/components/ui/Glass.jsx

// dentro del layout, como hijo del contenedor raíz (position: relative):
<Halos variant="section" />
```

`Halos` pinta blobs radiales celestes muy tenues (`opacity` baja,
`filter: blur(80px)`), posicionados absolutos, sobre el canvas `bg-paper`. No
necesitas tocarlo ni repetirlo dentro de páginas individuales — ya está en
los 3 layouts, cubre toda página que renderice dentro de ellos.

**Por qué esto basta como "identidad visual" sin fotos**: el bisel de
`.glass-light` + el halo detrás + el brillo que sigue al cursor (sección 5)
ya dan la sensación de "vidrio real flotando sobre algo", sin necesitar una
imagen.

---

## 4. Íconos: SVG propios, nunca fuentes de íconos

**Regla dura**: nunca uses `<span className="material-icons">nombre</span>`
ni ninguna fuente de íconos por ligadura de texto. Esta app tuvo un bug real
por eso: si la fuente de íconos tardaba en cargar (o fallaba), el usuario
veía el nombre del ícono como texto plano en inglés ("delete", "campaign")
en vez del glifo. La solución fue un componente de íconos 100% SVG que no
depende de ninguna fuente externa.

Usa siempre:

```jsx
import { Icon } from '../../components/ui/Glass'; // ajusta la ruta relativa según profundidad

<Icon name="calendar_month" className="w-[22px] h-[22px] text-celeste-hov" stroke={1.8} />
```

Props de `Icon`:
- `name` (string, requerido) — debe existir como clave en el objeto `PATHS`
  dentro de `frontend/src/components/ui/Glass.jsx`. Antes de usar un nombre
  nuevo, **verifica que exista** (`grep -n "nombre:" frontend/src/components/ui/Glass.jsx`
  o busca el alias `PATHS.nombre = ...`) — un nombre inexistente no rompe la
  build, simplemente renderiza un SVG vacío en silencio.
- `className` — controla tamaño (`w-[Npx] h-[Npx]`) y color (clase de
  texto). El tamaño estándar en el panel es 16-22px según contexto.
- `stroke` — grosor de línea del SVG. `1.8` es el valor por defecto del
  panel; usa `2` en botones/acciones destacadas.

**Si necesitas un ícono que no existe todavía**: abre
`frontend/src/components/ui/Glass.jsx`, busca el objeto `const PATHS = {
... }` y agrega tu entrada, o usa un alias si el glifo ya existe con otro
nombre de Material Symbols (`PATHS.mi_icono_nuevo = PATHS.check_circle;`).

---

## 5. El brillo que sigue al cursor (specular highlight)

Cada card `.glass-light` tiene un pseudo-elemento (`::after`) que dibuja un
punto de luz radial en la posición marcada por las variables CSS `--spec-x`
y `--spec-y`, con opacidad controlada por `--spec-o`. Ya está en `index.css`,
no lo toques.

Lo que sí necesitas saber: existe un hook, `frontend/src/hooks/useGlassSpecular.js`,
que **ya está activado una sola vez en cada uno de los 3 layouts**
(`AdminLayout`, `LeaderLayout`, `VolunteerLayout`). Es un único listener de
`pointermove`/`touchmove` a nivel de `document` que detecta cuál
`.glass-light` está bajo el cursor o el dedo, y mueve el brillo hacia esa
posición en tiempo real.

**Consecuencia práctica para ti**: no tienes que hacer nada para que una
card nueva tenga el efecto de brillo al pasar el cursor — basta con que le
pongas la clase `.glass-light`. Solo tendrías que llamar el hook tú mismo
(`useGlassSpecular()`, sin argumentos) si estuvieras construyendo una CUARTA
área de la app fuera de esos 3 layouts.

---

## 6. Componentes de UI reutilizables

Todos viven en `frontend/src/components/ui/`. Impórtalos siempre en vez de
reescribir un botón/input/chip a mano — **el error más repetido en este
panel a la fecha de esta reescritura es reinventar el campo de formulario**
(ver sección 8).

### `Button.jsx` (export default) + `IconButton`, `FAB` (named exports)

```jsx
import Button, { IconButton, FAB } from '../../components/ui/Button';

<Button variant="filled">Guardar</Button>
<Button variant="tonal">Cancelar</Button>
<Button variant="outlined">Ver más</Button>
<Button variant="text">Omitir</Button>
<Button size="sm" onClick={...}>Acción chica</Button>
<Button as="link" to="/admin/eventos">Ir a Eventos</Button>
```

Variantes disponibles y su look real:
- `filled` — pill navy sólido, texto blanco (`bg-bg text-white shadow-card`).
  Es el CTA primario — el mismo pill que el botón principal del sitio
  público, úsalo solo una vez por sección/formulario.
- `tonal` / `glass` / `elevated` — las tres son `.glass-light text-bg` (
  `elevated` además suma `shadow-card-lg`). **Las más usadas** para acciones
  secundarias/frecuentes.
- `outlined` — transparente con borde navy translúcido (`border-bg/20`).
- `text` — sin fondo ni borde, solo texto atenuado (`text-bg/60`).

`size`: `sm | md | lg` (default `md`).

`IconButton` — botón circular de 40px. Recibe el ícono como **children**, no
como prop:

```jsx
<IconButton variant="standard" onClick={...} title="Cerrar">
  <Icon name="close" className="w-[18px] h-[18px]" stroke={1.8} />
</IconButton>
```

`variant`: `standard | filled | tonal | outlined`.

### `Chip.jsx` (export default) + `FilterChip` (named export)

```jsx
import Chip, { FilterChip } from '../../components/ui/Chip';

<Chip color="primary" icon="tag">Activo</Chip>
<FilterChip selected={filtroActivo === 'pendientes'} onClick={...} count={5}>
  Pendientes
</FilterChip>
```

`color`: `default` (tinte navy neutro) · `primary` (tinte celeste) ·
`secondary` (navy sin tinte, texto a opacidad completa) · `tertiary` (celeste,
variante alterna) · `error` (rose). `FilterChip` seleccionado es un pill navy
sólido (`bg-bg text-white`) con un check.

### `Input.jsx` (export default) + `Select`, `Textarea` (named exports)

```jsx
import Input, { Select, Textarea } from '../../components/ui/Input';

<Input label="Título" value={titulo} onChange={e => setTitulo(e.target.value)} required />
<Select label="Rol" value={rol} onChange={...} options={[{ value: 'admin', label: 'Admin' }]} />
<Textarea label="Descripción" rows={4} value={desc} onChange={...} />
```

Todos usan por dentro la clase `.input-light` (fondo blanco translúcido,
hairline navy, anillo celeste al enfocar). **No la apliques tú manualmente ni
definas tu propio `const fieldCls = '...'` local** — usa siempre estos
componentes. Aceptan `label`, `error`, `helperText`, `size` (`sm|md|lg`), y
cualquier prop nativa de `<input>`/`<select>`/`<textarea>` por spread.

### `Paginator.jsx` (export default)

```jsx
import Paginator from '../../components/ui/Paginator';

<Paginator meta={{ page: 1, pages: 5, total: 42 }} onPage={setPage} />
```

Cualquier lista que pueda crecer sin límite (usuarios, boletas, reportes,
donaciones…) debería paginar con esto en vez de cargar la colección
completa de una sola vez.

### `StatCard.jsx` (export default) — para mostrar una métrica/KPI

```jsx
import StatCard from '../../components/ui/StatCard';

<StatCard icon="payments" label="Recaudado" value="Q2000" tint="sec" sub="Este período" />
```

`tint`: `pri` (pozo navy sólido, **default** — no celeste) · `sec` (ámbar,
úsalo para dinero/montos) · `ter` (pozo con tinte celeste suave, para variar
visualmente en una fila de varias stat cards) · `err` (rosa) · `ok` (verde).
El pozo de ícono es siempre color **sólido** con el glifo en blanco (estilo
iOS Ajustes), nunca un tinte transparente. `sub` es opcional, texto chico
debajo del valor.

`variant`: `light` (default, `.glass-light`) — no cambies esto a `dark` salvo
que estés construyendo algo explícitamente sobre canvas oscuro (no ocurre
hoy en el panel).

`nested`: `true` → usa `.glass-light-nested` en vez de `.glass-light`, para
cuando la card vive DENTRO de otro contenedor `.glass-light` (ej. una fila de
stats dentro del panel del Dashboard). Si la card va directo sobre el canvas
o los halos (sin nada semi-opaco detrás), deja `nested` en `false` — si no,
se lava y pierde contraste.

---

## 7. Receta paso a paso: construir una página nueva del panel

Supongamos que necesitas crear `frontend/src/pages/admin/AdminAlgo.jsx`.

**1. Estructura base de la página** (se renderiza dentro de `<AdminLayout>`,
que ya provee el sidebar, el canvas `bg-paper`, los halos, y el efecto de
brillo — no repitas nada de eso):

```jsx
import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import Button from '../../components/ui/Button';
import { Icon } from '../../components/ui/Glass';

export default function AdminAlgo() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/admin/algo')
      .then(r => setItems(r.data?.data || r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-headline-s text-bg font-black leading-tight">Algo</h1>
          <p className="text-body-s text-bg/50 mt-0.5">{items.length} registros</p>
        </div>
        <Button variant="filled">
          <Icon name="add" className="w-[18px] h-[18px]" stroke={2} />
          Nuevo
        </Button>
      </div>

      {/* Lista dentro de UNA sola card de cristal, no una card por fila */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-pri animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="glass-light rounded-[24px] card-spring flex flex-col items-center py-20 gap-4">
          <div className="w-16 h-16 rounded-[28px] bg-bg/8 flex items-center justify-center">
            <Icon name="inbox" className="w-[32px] h-[32px] text-bg/50" stroke={1.8} />
          </div>
          <p className="text-body-l text-bg font-medium">Sin registros todavía</p>
        </div>
      ) : (
        <div className="glass-light rounded-[24px] card-spring overflow-hidden divide-y divide-bg/8">
          {items.map(item => (
            <div key={item.ID} className="flex items-center justify-between p-5 hover:bg-bg/6 transition-colors">
              <span className="text-body-s text-bg font-medium">{item.name}</span>
              <Icon name="chevron_right" className="w-[18px] h-[18px] text-bg/40" stroke={1.8} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**2. Regístrala en el router** (`frontend/src/router.jsx`, sigue el mismo
patrón que cualquier otra ruta `/admin/x` ya existente — lazy-loaded con
`Suspense`).

**3. Si necesita aparecer en el menú lateral**, edita
`frontend/src/components/layout/AdminLayout.jsx`: busca el array
`NAV_GROUPS` y agrega tu entrada al grupo que corresponda semánticamente.

**4. Verifica antes de dar por terminado**:
- `cd frontend && npm run build` debe compilar sin errores.
- No debe quedar ningún `<span className="ms">` ni ningún nombre de ícono
  como texto plano en la UI — todo ícono va por `<Icon name="..." />`.
- Toda card usa `glass-light` + un radio `rounded-[Npx]` (nunca
  `.liquid-glass`, `bg-gray-800`, `bg-slate-900` ni ningún color sólido plano
  como fondo de card).
- Todo campo de formulario usa `Input`/`Select`/`Textarea` — no un
  `fieldCls` local.

---

## 8. Errores comunes a evitar

- ❌ Poner una imagen de fondo en una página del admin — el admin no lleva
  fotos, usa los halos del layout (sección 3).
- ❌ Usar `.liquid-glass` (el material oscuro del sitio público) en cualquier
  página de `pages/admin/`, `pages/leader/` o `pages/volunteer/` — no combina
  con el canvas claro. Es del sitio público, no de aquí.
- ❌ Usar `box-shadow` o `backdrop-filter` escritos a mano (por `className`
  arbitraria o por `style` inline) en vez de la clase `.glass-light` — rompe
  la consistencia visual entre páginas, y un `style` inline **anula** el
  `box-shadow` real de la clase aunque la clase siga puesta (pasó de verdad
  en `ModalWrapper.jsx` hasta que se corrigió en ago-2026).
- ❌ Reinventar el campo de formulario a mano (`const fieldCls = '...'`
  seguido de `<input className={fieldCls}>`) en vez de importar
  `Input`/`Select`/`Textarea` de `components/ui/Input.jsx`. Es, por lejos, el
  error más repetido del panel: a la fecha de esta reescritura, más de 20
  archivos lo hacían, cada uno con un radio de borde ligeramente distinto
  (algunos `4px`, otros `24px`) para el mismo tipo de campo.
- ❌ Usar los alias de color heredados de un sistema anterior (`border-pri`,
  `text-err`, `bg-err-con`, `bg-sec-con`, `text-on-sec-con`, `bg-ter-con`,
  etc.) — aunque resuelvan al mismo color, usa siempre el nombre real de la
  sección 1 (`celeste`, `rose`, `amber`, `emerald`, `bg`).
- ❌ Crear una card de cristal por cada fila de una tabla/lista larga — eso es
  caro visualmente y de rendimiento; una lista es UNA card con
  `divide-y divide-bg/8` adentro.
- ❌ Un ícono como texto (`<span>delete</span>` o similar) — siempre
  `<Icon name="delete" />`. Y verifica que el `name` exista de verdad en
  `PATHS` de `Glass.jsx` antes de usarlo — un nombre inexistente no avisa,
  solo deja el ícono vacío.
- ❌ Pasarle a `IconButton` un prop `icon="..."` — el componente no lo
  soporta, solo renderiza `children`. Siempre `<IconButton><Icon
  name="..." /></IconButton>`.
- ❌ Colores sólidos planos como fondo de un botón/card fuera de la paleta
  de la sección 1 (nada de `bg-blue-500`, `bg-gray-800`, etc. — son de otro
  sistema de diseño y no van a combinar).
- ❌ Envolver cada card individualmente con un listener de mouse para el
  brillo — ya es automático (sección 5), no lo repitas.
