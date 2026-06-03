# Prompt para Pencil — Brand Style Guide Casa del Rey

> Copia TODO desde la línea siguiente hacia abajo y pégalo en Pencil.
> **Modelo recomendado:** Claude Sonnet 4.6 en modo **High** (es la base de todo el sistema, vale la pena).

---

Genera un **Brand Style Guide completo** en UN solo frame para una iglesia cristiana llamada **Casa del Rey** en Huehuetenango, Guatemala. El estilo del frame debe ser denso pero respirado, tipo design system de Stripe / Linear / Vercel docs — clean, editorial, profesional.

## Contexto de marca

- **Nombre:** Casa del Rey
- **Tagline:** "Luz para las Naciones"
- **Logo:** Mapamundi blanco sobre fondo navy/negro circular
- **Pastores:** Leonel e Ismeina De León
- **Ubicación:** Huehuetenango, Guatemala
- **Audiencia primaria:** Jóvenes 16-35 años + familias
- **Personalidad:** Moderna, seria pero accesible, dramática pero limpia

## Inspiración visual (CRÍTICO seguir estas)

- **Apple Human Interface** — minimalismo, jerarquía clara, transiciones invisibles
- **Elevation Church** — tipografía oversized, fotografía editorial, drama controlado
- **Stripe Design System** — densidad de información sin saturar
- **Linear** — modo dark/light bien balanceado

**NO inspirarte en:** PostHog (demasiado playful), Material Design genérico, Bootstrap, gradient orbs SaaS.

---

## Layout del frame

Un solo frame grande (~2000×1600px) dividido en bloques con headers tipográficos. Cada bloque tiene su título uppercase + tracking amplio + línea horizontal sutil debajo. Espacio generoso entre bloques.

Estructura recomendada de columnas:
- Columna izquierda (40%): Paleta + Tipografía
- Columna derecha (60%): Componentes + Estados + Motion

---

## 1. PALETA (este es el corazón — corrigiendo intentos previos)

> Hubo iteración previa que probó violeta dominante. **Descartado.** La identidad real es azul marino + celeste basado en su logo y fotografía de Instagram. Violeta queda solo como acento puntual.

### MARCA
| Token | Hex | Uso |
|---|---|---|
| Primario | `#0D1B4B` | Azul marino profundo — botón principal, headers, sidebar |
| Primario press | `#091237` | Estado active del primario |
| Primario tinte | `#E0E7FF` | Background suave de acento |
| Acento celeste | `#4A90D9` | Links, segunda acción, hover hints |
| Acento celeste tinte | `#DBEAFE` | Backgrounds tinted con celeste |
| Acento violeta | `#7C3AED` | OPCIONAL — solo eventos juveniles/conferencias especiales |

### NEUTRALES (modo claro)
| Token | Hex | Uso |
|---|---|---|
| Fondo | `#FAFAF8` | Body del sitio |
| Superficie | `#FFFFFF` | Cards, modales, inputs |
| Carbón / barra | `#060D24` | Sidebar, footer, hero oscuro |
| Tinta texto | `#050505` | Texto principal |
| Texto sec. | `#525B7A` | Texto secundario |
| Texto tenue | `#9CA3B8` | Placeholders, labels muy suaves |
| Borde | `#E5E7EB` | Bordes, dividers |
| Inset / barras | `#F4F6FB` | Background de inputs, surface-dim |

### NEUTRALES (modo oscuro)
| Token | Hex | Uso |
|---|---|---|
| Fondo dark | `#060D24` | Body en dark mode |
| Superficie dark | `#0D1B4B` | Cards, modales en dark |
| Tinta dark | `#FFFFFF` | Texto principal sobre dark |
| Texto sec dark | `rgba(255,255,255,0.60)` | Texto secundario sobre dark |
| Texto tenue dark | `rgba(255,255,255,0.35)` | Placeholders sobre dark |
| Borde dark | `rgba(255,255,255,0.10)` | Bordes sobre dark |
| Inset dark | `rgba(255,255,255,0.04)` | Surface dim en dark |

