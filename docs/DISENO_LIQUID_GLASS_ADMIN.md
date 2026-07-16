# Sistema de diseño "Liquid Glass" — Panel Admin/Líder/Voluntario

> Este documento es autocontenido: no asume que hayas leído nada más de este
> repositorio ni que conozcas el historial del proyecto. Si tu tarea es
> construir o modificar una página del panel de administración de esta app,
> lee esto completo antes de escribir código.

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
- Esas tres áreas comparten **un solo sistema visual**: "Liquid Glass" —
  fondo navy oscuro, cards de cristal translúcido con blur, texto blanco,
  acento azul (celeste). Es el mismo lenguaje que usa el sitio público de
  esta app, pero **sin fotos de fondo** (el admin es un panel de datos, no
  una página de marketing).
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

| Variable CSS | Clase Tailwind equivalente | Valor | Uso |
|---|---|---|---|
| `--bg` | `bg-bg` / `text-bg` | `#0A1526` | Canvas de fondo de toda la app (navy muy oscuro) |
| `--bg-soft` | `bg-bg-soft` | `#131F33` | Fondo sólido de inputs (NO de cards) |
| `--ink` | `text-white` (usar directo) | `#FFFFFF` | Texto principal |
| — | `text-white/50` | blanco 50% opacidad | Texto secundario |
| — | `text-white/40` | blanco 40% opacidad | Texto terciario / labels |
| `--celeste` | `bg-celeste` / `text-celeste` | `#3B82F6` | Acento primario: botón CTA, ítem activo del menú |
| `--celeste-hov` | `text-celeste-hov` | `#60A5FA` | Texto/ícono sobre fondos con tinte celeste |
| `--celeste-soft` | `bg-celeste-soft` | `#1E3A8A` | Fondo de chip/ícono con tinte celeste (úsalo con `/60` de opacidad, ej. `bg-celeste-soft/60`) |
| `--rose` / `--rose-soft` | `text-rose` / `bg-rose-soft` | `#F43F5E` / `#881337` | Error, cerrar sesión, rechazar, eliminar |
| `--amber` / `--amber-soft` | `text-amber` / `bg-amber-soft` | `#F59E0B` / `#78350F` | Advertencia, montos de dinero |
| `--emerald` / `--emerald-soft` | `text-emerald` / `bg-emerald-soft` | `#10B981` / `#064E3B` | Éxito, aprobado, verificado |

**Regla**: para bordes/divisores usa siempre blanco translúcido, nunca gris
sólido: `border-white/10` (borde normal), `divide-white/8` (separador entre
filas de una lista), `bg-white/8` (fondo "elevado" tenue, ej. un pozo de
ícono o un hover de fila).

---

## 2. Las clases de cristal (CSS)

Ya están definidas en `frontend/src/index.css` — no las reescribas, solo
aplícalas por nombre. Estas son las que importan para el panel admin:

### `.liquid-glass` — LA clase base de cualquier card

```css
.liquid-glass {
  background: linear-gradient(157deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.014) 55%, rgba(255,255,255,0.008) 100%);
  backdrop-filter: blur(8px) saturate(150%) brightness(1.05);
  border: 1px solid rgba(255, 255, 255, 0.11);
  box-shadow:
    inset 1.5px 2.5px 5px rgba(255, 255, 255, 0.26),
    inset -1.5px -2px 8px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.20),
    inset 0 -26px 40px -26px rgba(255, 255, 255, 0.15),
    0 24px 50px -20px rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: hidden;
}
```

Efecto visual: vidrio casi transparente (no opaca lo que hay detrás), con un
bisel de luz arriba-izquierda, un realce blanco tenue en el borde inferior
(como si la luz se concentrara en el filo del vidrio), y una sombra externa
que lo "despega" del fondo. Sube la intensidad un poco al hacer `:hover`
(ya incluido en la clase, no hace falta nada extra).

### `.glass-light` — el acento blanco, UN elemento por pantalla

El material por defecto de todo el sitio es `.liquid-glass` (oscuro). Existe
una segunda variante, `.glass-light` (cristal claro escarchado, texto navy
en vez de blanco), pero se usa con moderación a propósito:

