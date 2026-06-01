# Design Spec — Casa del Rey
> Referencia completa para diseño de UI/UX · Mayo 2026

---

## Índice
1. [Paleta de colores](#1-paleta-de-colores)
2. [Tipografía](#2-tipografía)
3. [Espaciado y bordes](#3-espaciado-y-bordes)
4. [Componentes base](#4-componentes-base)
5. [Íconos](#5-íconos)
6. [Layouts](#6-layouts)
7. [Sitio público — todas las pantallas](#7-sitio-público)
8. [Panel Admin — todas las pantallas](#8-panel-admin)
9. [Panel Líder — todas las pantallas](#9-panel-líder)
10. [Panel Voluntario — pantallas nuevas](#10-panel-voluntario-nuevo)
11. [Flujos de navegación por rol](#11-flujos-de-navegación)
12. [Estados de UI](#12-estados-de-ui)

---

## 1. Paleta de colores

### Colores de marca (usar en todo el diseño)

| Nombre | Uso | Hex |
|---|---|---|
| **Azul marino** | Sidebar, headers, hero, botones primarios | `#0D1B4B` |
| **Azul marino hover** | Estado hover sobre marino | `#162260` |
| **Celeste** | Acentos, links, badges, iconos activos | `#4A90D9` |
| **Celeste claro** | Fondos de chips, contenedores de acento | `#D6E8FA` |
| **Blanco** | Texto sobre marino, superficies claras, fondo principal | `#FFFFFF` |
| **Negro texto** | Texto principal sobre fondo blanco | `#0A0A0A` |
| **Gris superficie** | Fondo de páginas, cards secundarias | `#F4F6FB` |
| **Gris borde** | Bordes de inputs, separadores | `#D1D5E0` |
| **Gris texto suave** | Labels, placeholders, texto secundario | `#6B7280` |
| **Rojo error** | Errores, alertas destructivas, badges de notificación | `#DC2626` |
| **Verde éxito** | Confirmaciones, estados aprobados | `#16A34A` |
| **Amarillo advertencia** | Estados pendientes | `#D97706` |

### Tokens semánticos

| Token | Color | Ejemplo de uso |
|---|---|---|
| `surface` | `#FFFFFF` | Fondo de cards, modales |
| `surface-dim` | `#F4F6FB` | Fondo de página |
| `on-surface` | `#0A0A0A` | Texto principal |
| `on-surface-muted` | `#6B7280` | Texto secundario, placeholders |
| `primary` | `#0D1B4B` | Botón primario, sidebar |
| `primary-hover` | `#162260` | Hover de botón primario |
| `accent` | `#4A90D9` | Links, íconos activos, bordes focus |
| `accent-surface` | `#D6E8FA` | Chip de categoría, badge suave |
| `border` | `#D1D5E0` | Bordes generales |
| `error` | `#DC2626` | Errores |
| `success` | `#16A34A` | Éxito |
| `warning` | `#D97706` | Pendiente |

### Colores del Sidebar (ambos paneles: Admin y Líder)

| Elemento | Color |
|---|---|
| Fondo sidebar | `#0D1B4B` |
| Ítem activo fondo | `rgba(255,255,255, 0.12)` |
| Ítem activo texto | `#FFFFFF` |
| Ítem inactivo texto | `rgba(255,255,255, 0.55)` |
| Separadores/bordes | `rgba(255,255,255, 0.10)` |
| Badge notificación | `#DC2626` con texto blanco |

---

## 2. Tipografía

**Fuente:** Inter (Google Fonts)
**Weights usados:** 400, 500, 600, 700, 900

### Escala de tamaños

| Nombre | Tamaño | Weight | Uso |
|---|---|---|---|
| Display L | 56px / clamp | 900 | Hero principal, titulares de landing |
| Display M | 44px / clamp | 800 | Secciones de impacto |
| Display S | 36px | 800 | Títulos de página pública |
| Headline L | 32px | 700 | Títulos de sección |
| Headline M | 28px | 700 | Subtítulos de sección |
| Headline S | 24px | 600 | Títulos de card grandes |
| Title L | 22px | 600 | Títulos de card normales |
| Title M | 16px | 600 | Labels de formulario, subheadings |
| Title S | 14px | 600 | Labels menores, nav items |
| Body L | 16px | 400 | Texto de cuerpo largo |
| Body M | 15px | 400 | Texto general de UI |
| Body S | 14px | 400 | Texto secundario, descripciones |
| Label L | 14px | 600 | Botones, chips, badges |
| Label M | 12px | 600 | Etiquetas pequeñas |
| Label S | 11px | 600 | Metadatos, fechas en cards |

---

## 3. Espaciado y bordes

### Grid
- Contenedor máximo: `1280px` centrado con padding lateral `16px` (móvil) / `32px` (desktop)
- Columnas: 12 col desktop, 4 col móvil
- Gap base: `16px`

### Espaciado (múltiplos de 4px)
`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 128`

### Radios de borde
| Nombre | Valor | Uso |
|---|---|---|
| xs | 4px | Chips pequeños, badges |
| sm | 8px | Inputs, botones small |
| md | 12px | Cards, botones normales |
| lg | 16px | Cards grandes, modales |
| xl | 28px | Cards hero, FAB |
| full | 9999px | Avatares, pills |

### Sombras
| Nombre | Uso |
|---|---|
| elev-1 | Cards en reposo |
| elev-2 | Cards hover, dropdowns |
| elev-3 | Modales, drawers |
| elev-4 | Tooltips, popovers |

---

## 4. Componentes base

### Button
Variantes:
- **Filled** — fondo `primary`, texto blanco. Hover: `primary-hover`
- **Filled accent** — fondo `accent`, texto blanco
- **Outlined** — borde `border`, texto `on-surface`. Hover: fondo `surface-dim`
- **Ghost / Text** — sin fondo ni borde, texto `accent`. Hover: fondo `accent-surface`
- **Destructive** — fondo `error`, texto blanco

Tamaños:
- sm: `height 32px`, padding `8px 16px`, texto Label M
- md: `height 40px`, padding `10px 20px`, texto Label L
- lg: `height 48px`, padding `12px 24px`, texto Title S

Estados: default · hover · active · disabled (opacity 40%, no pointer-events) · loading (spinner inline)

Puede tener ícono a la izquierda o derecha del label.

---

### Input
- Height: `48px` (md), `40px` (sm)
- Border: 1px `border` color
- Border focus: 2px `accent` color
- Border error: 2px `error` color
- Label flotante arriba del input (12px, color `on-surface-muted`)
- Texto de error debajo en rojo (Label S)
- Texto de ayuda debajo en gris (Label S)
- Puede tener ícono leading o trailing

Variantes: text · password (toggle ver/ocultar) · number · textarea · select / dropdown · date

---

### Card
- Fondo: `surface` (#FFFFFF)
- Border: 1px `border`
- Radius: `md` (12px) o `lg` (16px)
- Sombra: `elev-1` en reposo, `elev-2` en hover
- Padding interno: `16px` (sm), `24px` (md), `32px` (lg)

---

### Chip / Badge
- Altura: `24px` (small), `32px` (medium)
- Radius: `full`
- Variantes de color: primary (marino), accent (celeste), success (verde), warning (amarillo), error (rojo), neutral (gris)
- Texto: Label M o Label S en blanco/oscuro según contraste

---

### Tabla (usada en paneles admin y líder)
- Header: fondo `surface-dim`, texto Title S, peso 600
- Filas: fondo `surface` alternado con `surface-dim` (striped)
- Hover de fila: fondo `accent-surface`
- Bordes: `border` color 1px
- Última columna: acciones (íconos de editar/eliminar/ver)
- Responsive: en móvil colapsa a cards apiladas

---

### Modal / Dialog
- Overlay: `rgba(0,0,0,0.5)`
- Contenedor: fondo `surface`, radius `lg`, sombra `elev-3`
- Max-width: `480px` (sm), `640px` (md), `800px` (lg)
- Estructura: título + subtítulo + contenido + acciones (botones alineados a la derecha)
- Botón cerrar (X) en esquina superior derecha

---

### Toast / Notificación inline
- Posición: esquina inferior derecha
- Variantes: success (verde), error (rojo), info (celeste), warning (amarillo)
- Auto-dismiss: 3-4 segundos
- Ícono + mensaje + botón opcional "Deshacer"

---

### Paginador
- Botones anterior / siguiente
- Números de página con el actual resaltado en `primary`
- Label "Mostrando X–Y de Z resultados" encima o debajo

---

### Selector de tipo de célula
Nuevo componente (requerimiento nuevo):
- Dropdown o segmented control con 5 opciones:
  - Hombres (H)
  - Mujeres (M)
  - Jóvenes (J)
  - Prejuveniles (P)
  - Niños (N)
- Campo numérico al lado para el número (1, 2, 3…)
- Preview del código resultante: ej. "H2", "M1", "J3"

---

## 5. Íconos

**Sistema:** Material Symbols Rounded (Google)
**Tamaños usados:** 18px (nav), 20px (inline), 24px (acciones), 28px (illustrativos)
**Fill:** 1 (filled) para activos/destacados, 0 (outlined) para secundarios

### Íconos clave del proyecto

| Ícono | Nombre Material | Uso |
|---|---|---|
| dashboard | dashboard | Nav admin: inicio |
| manage_accounts | manage_accounts | Nav: usuarios |
| article | article | Nav: blog |
| calendar_month | calendar_month | Nav: eventos |
| campaign | campaign | Nav: anuncios |
| volunteer_activism | volunteer_activism | Nav: peticiones/oración |
| group_add | group_add | Nav: voluntarios |
| groups | groups | Nav: células |
| person_add | person_add | Nav: nuevos/boletas |
| photo_library | photo_library | Nav: galería |
| share | share | Nav: redes sociales |
| history | history | Nav: actividad |
| person | person | Nav: perfil |
| home | home | Nav líder: inicio |
| contacts | contacts | Nav: directorio |
| check_circle | check_circle | Estado aprobado |
| cancel | cancel | Estado rechazado |
| pending | pending | Estado pendiente |
| edit | edit | Acción editar |
| delete | delete | Acción eliminar |
| visibility | visibility | Acción ver |
| add | add | Acción agregar |
| download | download | Acción descargar |
| upload | upload | Subir archivo |
| logout | logout | Cerrar sesión |
| public | public | Ver sitio web |
| church | church | Logo/identidad |
| favorite | favorite | Oración/petición |
| task_alt | task_alt | Meta completada |
| photo_camera | photo_camera | Foto de célula |
| location_on | location_on | Dirección |
| phone | phone | Teléfono |

---

## 6. Layouts

### Layout Público (Header + contenido + Footer)

```
┌─────────────────────────────────────────┐
│  HEADER (sticky, h-16)                  │
│  Logo | Nav links | Botón Login         │
├─────────────────────────────────────────┤
│                                         │
│  CONTENIDO DE PÁGINA                    │
│                                         │
├─────────────────────────────────────────┤
│  FOOTER                                 │
│  Logo | Links | Redes | Copyright       │
└─────────────────────────────────────────┘
```

**Header:**
- Fondo: blanco con sombra suave al hacer scroll
- Logo a la izquierda
- Links de nav al centro: Inicio · Nosotros · Blog · Eventos · Galería · Voluntarios · Donar
- Botón "Ingresar" a la derecha (outlined, pequeño)
- En móvil: hamburger menu → drawer lateral

**Footer:**
- Fondo: azul marino (`#0D1B4B`)
- Texto blanco
- 3 columnas: logo+descripción | links rápidos | redes sociales
- Copyright abajo centrado

---

### Layout Admin (Sidebar fijo + contenido scrolleable)

```
┌──────────┬────────────────────────────────┐
│          │  (topbar móvil, oculto desktop)│
│ SIDEBAR  ├────────────────────────────────┤
│  w-240px │                                │
│  marino  │  CONTENIDO DE PÁGINA           │
│          │  (scroll vertical)             │
│  Nav     │                                │
│  items   │                                │
│          │                                │
│  ──────  │                                │
│  User    │                                │
│  Logout  │                                │
└──────────┴────────────────────────────────┘
```

- Sidebar: ancho fijo 240px, fondo `#0D1B4B`, oculto en móvil
- Contenido: fondo `surface-dim` (#F4F6FB), padding `24px`
- En móvil: topbar con hamburger → drawer lateral con overlay

**Estructura interna de cada página admin:**
```
┌─────────────────────────────────────────┐
│ Page Header                             │
│ Título de página    [Botón acción ppal] │
├─────────────────────────────────────────┤
│ Filtros / búsqueda (opcional)           │
├─────────────────────────────────────────┤
│ Contenido principal                     │
│ (tabla / grid de cards / formulario)   │
├─────────────────────────────────────────┤
│ Paginación (si aplica)                  │
└─────────────────────────────────────────┘
```

---

### Layout Líder (igual que Admin, sidebar diferente)

Mismo patrón de sidebar. El sidebar del líder tiene menos ítems:
- Inicio · Células · Nuevos · Voluntarios · Directorio · Perfil

---

### Layout Voluntario (nuevo — simplificado)

```
┌─────────────────────────────────────────┐
│ TOPBAR (h-16)                           │
│ Logo  |  Bienvenido, [nombre]  | Logout │
├─────────────────────────────────────────┤
│                                         │
│  CONTENIDO                              │
│  (sin sidebar, centrado, max-w-800px)   │
│                                         │
└─────────────────────────────────────────┘
```

---

## 7. Sitio Público

### 7.1 Home `/`

**Secciones en orden:**

1. **Hero**
   - Fondo: azul marino (`#0D1B4B`) con grid punteado decorativo
   - Título grande (Display L): "Casa del Rey" o frase principal
   - Subtítulo (Body L): descripción breve de la iglesia
   - 2 botones: "Conoce más" (filled blanco) y "Únete" (outlined blanco)
   - Imagen/logo a la derecha (desktop) o centrado (móvil)

2. **Sección Nosotros** (breve, 2 columnas)
   - Texto descriptivo + imagen

3. **Próximos Eventos** (cards horizontales, máx 3)
   - Card: fecha | título | lugar | botón RSVP

4. **Feed de Blog** (cards, máx 3 posts recientes)
   - Card: imagen | título | excerpt | botón "Leer más"
   - Si el post tiene `redirect_url`: botón "Ver en [red social]" con ícono

5. **Sección Donaciones** (CTA)
   - Fondo celeste suave o marino
   - Texto + botón "Donar ahora"

6. **Sección Voluntarios** (CTA)
   - Texto + botón "Quiero servir"

7. **Feed Social** (galería o embeds de Instagram/Facebook)

---

### 7.2 Nosotros `/about`

- Hero de página (PageHero): foto de fondo + título "Nosotros"
- Historia de la iglesia (texto largo)
- Visión y misión (2 columnas)
- Pastores / liderazgo (cards con foto, nombre, cargo)
- CTA al final: "Visítanos" o "Únete"

---

### 7.3 Blog `/blog`

**Lista de posts:**
- Grid de cards (3 columnas desktop, 2 tablet, 1 móvil)
- Card contiene: imagen de portada | categoría chip | título | excerpt | fecha | autor

**Post individual `/blog/:slug`:**
- Imagen de portada full-width
- Título (Display S)
- Autor + fecha (Label M, gris)
- Contenido enriquecido (Tiptap HTML renderizado con clase `.prose`)
- **[NUEVO]** Si el post tiene `redirect_url`:
  - Banner o botón destacado: "Ver publicación original en [Instagram/Facebook/YouTube]"
  - Ícono de la red social correspondiente
  - Abre en nueva pestaña
- Posts relacionados al final (3 cards)

---

### 7.4 Eventos `/events`

- Calendario mensual (react-big-calendar) o lista de eventos
- Filtro: próximos / pasados
- Card de evento: título | fecha | hora | lugar | descripción | botón RSVP

**Modal de RSVP:**
- Campos: nombre, email, teléfono, cantidad de asistentes, notas
- Si el evento requiere pago (futuro): indicador de precio

---

### 7.5 Galería `/gallery`

- Grid masonry o uniforme de fotos
- Click en foto: modal con imagen grande y descripción
- Filtro por evento (dropdown)

---

### 7.6 Oración `/prayer`
**[CAMBIO]** Ya no es pública. Requiere login con rol `leader` o `admin`.

- Si no está logueado: redirige a `/login` con mensaje "Necesitas acceso de líder para acceder a oraciones"
- Si está logueado con rol incorrecto: página 403 con mensaje descriptivo

**Vista para líderes/admins:**
- Formulario: nombre, categoría (personal/familia/salud/ministerio), asunto, mensaje
- Lista de peticiones propias con estado (respondida / pendiente)

---

### 7.7 Voluntariado `/volunteering`

- Hero con descripción del voluntariado
- Grid de departamentos (10 cards):
  1. Alabanza — ícono musical_note
  2. Danza — ícono self_improvement
  3. Servidores — ícono handshake
  4. Protocolo — ícono star
  5. Pancartas — ícono flag
  6. Maestros de niños — ícono child_care
  7. Técnicos audiovisuales — ícono settings_input_hdmi
  8. Multimedia — ícono devices
  9. Oración — ícono favorite
  10. Logística — ícono local_shipping

- Click en departamento: formulario de registro inline o modal
  - Campos: nombre, email, teléfono, departamento (pre-seleccionado), mensaje/motivación

---

### 7.8 Donaciones `/donate`

- Descripción del propósito
- Métodos disponibles:
  - Transferencia bancaria (muestra datos de cuenta)
  - Tigo Money (muestra número)
  - Presencial
- Formulario de registro de donación: nombre, email, monto, método, referencia, subir comprobante
- Botón: "Registrar donación"
- Mensaje post-envío: "Tu donación fue registrada, será verificada por el equipo"

---

### 7.9 Login `/login`

- Card centrado (max-w-400px)
- Logo arriba
- Título "Bienvenido de vuelta"
- Inputs: email, contraseña (toggle ver/ocultar)
- Link "¿Olvidaste tu contraseña?"
- Botón "Ingresar" (filled, full-width)
- Redirección post-login según rol:
  - `admin` → `/admin`
  - `leader` → `/leader`
  - `volunteer` → `/volunteer/dashboard` (nuevo)
  - `member` → `/profile`

---

### 7.10 Recuperar contraseña `/forgot-password` y `/reset-password/:token`

- Forgot: input email + botón enviar
- Reset: inputs nueva contraseña + confirmar + botón guardar
- Mensajes de éxito/error claros

---

### 7.11 Verificar email `/verify-email`

- Pantalla de confirmación con ícono grande
- Mensaje de éxito o error
- Botón "Ir al inicio"

---

### 7.12 Perfil `/profile`

- Datos del usuario: nombre, email, rol, código célula
- Sección de metas personales:
  - Lista de metas con progreso (completada / pendiente)
  - Botón "Nueva meta"
  - Card de meta: título | descripción | fecha límite | toggle completar | botón eliminar

---

## 8. Panel Admin

> Acceso exclusivo: rol `admin`
> Layout: sidebar marino de 240px + contenido

### Navegación del Sidebar Admin

| Ítem | Ruta | Badge |
|---|---|---|
| Dashboard | `/admin` | — |
| Usuarios | `/admin/users` | — |
| Blog | `/admin/blog` | — |
| Eventos | `/admin/events` | — |
| Anuncios | `/admin/announcements` | — |
| Peticiones | `/admin/petitions` | Nuevas sin leer |
| Voluntarios | `/admin/volunteers` | Pendientes de revisión |
| Células | `/admin/cell-reports` | Reportes por aprobar |
| Nuevos | `/admin/boletas` | — |
| Galería | `/admin/gallery` | — |
| Redes | `/admin/social` | — |
| Actividad | `/admin/activity-log` | — |
| Perfil | `/admin/profile` | — |

---

### 8.1 Dashboard `/admin`

**Fila de KPI cards (4 columnas):**
- Total miembros
- Nuevos este mes
- Donaciones del mes (Q)
- Voluntarios activos

**Segunda fila:**
- Gráfico de línea: crecimiento de miembros por mes (Recharts)
- Gráfico de dona: distribución de tipos de célula

**Tercera fila:**
- Lista de últimos reportes de células (5 filas, estado como chip)
- Lista de últimas donaciones (5 filas)

---

### 8.2 Usuarios `/admin/users`

**Layout:** tabla + buscador + filtro de rol

**Tabla columnas:**
- Nombre | Email | Rol (chip de color) | Código célula | Tipo célula | Fecha registro | Acciones

**Acciones por fila:**
- Cambiar rol (dropdown inline o modal)
- Editar datos

**Botón nuevo usuario:** abre modal con formulario:
- Nombre, email, contraseña, rol, código célula (selector VX/MX/JX/PX/NX + número), tipo célula

**[NUEVO]** Selector de código célula:
```
Tipo: [Hombres ▾]   Número: [1]   → Código: H1
       Mujeres
       Jóvenes
       Prejuveniles
       Niños
```

---

### 8.3 Blog `/admin/blog`

**Layout:** tabla de posts + botón "Nuevo post"

**Tabla columnas:**
- Imagen miniatura | Título | Estado (chip: Borrador/Publicado) | Autor | Fecha | Red social (chip si tiene redirect_url) | Acciones

**Modal / página de creación y edición:**
- Título
- Slug (auto-generado, editable)
- Imagen de portada (subir)
- Extracto
- Editor de contenido enriquecido (Tiptap): negrita, itálica, links, listas, imágenes, citas
- **[NUEVO]** Campo "Link a red social" con selector de plataforma:
  - Plataforma: Instagram | Facebook | YouTube | TikTok | Ninguna
  - URL de la publicación
- Estado: Borrador / Publicado
- Botón Guardar / Publicar

---

### 8.4 Eventos `/admin/events`

**Tabla columnas:**
- Título | Fecha | Lugar | Estado (chip: Activo/Inactivo) | RSVP registrados | Acciones

**Modal crear/editar evento:**
- Título, fecha, hora, lugar, descripción
- Toggle "Evento activo"

**Vista de RSVPs** (botón por evento):
- Tabla: nombre | email | teléfono | cantidad asistentes | notas

---

### 8.5 Anuncios `/admin/announcements`

**Tabla columnas:**
- Título | Dirigido a (chip) | Activo (toggle) | Fecha publicación | Acciones

**Modal crear/editar:**
- Título
- Contenido (textarea enriquecido)
- Dirigido a: Todos / Solo miembros / Solo líderes / Solo admins
- Toggle activo

---

### 8.6 Peticiones de oración `/admin/petitions`

**[CAMBIO]** Solo accesible para admin (ya aplica). Los líderes tienen acceso limitado desde su panel.

**Tabla columnas:**
- Nombre | Email | Teléfono | Categoría | Asunto | Fecha | Estado (chip: Pendiente/Respondida) | Acciones

**Acciones:**
- Ver mensaje completo (modal)
- Marcar como respondida
- **[NUEVO]** Botón "Descargar PDF semanal": genera un PDF con todas las peticiones de la semana actual, una por hoja, para distribuir a los intercessores

---

### 8.7 Voluntarios `/admin/volunteers`

**Tabla columnas:**
- Nombre | Email | Teléfono | Departamento (chip) | Estado | Líder asignado | Fecha | Acciones

**Estados posibles (chips):**
- Pendiente (amarillo) · Asignado (celeste) · Coordinando (marino) · Usuario creado (verde)

**Acciones por fila:**
- Asignar a líder (dropdown)
- Crear cuenta de usuario (botón — solo si estado permite)
- Ver detalles (modal)

---

### 8.8 Células `/admin/cell-reports`

**[CAMBIO]** Sin botón de exportar CSV.

**Filtros:** tipo de célula | estado | rango de fechas | líder

**Tabla columnas:**
- Código | Tipo (chip VX/MX/JX/PX/NX) | Líder | Pastor | Fecha | Asistentes | Nuevos | Ofrenda | Estado (chip) | Acciones

**Acciones:**
- Ver reporte completo (modal o panel lateral)
- Aprobar / Rechazar (con nota opcional)

**Modal de reporte completo muestra:**
- Foto de la reunión (imagen grande arriba)
- Todos los campos en 2 columnas:
  - Código célula | Tipo
  - Líder | Pastor
  - Anfitrión | Teléfono anfitrión
  - Dirección
  - Tema de la reunión
  - Fecha
  - Asistentes totales | Convertidos | Reconciliados | Nuevos
  - Ofrenda
  - Notas
- Estado actual + botones Aprobar/Rechazar

---

### 8.9 Nuevos Miembros (Boletas) `/admin/boletas`

**[CAMBIO]** Sin botón de exportar CSV.

**Tabla columnas:**
- Fecha | Invitado (nombre) | Teléfono | Quien invitó | Categoría (chip) | Líder | Acciones

**Categorías (chips):**
- Convertido (verde) · Reconciliado (celeste) · Nuevo (marino)

**Modal crear/editar boleta:**
- Fecha
- Nombre de quien invitó + teléfono
- Nombre del invitado + teléfono
- Dirección del invitado
- Categoría (radio: Convertido / Reconciliado / Nuevo)
- Líder que registra (dropdown)
- Reporte de célula asociado (dropdown, opcional)
- Notas

---

### 8.10 Galería `/admin/gallery`

**Grid de fotos** con overlay de acciones (editar/eliminar) al hover

**Modal subir foto:**
- Subir imagen (drag & drop o click)
- Título
- Descripción
- Evento asociado (dropdown opcional)

---

### 8.11 Redes Sociales `/admin/social`

**Lista de publicaciones activas** (plataforma chip + imagen miniatura + caption + orden)

**Modal crear/editar publicación:**
- Plataforma: Facebook / Instagram
- URL de la publicación
- Caption / descripción
- URL de imagen
- Orden de aparición
- Toggle activo

---

### 8.12 Registro de Actividad `/admin/activity-log`

**Tabla columnas:**
- Fecha/hora | Usuario | Acción (chip) | Recurso | ID del recurso | IP | Detalles

**Filtros:** usuario | tipo de acción | recurso | rango de fechas

Sin acciones (solo lectura).

---

## 9. Panel Líder

> Acceso exclusivo: rol `leader`
> Layout: mismo sidebar marino, menos ítems

### Navegación del Sidebar Líder

| Ítem | Ruta | Badge |
|---|---|---|
| Inicio | `/leader` | — |
| Células | `/leader/reports` | Reportes pendientes |
| Nuevos | `/leader/boletas` | — |
| Voluntarios | `/leader/volunteers` | Pendientes |
| Directorio | `/leader/cell-directory` | — |
| Perfil | `/leader/profile` | — |

---

### 9.1 Inicio del Líder `/leader`

**KPI cards (3-4):**
- Total asistentes este mes (suma de sus reportes)
- Nuevos este mes (convertidos + reconciliados)
- Ofrenda acumulada del mes
- Voluntarios en su célula

**Lista de últimos 5 reportes** con estado

---

### 9.2 Células del Líder `/leader/reports`

**Mismo visual que admin pero solo ve sus propios reportes.**

**Botón "Nuevo reporte":** abre formulario completo

**Formulario de nuevo reporte de célula (todos los campos):**
- Foto de la reunión (subir imagen, destacada arriba del form)
- Código célula (selector VX/MX/JX/PX/NX + número, pre-cargado del perfil del líder)
- Nombre de la célula
- Tipo de célula (pre-cargado)
- Pastor asignado
- Tema de la reunión
- Fecha de la reunión
- — Sección Anfitrión —
- Nombre del anfitrión
- Teléfono del anfitrión
- Dirección de la reunión
- — Sección Números —
- Total asistentes
- Convertidos (primera vez)
- Reconciliados (vuelven)
- Nuevos (auto-calculado: convertidos + reconciliados)
- Ofrenda (Q)
- Notas adicionales
- Botón "Enviar reporte"

**Estado del reporte:** Pendiente de aprobación / Aprobado / Rechazado (con nota del admin)

---

### 9.3 Nuevos Miembros del Líder `/leader/boletas`

**Igual que admin pero solo ve las boletas que él creó.**

Formulario de nueva boleta igual al del admin.

---

### 9.4 Voluntarios del Líder `/leader/volunteers`

**Solo ve voluntarios asignados a él.**

**Tabla:** nombre | departamento | estado | acciones

---

### 9.5 Directorio de Miembros `/leader/cell-directory`

**Buscador por nombre / código célula**

**Lista de miembros:**
- Nombre | Email | Teléfono | Código célula | Tipo célula | **Dirección** (nuevo, visible para control de nuevos) | Rol

---

## 10. Panel Voluntario (Nuevo)

> Acceso: rol `volunteer`
> Layout: topbar simplificado sin sidebar

### 10.1 Dashboard del Voluntario `/volunteer/dashboard`

**Header de bienvenida:**
- "Hola, [nombre]" | Departamento asignado (chip grande)

**Sección Mis metas:**
- Lista de metas asignadas o personales
- Card de meta: título | descripción | fecha límite | chip de estado (Pendiente/Completada)
- Botón toggle "Marcar completada"
- Botón "Nueva meta personal"

**Sección Mi departamento:**
- Nombre del departamento
- Descripción breve del departamento
- Líder responsable (nombre)
- Próximas actividades (si las hay)

**Sección Anuncios:**
- Últimos 3 anuncios dirigidos a voluntarios o todos

---

## 11. Flujos de Navegación

### Flujo de Login y redirección

```
/login
  ↓ (credentials correctas)
  ├── rol: admin      → /admin
  ├── rol: leader     → /leader
  ├── rol: volunteer  → /volunteer/dashboard
  └── rol: member     → /profile

  ↓ (sin credenciales / ruta protegida)
  → /login?redirect=[ruta original]
```

---

### Flujo de nuevo reporte de célula

```
/leader/reports
  ↓ "Nuevo reporte"
  → Formulario con todos los campos
  ↓ Enviar
  → Estado: Pendiente
  → Admin recibe badge de notificación
  → Admin aprueba/rechaza
  → El líder ve el estado actualizado en su lista
```

---

### Flujo de nueva boleta

```
/leader/boletas  (o /admin/boletas)
  ↓ "Nueva boleta"
  → Formulario: fecha, invitador, invitado, dirección, categoría
  ↓ Guardar
  → Aparece en la lista del líder y del admin
```

---

### Flujo de voluntario nuevo

```
/volunteering (público)
  ↓ Selecciona departamento + llena form
  → Estado: Pendiente
  → Admin/líder lo ve en /admin/volunteers
  → Admin asigna a líder
  → Estado: Asignado
  → Admin crea cuenta de usuario
  → El voluntario recibe credenciales por email
  → Entra a /volunteer/dashboard
```

---

### Flujo de PDF semanal de oraciones

```
/admin/petitions
  ↓ Botón "PDF semanal"
  → Descarga un PDF con todas las peticiones de la semana
  → Una petición por sección/hoja
  → Para distribuir a los 8 intercessores
```

---

## 12. Estados de UI

### Estados de registros

| Estado | Color chip | Íconos |
|---|---|---|
| Pendiente | Amarillo `#D97706` | pending |
| Aprobado | Verde `#16A34A` | check_circle |
| Rechazado | Rojo `#DC2626` | cancel |
| Asignado | Celeste `#4A90D9` | assignment_ind |
| Publicado | Verde | published_with_changes |
| Borrador | Gris | edit_note |
| Activo | Verde | toggle_on |
| Inactivo | Gris | toggle_off |

---

### Estados de formularios

- **Default:** borde `border` gris
- **Focus:** borde 2px `accent` celeste + label sube
- **Filled:** label arriba, valor visible
- **Error:** borde 2px rojo + mensaje debajo en rojo
- **Disabled:** opacity 40%, cursor not-allowed
- **Loading:** spinner en el botón, inputs deshabilitados

---

### Pantalla de carga

- Spinner centrado: círculo de 28px, borde 2px, parte superior en `accent`
- Sobre fondo `surface`
- Sin texto (el spinner es suficiente)

---

### Pantalla vacía (empty state)

Cuando una tabla o lista no tiene datos:
- Ícono ilustrativo grande (Material, tamaño 64px, color `border`)
- Título: "No hay [nombre del recurso] aún"
- Subtítulo suave: instrucción o contexto
- Botón de acción principal (si aplica): "Crear el primero"

---

### 404 y páginas de error

- Ícono grande (error_outline o similar)
- Código de error (404, 403, 500)
- Mensaje descriptivo en español
- Botón "Volver al inicio"

---

## Resumen de pantallas nuevas a diseñar

| Pantalla | Ruta | Tipo |
|---|---|---|
| Dashboard Voluntario | `/volunteer/dashboard` | Nueva |
| Topbar layout voluntario | — | Nuevo layout |
| Selector código célula | — | Nuevo componente |
| Blog con botón red social | `/blog/:slug` | Modificación |
| Formulario boleta (todos los campos) | modal/página | Verificar |
| Formulario célula (todos los campos + foto arriba) | modal/página | Verificar |
| Peticiones solo líderes/admins | `/prayer` | Cambio de acceso |
| Botón PDF semanal en peticiones | `/admin/petitions` | Modificación |
| Departamentos actualizados (10) | `/volunteering` | Modificación |

---

*Documento generado el 24 mayo 2026 — Casa del Rey*