### ESTADO
| Token | Hex | Uso |
|---|---|---|
| Éxito | `#16A34A` | Aprobado, verificado |
| Éxito tinte | `#D1FAE5` | Background éxito suave |
| Peligro | `#DC2626` | Rechazado, error, destructivo |
| Peligro tinte | `#FEE2E2` | Background error suave |
| Advertencia | `#D97706` | Pendiente, alerta |
| Advertencia tinte | `#FEF3C7` | Background warning suave |
| Info | `#4A90D9` | Mismo celeste — info, links |
| Info tinte | `#DBEAFE` | Background info suave |

**Mostrar cada color como swatch cuadrado (80×80px), nombre debajo (Inter 600, 11px), hex debajo del nombre (Inter Mono, 10px, color tenue).** Agrupar por categoría con separación visual.

---

## 2. TIPOGRAFÍA

**Familia única: Inter** (Google Fonts) en pesos 400, 500, 600, 700, 800, 900.
**Familia de soporte: Inter Mono** para códigos y metadata editorial.

### Escala (mostrar cada uno con sample real)

| Nombre | Tamaño | Peso | Letter-spacing | Ejemplo |
|---|---|---|---|---|
| Display | `clamp(4rem, 9vw, 8rem)` | 900 | -0.05em | **LUZ PARA** |
| Headline L | `clamp(2.5rem, 5vw, 4rem)` | 800 | -0.03em | **Próximos eventos** |
| Headline M | `2rem` | 700 | -0.02em | **Nuestra historia** |
| Title L | `1.5rem` | 700 | -0.01em | **Culto dominical** |
| Title M | `1.125rem` | 600 | 0 | **Información** |
| Body L | `1.125rem` | 400 | 0 | Únete a una comunidad que te acepta. |
| Body | `1rem` | 400 | 0 | Texto del cuerpo principal del sitio. |
| Body S | `0.875rem` | 400 | 0 | Texto secundario y descripciones cortas. |
| Label L | `0.875rem` | 600 | 0.05em | UPPERCASE para botones |
| Label | `0.75rem` | 600 | 0.1em | DOMINGO · 10AM |
| Label S | `0.6875rem` | 600 | 0.15em | METADATA · EDITORIAL |
| Mono | `0.6875rem` | 500 | 0.2em | MATEO 5:14 |

**Mostrar cada nivel con su sample en su tipografía real**, no solo nombrarlos.

---

## 3. BOTONES (esquinas: pill `9999px` para primario, `12px` para resto)

Mostrar **4 variantes × 4 estados** = matriz de 16 botones.

### Variantes
- **Primario**: fondo `#0D1B4B` (navy), texto blanco
- **Primario violeta**: fondo `#7C3AED`, texto blanco (variante opcional juvenil)
- **Secundario**: borde `#E5E7EB`, texto `#050505`, fondo blanco
- **Terciario**: solo texto `#0D1B4B`, sin fondo ni borde
- **Destructivo**: fondo `#DC2626`, texto blanco

### Estados (por cada variante)
- **Default**: como descrito arriba
- **Hover**: `transform: scale(1.02)` + ligero oscurecido del fondo
- **Active (press)**: `transform: scale(0.98)`
- **Disabled**: opacity 40%, cursor not-allowed

Cada botón con sample text: "Acción", "Continuar", "Cancelar", "Eliminar".

---

## 4. CHIPS DE ESTADO (border-radius: full)

Mostrar en una sola fila horizontal:
- Pendiente — `bg #FEF3C7` `text #92400E` — ícono `schedule`
- Aprobado — `bg #D1FAE5` `text #065F46` — ícono `check_circle`
- Rechazado — `bg #FEE2E2` `text #991B1B` — ícono `cancel`
- Verificado — `bg #D1FAE5` `text #065F46` — ícono `verified`
- Nuevo — `bg #DBEAFE` `text #1E40AF` — ícono `fiber_new`
- Publicado — `bg #D1FAE5` `text #065F46` — ícono `published_with_changes`
- Borrador — `bg #F3F4F6` `text #4B5563` — ícono `edit_note`
- Convertido — `bg #EDE9FE` `text #5B21B6` — ícono `church`
- Reconciliado — `bg #E0E7FF` `text #3730A3` — ícono `favorite`