- **Regla**: si el elemento flota sobre una **foto de fondo** (sitio
  público), usa `.glass-light` sobre la foto. Si no hay foto (panel admin),
  úsalo sobre el **halo ambiental más brillante** de la sección — nunca
  sobre navy liso sin nada de luz detrás, se ve como una caja blanca
  lechosa en vez de vidrio.
- **Nunca es el material dominante.** Como máximo UN elemento destacado por
  pantalla (la métrica más importante, un CTA principal) — el resto de la
  página se queda en `.liquid-glass`. Si todo es blanco, deja de leerse
  como acento.
- Igual que `.liquid-glass`, `.glass-light` usa un **gradiente diagonal**
  (no un `rgba()` plano) y un **bisel asimétrico** (borde superior/
  izquierdo más brillante que el inferior/derecho) — eso es lo que lo hace
  leer como vidrio curvo con o sin foto detrás.
- **Componente ya integrado**: `StatCard` (`components/ui/StatCard.jsx`)
  acepta `variant="light"` — úsalo en un solo `<StatCard>` por dashboard,
  nunca en toda la fila:
  ```jsx
  <StatCard icon="payments" label="Recaudado" value="Q2,000" variant="light" />
  ```

### El brillo especular ("como agua")

El pseudo-elemento `::after` de `.liquid-glass`/`.glass-light` dibuja el
punto de luz que sigue al cursor (alimentado por
`hooks/useGlassSpecular.js`, sección 5). Son 3 capas elípticas superpuestas
— núcleo caliente pequeño, halo de dispersión ancho, y un anillo tenue justo
en el borde del núcleo (el detalle de "refracción" que lo hace sentir
líquido en vez de un spot de luz genérico). La forma es elíptica, no
circular — el agua/vidrio real no refracta en un círculo perfecto. No lo
reinventes por página: ya está en `index.css`, cualquier `.liquid-glass`/
`.glass-light` lo hereda automáticamente.

### `.card-spring` — micro-interacción de hover, se combina con `.liquid-glass`

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
<div className="liquid-glass rounded-[24px] card-spring p-6">
  {/* contenido de la card */}
</div>
```

Radios estándar (elige según tamaño):
- `rounded-[24px]` → card normal (formulario, bloque de lista, panel)
- `rounded-[20px]` → card chica (preview de imagen, well de ícono mediano)
- `rounded-[28px]` → panel grande (sidebar completo, estado vacío grande)

Si la card NO es clicable/interactiva (por ejemplo, solo un contenedor
informativo estático), puedes omitir `card-spring` y dejar solo
`liquid-glass rounded-[24px]`.

### `.glass-light` — NO usar en el panel admin

Existe una variante clara (`glass-light`, cristal blanco escarchado con
texto navy) pensada para el sitio público cuando flota sobre una foto clara.
**En el panel admin no la uses** — todo el panel es sobre fondo oscuro, así
que siempre es `.liquid-glass`.

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

`Halos` pinta 2 blobs radiales celestes muy tenues (`opacity` 0.12-0.14,
`filter: blur(80px)`), posicionados absolutos. No necesitas tocarlo ni
repetirlo dentro de páginas individuales — ya está en los 3 layouts, cubre
toda página que renderice dentro de ellos.

**Por qué esto basta como "identidad visual" sin fotos**: el bisel de
`.liquid-glass` + el halo detrás + el brillo que sigue al cursor (sección 5)
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
  dentro de `frontend/src/components/ui/Glass.jsx`. Ya hay ~116 nombres
  cubiertos (usa nombres al estilo Material Symbols por convención:
  `dashboard`, `settings`, `article`, `calendar_month`, `delete`, `edit`,
  `add`, `save`, `check`, `close`, `search`, `person`, `groups`,
  `person_add`, `payments`, `visibility`, `warning`, `check_circle`, etc.).
- `className` — controla tamaño (`w-[Npx] h-[Npx]`) y color (clase de
  texto). El tamaño estándar en el panel es 16-22px según contexto.
- `stroke` — grosor de línea del SVG. `1.8` es el valor por defecto del
  panel; usa `2` en botones/acciones destacadas.

**Si necesitas un ícono que no existe todavía**: abre
`frontend/src/components/ui/Glass.jsx`, busca el objeto `const PATHS = {
... }` (arriba del archivo) y agrega tu entrada al final, o justo después
del objeto con la sintaxis de alias (`PATHS.nombre_nuevo = <><path
d="..."/></>;`). Sigue el mismo estilo de las entradas existentes:
`viewBox="0 0 24 24"` implícito (lo pone el componente `Icon`, no lo
repitas), trazos con `stroke="currentColor"` (también lo pone el
componente — tú solo defines los `<path>`/`<circle>`/`<polyline>` internos).
Si el ícono que necesitas es visualmente casi igual a uno que ya existe,
usa un alias en vez de duplicar el path:

```jsx
PATHS.mi_icono_nuevo = PATHS.check_circle; // reutiliza el mismo dibujo
```

---

## 5. El brillo que sigue al cursor (specular highlight)

Cada card `.liquid-glass` tiene un pseudo-elemento (`::after`) que dibuja un
punto de luz radial en la posición marcada por las variables CSS `--spec-x`
y `--spec-y`, con opacidad controlada por `--spec-o`. Esto ya está en
`index.css`, no lo toques.

Lo que sí necesitas saber: existe un hook, `frontend/src/hooks/useGlassSpecular.js`,
que **ya está activado una sola vez en cada uno de los 3 layouts**
(`AdminLayout`, `LeaderLayout`, `VolunteerLayout`). Es un único listener de
`pointermove`/`touchmove` a nivel de `document` que detecta cuál
`.liquid-glass` está bajo el cursor o el dedo, y mueve el brillo hacia esa
posición en tiempo real.

**Consecuencia práctica para ti**: no tienes que hacer nada para que una
card nueva tenga el efecto de brillo al pasar el cursor — basta con que le
pongas la clase `.liquid-glass`. El efecto es automático y global dentro de
cualquier página que viva bajo uno de los 3 layouts. Solo tendrías que
llamar el hook tú mismo (`useGlassSpecular()`, sin argumentos) si estuvieras
construyendo una CUARTA área de la app fuera de esos 3 layouts — algo que
normalmente no vas a necesitar.

---

## 6. Componentes de UI reutilizables

Todos viven en `frontend/src/components/ui/`. Impórtalos siempre en vez de
reescribir un botón/input/chip a mano.

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

Variantes disponibles y su look:
- `filled` — pill blanco sólido con texto navy (`bg-white text-bg`). Es el
  CTA primario, úsalo solo una vez por sección/formulario.
- `tonal` (o su alias `glass`) — `.liquid-glass` con texto blanco. **El más
  usado** para acciones secundarias/frecuentes.
- `outlined` — transparente con borde blanco translúcido.
- `text` — sin fondo ni borde, solo texto atenuado (`text-white/60`).

`size`: `sm | md | lg` (default `md`).

`IconButton` — botón circular de 40px para un solo ícono:
```jsx
<IconButton variant="standard" onClick={...}>
  <Icon name="close" className="w-[18px] h-[18px]" stroke={1.8} />
</IconButton>
```

### `Chip.jsx` (export default) + `FilterChip` (named export)

```jsx
import Chip, { FilterChip } from '../../components/ui/Chip';

<Chip color="primary" icon="tag">Activo</Chip>
<FilterChip selected={filtroActivo === 'pendientes'} onClick={...} count={5}>
  Pendientes
</FilterChip>
```

`color`: `default | primary | secondary | tertiary | error`. `icon` acepta
el mismo `name` que el componente `Icon` (sección 4).

### `Input.jsx` (export default) + `Select`, `Textarea` (named exports)

```jsx
import Input, { Select, Textarea } from '../../components/ui/Input';

<Input label="Título" value={titulo} onChange={e => setTitulo(e.target.value)} required />
<Select label="Rol" value={rol} onChange={...} options={[{ value: 'admin', label: 'Admin' }]} />
<Textarea label="Descripción" rows={4} value={desc} onChange={...} />
```

Todos usan por dentro la clase `.input-squircle` (fondo `--bg-soft`, borde
translúcido, anillo celeste al enfocar). No la apliques tú manualmente,
usa siempre estos componentes.

### `Paginator.jsx` (export default)

```jsx
import Paginator from '../../components/ui/Paginator';