Estructura: padding `4px 10px`, ícono 14px + texto label-s 11px.

---

## 5. INPUTS (esquinas 12px, altura 48px)

Mostrar **4 estados** lado a lado, cada uno con label arriba y placeholder:

- **Default**: borde 1px `#E5E7EB`, placeholder `#9CA3B8`
- **Focus**: borde 2px `#0D1B4B` + ring 3px `rgba(13,27,75,0.2)`
- **Filled**: borde 1px `#E5E7EB`, texto `#050505`, valor: "Pedro García"
- **Error**: borde 2px `#DC2626`, mensaje rojo debajo: "Campo requerido"

Label encima: "Nombre completo", Inter 600 14px color `#525B7A`.

Incluir también: **Textarea**, **Select con chevron**, **Checkbox** (custom 20×20px), **Radio**, **Toggle** (switch iOS).

---

## 6. CARDS (esquinas 16px)

Mostrar **3 variantes** de tamaño con muestras realistas:

- **Card pequeña** (220×280px): foto pequeña arriba, título Title M, body S, una acción
- **Card mediana** (320×420px): foto cuadrada, fecha en avatar, título, descripción, botón
- **Card grande** (480×560px): foto a sangre como fondo, gradient overlay, título Display sobre foto, badge en esquina

Una de las medianas debe ser **card de evento** con fecha tipo calendario:
```
[15] JUN  · CULTO ESPECIAL
Noche de Adoración
Domingo · 7pm · Zona 1
[Registrarse]
```

Otra debe ser **card de blog** con foto a sangre + título sobre gradient + badge Instagram en esquina.

---

## 7. ELEVACIÓN (sombras)

Mostrar 3 cards de muestra una al lado de otra con cada nivel:

- **elev-1**: `0 1px 2px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.10)` — cards en reposo
- **elev-2**: `0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.06)` — cards hover, dropdowns
- **elev-3**: `0 10px 15px rgba(0,0,0,0.10), 0 4px 6px rgba(0,0,0,0.05)` — modales

---

## 8. RADIOS

Tira de 6 cuadrados con cada radio aplicado, label debajo:
- `4px` (xs) — chips pequeños
- `8px` (sm) — buttons small, inputs small
- `12px` (md) — inputs, botones normales, cards pequeñas
- `16px` (lg) — cards medianas
- `24px` (xl) — cards grandes, modales
- `9999px` (full) — pills, avatares, FAB

---

## 9. ESPACIADO (escala 4px)

Mostrar barras verticales o cuadrados con cada valor:
`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 128`

---

## 10. SISTEMA DE MOTION ★ (lo que pidió el cliente)

> **Filosofía: las transiciones no se ven, se sienten.** Apple para el UI diario, Elevation para los momentos de impacto.

### Easings (Apple)
```css
--ease-standard:   cubic-bezier(0.4, 0.0, 0.2, 1)   /* entradas/salidas normales */
--ease-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1)   /* elementos entrando */
--ease-accelerate: cubic-bezier(0.4, 0.0, 1.0, 1)   /* elementos saliendo */
--ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1) /* botones, tiny bounce */
--ease-sharp:     cubic-bezier(0.4, 0.0, 0.6, 1)    /* drawers, sidebars */
```

### Duraciones
```
50ms   micro      → color de íconos, opacity sutil
100ms  rápido     → hover botones, focus rings
150ms  normal     → hover cards, chips, links
200ms  medio      → modales entrando, tooltips
300ms  suave      → page sections, sidebars
400ms  dramático  → hero reveals, page transitions
600ms  cine       → SOLO hero del home (Elevation)
```

### Regla
- Usuario inicia (click/hover) → 100–150ms
- Sistema inicia (load/auto) → 300–400ms
- Decorativo (hero) → 500–600ms

### Por componente (mostrar con animación en vivo en el frame)