<Paginator meta={{ page: 1, pages: 5, total: 42 }} onPage={setPage} />
```

### `StatCard.jsx` (export default) — para mostrar una métrica/KPI

```jsx
import StatCard from '../../components/ui/StatCard';

<StatCard icon="payments" label="Recaudado" value="Q2000" tint="sec" sub="Este período" />
```

`tint`: `pri` (celeste, default) · `sec` (ámbar — úsalo para dinero/montos)
· `ter` (celeste alterno, para variar visualmente en una fila de varias
stat cards) · `err` (rosa) · `ok` (verde). `sub` es opcional, texto chico
debajo del valor.

---

## 7. Receta paso a paso: construir una página nueva del panel

Supongamos que necesitas crear `frontend/src/pages/admin/AdminAlgo.jsx`.

**1. Estructura base de la página** (se renderiza dentro de `<AdminLayout>`,
que ya provee el sidebar, el fondo con halos, y el efecto de brillo — no
repitas nada de eso):

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
          <h1 className="text-[26px] text-white font-black leading-tight">Algo</h1>
          <p className="text-[13.5px] text-white/40 mt-1">{items.length} registros</p>
        </div>
        <Button variant="filled">
          <Icon name="add" className="w-[18px] h-[18px]" stroke={2} />
          Nuevo
        </Button>
      </div>

      {/* Lista dentro de UNA sola card de cristal, no una card por fila */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-white/15 border-t-celeste animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="liquid-glass rounded-[24px] card-spring flex flex-col items-center py-20 gap-4">
          <div className="w-16 h-16 rounded-[28px] bg-white/8 flex items-center justify-center">
            <Icon name="inbox" className="w-[32px] h-[32px]" stroke={1.8} />
          </div>
          <p className="text-[15px] text-white font-medium">Sin registros todavía</p>
        </div>
      ) : (
        <div className="liquid-glass rounded-[24px] overflow-hidden divide-y divide-white/8">
          {items.map(item => (
            <div key={item.ID} className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors">
              <span className="text-[13.5px] text-white font-medium">{item.name}</span>
              <Icon name="chevron_right" className="w-[18px] h-[18px] text-white/40" stroke={1.8} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**2. Regístrala en el router** (busca dónde están registradas las demás
rutas `/admin/*` en el archivo de rutas de React Router del proyecto — no
está documentado aquí porque cambia de nombre/ubicación con el tiempo,
pero sigue el mismo patrón que cualquier otra ruta `/admin/x` ya existente).

**3. Si necesita aparecer en el menú lateral**, edita
`frontend/src/components/layout/AdminLayout.jsx`: busca el array
`NAV_GROUPS` (una lista de secciones, cada una con `items: [{ to, icon,
label, badge? }]`) y agrega tu entrada al grupo que corresponda
semánticamente.

**4. Verifica antes de dar por terminado**:
- `cd frontend && npm run build` debe compilar sin errores.
- No debe quedar ningún `<span className="ms">` ni ningún nombre de ícono
  como texto plano en la UI — todo ícono va por `<Icon name="..." />`.
- Toda card usa `liquid-glass` + un radio `rounded-[Npx]` (nunca
  `bg-gray-800`, `bg-slate-900` ni ningún color sólido plano como fondo de
  card).

---

## 8. Errores comunes a evitar

- ❌ Poner una imagen de fondo en una página del admin — el admin no lleva
  fotos, usa los halos del layout (sección 3).
- ❌ Usar `box-shadow` o `backdrop-filter` escritos a mano en vez de la
  clase `.liquid-glass` — rompe la consistencia visual entre páginas.
- ❌ Crear una card de cristal por cada fila de una tabla larga — eso es
  carísimo visualmente y de rendimiento; una lista es UNA card con
  `divide-y divide-white/8` adentro.
- ❌ Un ícono como texto (`<span>delete</span>` o similar) — siempre
  `<Icon name="delete" />`.
- ❌ Colores sólidos planos como fondo de un botón/card fuera de la paleta
  de la sección 1 (nada de `bg-blue-500`, `bg-gray-800`, etc. — son de
  otro sistema de diseño y no van a combinar).
- ❌ Envolver cada card individualmente con un listener de mouse para el
  brillo — ya es automático (sección 5), no lo repitas.