**Botón primario:**
- Reposo → Hover: `scale(1.02)`, fondo oscurece 8%, 100ms `ease-spring`
- Hover → Press: `scale(0.98)`, 80ms `ease-accelerate`
- Press → Release: `scale(1)`, 200ms `ease-spring`

**Card:**
- Reposo → Hover: `translateY(-3px)`, `elev-1 → elev-2`, 180ms `ease-decelerate`

**Modal:**
- Entrada: `opacity 0→1` + `scale 0.95→1` + `translateY(8px→0)`, 250ms `ease-decelerate`
- Salida: `opacity 1→0` + `scale 1→0.97`, 150ms `ease-accelerate` (salida más rápida)

**Input focus:**
- Ring crece desde el borde: `box-shadow 0px → 3px`, 150ms `ease-spring`
- Error: `shake` horizontal `±4px` durante 300ms

**Hero reveal (Elevation drama):**
- Label superior aparece a 100ms
- Título línea 1 a 220ms
- Título línea 2 a 340ms
- Subtítulo a 460ms
- Botones a 580ms
- Cada uno: `opacity 0→1` + `translateY(20px→0)`, 600ms `ease-decelerate`

**Toast:**
- Entrada desde abajo: `translateY(100%→0)`, 300ms `ease-spring`
- Salida hacia arriba: `translateY(0→-8px)` + fade, 200ms `ease-accelerate`

**Skeletons:**
- Shimmer izquierda → derecha, 1.5s ease-in-out infinite
- Gradient: `surf-dim → surf-high → surf-dim`

### Reglas que NUNCA romper
- ❌ Bounces exagerados (spring > 1.6)
- ❌ Transiciones > 500ms en UI (solo hero)
- ❌ Animaciones en loop que no sean loading
- ❌ Animar `width/height/padding` (causa reflow → laggy)
- ✅ Solo animar `transform`, `opacity`, `color`, `background-color`, `box-shadow`

**En el frame, mostrar 3 botones renderizados en estados Default / Hover / Active con flechas indicando la transición y los milisegundos.**

---

## 11. ÍCONOGRAFÍA

Sistema: **Material Symbols Rounded** (Google).
- Tamaño 18px para nav items
- Tamaño 20px para acciones inline
- Tamaño 24px para botones
- Tamaño 28-48px para estados ilustrativos
- **Fill: 0** (outlined) por defecto
- **Fill: 1** (filled) solo para estados activos

Mostrar grid de íconos clave usados en el proyecto:
`dashboard, manage_accounts, article, calendar_month, campaign, volunteer_activism, group_add, groups, person_add, photo_library, share, history, person, home, contacts, check_circle, cancel, pending, edit, delete, visibility, add, download, upload, logout, public, church, favorite, task_alt, photo_camera, location_on, phone, receipt_long, view_carousel`

---

## 12. METADATA DEL FRAME

Arriba del todo (header del style guide):
```
CASA DEL REY · BRAND SYSTEM     v1.0 · 2026
```
Tipografía: Inter Mono 11px, tracking 0.2em, uppercase, color `#525B7A`.

Logo del mapamundi a la izquierda del título.

---

## Output esperado

**UN SOLO FRAME** que sea el design system completo, escaneable de un vistazo, denso pero respirado. Todos los componentes en sus estados, todos los tokens visibles, todas las animaciones documentadas.

El frame debe poder usarse como **referencia maestra** — cualquier persona que lo abra debe poder construir el sitio entero con esa única imagen.

Después del style guide, en frames separados (opcional si hay tiempo):
- **Frame 2: Modo oscuro** — mismo style guide pero con la paleta dark mode aplicada
- **Frame 3: Mockup hero** desktop con los tokens aplicados
- **Frame 4: Mockup admin dashboard** con los tokens aplicados

---

## Recordatorios finales

✅ Azul marino dominante, NO violeta
✅ Celeste como segundo acento
✅ Violeta solo como acento opcional para eventos juveniles
✅ Tipografía Inter exclusivamente
✅ Esquinas 12px estándar, pill para botones primarios
✅ Sombras suaves Apple-style
✅ Sistema de motion completo y visible en el frame
✅ Modo dark + light compatibles
