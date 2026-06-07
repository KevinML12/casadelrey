# Prompt para Pencil — Brand Style Guide v2 · Casa del Rey

> **Modelo:** Claude Sonnet 4.6 **High**
> **Diferencia con v1:** este Style Guide ES la marca, no un documento que la describe.
> Layout editorial estilo revista Apartamento / Wallpaper / Apple HIG — NO documentation page genérica.

---

Genera un **Brand Style Guide editorial** en UN solo frame para la iglesia **Casa del Rey** (Huehuetenango, Guatemala). Este frame **NO es un documento técnico** — es una **pieza editorial** que comunica la marca tanto en su contenido como en su forma.

## Filosofía del frame

El Style Guide de Apple HIG no parece spec de software, parece editorial.
El de Stripe no parece template de Figma, parece marca.
El nuestro debe parecer **una revista de iglesia moderna**, no un Notion doc.

❌ **NO hacer:** layout de 2 columnas tipo Linear docs, swatches sueltos al lado de su hex, cards con stock photos de Unsplash, lorem ipsum, headers genéricos tipo "PALETA / TIPOGRAFÍA".

✅ **SÍ hacer:** layout asimétrico estilo Wallpaper magazine, hero dramático arriba, contenido real de la iglesia, cards en contexto de uso real, tipografía como elemento decorativo, mucho aire blanco/oscuro.

---

## ESTRUCTURA DEL FRAME (en orden vertical, no en columnas)

### 🔥 BLOQUE 1 · Hero del Style Guide (ocupa ancho completo)

Fondo navy `#0D1B4B` sólido. Padding generoso (120px vertical).

**Esquina superior izquierda (metadata):**
```
CASA DEL REY · BRAND SYSTEM
v1.0 · DICIEMBRE 2026
```
Inter Mono 11px, tracking 0.2em, color `rgba(255,255,255,0.5)`

**Esquina superior derecha:**
Logo del mapamundi (círculo) en blanco, 64px.

**Centro del bloque, gigante:**
```
LUZ PARA
LAS NACIONES
```
- "LUZ PARA" en Inter 900, 144px, blanco sólido
- "LAS NACIONES" en Inter 900, 144px, outline solamente (`-webkit-text-stroke: 2px white`, fill transparent)
- Letter-spacing: -0.05em
- Segunda línea desplazada 120px a la derecha (asimetría editorial)

**Debajo del título, alineado al centro:**
```
"Vosotros sois la luz del mundo."
— MATEO 5:14
```
- Cita en Playfair Display Italic 28px, blanco 80%
- Atribución en Inter Mono 11px, tracking 0.2em, color `#7C3AED` (acento violeta sutil)

**Línea inferior del bloque:**
Texto pequeño centrado:
```
Esto NO es un documento. Es la voz visual de nuestra iglesia.
```
Inter 400 italic 14px, color `rgba(255,255,255,0.6)`

---

### 🎨 BLOQUE 2 · Paleta (en contexto, no en abstracto)

Fondo crema `#FAFAF8`. Padding 96px.

**Título de sección:**
```
── COLOR
Los tonos del cielo de Huehuetenango.
```
- "── COLOR" en Inter 600 12px tracking 0.2em uppercase, color `#0D1B4B`
- Subtítulo en Inter 700 32px, color `#050505`

**NO mostrar swatches sueltos.** Mostrar **escenas de aplicación**:

#### Escena 1 — "Hero del culto" (rectángulo 600×300px)
- Background navy `#0D1B4B`
- Texto blanco grande "DOMINGO 10AM"
- Subtítulo celeste claro
- Etiqueta inferior: `Navy #0D1B4B + Blanco #FFFFFF + Celeste #4A90D9`

#### Escena 2 — "Card de evento" (rectángulo 400×300px)
- Background blanco
- Borde sutil
- Texto navy
- Botón celeste pequeño
- Etiqueta inferior: `Superficie + Tinta + Acento celeste`

#### Escena 3 — "Estados de feedback" (rectángulo 600×200px)
- Tres chips lado a lado: Aprobado (verde), Pendiente (amarillo), Rechazado (rojo)
- Etiqueta inferior: `Estados semánticos`

#### Escena 4 — "Acento juvenil" (rectángulo 400×200px)
- Background violeta `#7C3AED`
- Texto blanco "CONFERENCIA DE JÓVENES"
- Etiqueta inferior: `Violeta #7C3AED — solo eventos especiales jóvenes`

**Debajo de las escenas, una tira mínima con los hex:**
```
NAVY 0D1B4B   ·   CELESTE 4A90D9   ·   CREMA FAFAF8   ·   TINTA 050505   ·   VIOLETA 7C3AED
```
Inter Mono 11px, tracking 0.15em, distribuido horizontalmente.

---

### 📝 BLOQUE 3 · Voz y Tono

Fondo blanco `#FFFFFF`. Padding 96px. Layout en 2 columnas asimétricas (40/60).

**Columna izquierda (título):**
```
── VOZ
Cómo habla
Casa del Rey.
```
- "── VOZ" en Inter 600 12px tracking 0.2em uppercase, color `#0D1B4B`
- "Cómo habla / Casa del Rey." en Display 900 64px, color `#050505`, line-height 0.95, letter-spacing -0.03em

**Columna derecha (3 ejemplos comparativos):**

```
✗ EN VEZ DE:                        ✓ DECIMOS:
"Bienvenidos a nuestra              "Empieza tu propósito aquí."
 congregación cristiana."

"Los servicios dominicales           "Domingos · 10am · Zona 1."
 inician a las 10:00 horas."

"Te invitamos cordialmente a         "Conéctate con tu generación."
 formar parte de nuestra
 comunidad eclesial."
```

- Etiquetas "EN VEZ DE / DECIMOS" en Inter 600 11px tracking 0.15em uppercase
- "✗" en rojo `#DC2626`, "✓" en verde `#16A34A`
- Texto "en vez de" en gris `#9CA3B8` con strike-through
- Texto "decimos" en `#050505` peso 500

**Principios al fondo:**
```
Hablamos directo. Sin solemnidad innecesaria.
Como alguien que te conoce, no como una institución.
```
Inter Italic 18px, color `#525B7A`, max-width 600px.

---

### 🅰 BLOQUE 4 · Tipografía (como pieza editorial)

Fondo navy profundo `#060D24`. Padding 96px.

**Título:**
```
── TIPOGRAFÍA
Inter para todo.
```
- En blanco, mismo formato que bloques anteriores

**Showcase tipográfico — NO una tabla:**

Layout asimétrico mostrando la jerarquía con frases reales de iglesia, cada una a su tamaño real:

```
[Display 900 / 144px]      LUZ PARA LAS NACIONES

[Headline L 800 / 64px]    Próximos eventos

[Headline M 700 / 40px]    Nuestra historia

[Title L 700 / 24px]       Culto dominical

[Body L 400 / 18px]        Únete a una comunidad que te acepta tal como eres
                           y te impulsa hacia tu propósito.

[Body 400 / 16px]          Cada semana abrimos las puertas a las 10am en
                           nuestro templo de la Zona 1.

[Label 600 / 11px tracking]    DOMINGO · 10AM · HUEHUETENANGO

[Mono 500 / 11px tracking]     MATEO 5:14 — VOSOTROS SOIS LA LUZ
```

Cada nivel etiquetado discretamente a la izquierda con su spec, en `rgba(255,255,255,0.4)` Inter Mono 10px.

---

### 🔘 BLOQUE 5 · Componentes (en uso real, no en abstracto)

Fondo crema `#FAFAF8`. Padding 96px.

**Título:**
```
── COMPONENTES
Las piezas en acción.
```

#### Sub-bloque 5A · Botones (matriz visual)

Cada botón debe tener texto real de la iglesia, no "Acción":

| | DEFAULT | HOVER | ACTIVE | DISABLED |
|---|---|---|---|---|
| **Primario** | [Ver eventos] | [Ver eventos] (scale 1.02) | [Ver eventos] (scale 0.98) | [Ver eventos] (opacity 40%) |
| **Secundario** | [Conócenos] | [Conócenos] | [Conócenos] | [Conócenos] |
| **Terciario** | Únete → | Únete → | Únete → | Únete → |
| **Destructivo** | [Eliminar reporte] | [Eliminar reporte] | [Eliminar reporte] | [Eliminar reporte] |

#### Sub-bloque 5B · Chips de estado

En una fila, con textos reales:
```
Pendiente de aprobación   Aprobado por pastor   Rechazado   Verificado
Reporte nuevo             Publicado             Borrador   Convertido   Reconciliado
```

#### Sub-bloque 5C · Card de evento REAL

Card medium (320×400px):
- Avatar de fecha: `15 JUN`
- Label: `CULTO ESPECIAL`
- Título: `Noche de Adoración`
- Subtítulo: `Domingo · 7pm · Templo Central`
- Botón primario: `Registrarme`

#### Sub-bloque 5D · Card de reporte de célula (panel admin)

Card horizontal 500×120px:
- Chip código: `[H1]`
- Título: `Guerreros del Rey`
- Metadata: `Leonel García · 18 asistentes · 3 nuevos`
- Chip estado: `Aprobado`

#### Sub-bloque 5E · Input en sus 4 estados

Lado a lado, con label real "Nombre completo" y placeholder "Pedro García":
- Default · Focus · Filled ("Pedro García") · Error ("Campo requerido")

---

### ⚡ BLOQUE 6 · Motion (tabla viva)

Fondo blanco. Padding 96px.

**Título:**
```
── MOVIMIENTO
Las transiciones no se ven, se sienten.
```

**Bloque de código en navy:**
```css
--ease-standard:   cubic-bezier(0.4, 0, 0.2, 1)
--ease-decelerate: cubic-bezier(0, 0, 0.2, 1)
--ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1)
--ease-sharp:      cubic-bezier(0.4, 0, 0.6, 1)
```

**Tabla de duraciones (visual con barras horizontales):**
```
50ms   ▓                          micro · color de íconos
100ms  ▓▓                         hover botones · focus rings
150ms  ▓▓▓                        cards · chips · links
200ms  ▓▓▓▓                       modales entrando
300ms  ▓▓▓▓▓▓                     sidebars · sections
400ms  ▓▓▓▓▓▓▓▓                   hero reveals
600ms  ▓▓▓▓▓▓▓▓▓▓▓▓               SOLO hero del home (Elevation)
```

Cada barra en color violeta `#7C3AED` con opacidad variable según duración.

**Demo de 3 botones lado a lado:**
- Botón 1 en Default
- Botón 2 en Hover (scale 1.02 + sombra)
- Botón 3 en Active (scale 0.98)
- Flechas curvas entre ellos con "100ms ease-spring" como label

---

### 🖼 BLOQUE 7 · Aplicación (muestra final)

Fondo navy `#0D1B4B`. Padding 96px.

**Título centrado:**
```
── APLICACIÓN
Todo junto.
```

**Mini-mockup del hero real** (escala 60%):
- Mismo hero dramático del frame 1 pero compacto
- Stats `200+ FAMILIAS · 20+ CÉLULAS · 10 AÑOS` al fondo
- Funciona como "esto es lo que se construye con todo lo anterior"

**Pie del frame, alineado al centro:**
```
DOMINGOS · 10AM · ZONA 1, HUEHUETENANGO · GUATEMALA
casadelreyhue.org · @ig.casadelrey
```
Inter Mono 11px, tracking 0.2em, blanco 50%.

---

## NO OLVIDAR

✅ El frame mismo debe parecer una pieza editorial
✅ Logo del mapamundi prominente arriba a la derecha
✅ Cita bíblica grande como ancla visual
✅ Contenido real de Casa del Rey en TODOS los samples
✅ Asimetría intencional, no grid de 12 columnas perfecto
✅ Mucho aire entre bloques (96-120px de padding vertical)
✅ Cada bloque tiene su fondo distinto (navy / crema / blanco / navy oscuro / crema / blanco / navy)
✅ Las secciones se siguen una a otra verticalmente, no en columnas paralelas
✅ Voz/tono incluida — no es un sistema solo visual, también verbal

❌ NO swatches al lado uno del otro como pizza
❌ NO layout tipo Linear docs
❌ NO stock photos de Unsplash
❌ NO lorem ipsum en NINGÚN sample
❌ NO headers genéricos "PALETA / TIPOGRAFÍA"
❌ NO simetría perfecta de 2 columnas todo el frame

---

## Output

Un solo frame **vertical** de aproximadamente 1440×6000px que sea **escaneable como una revista**: alguien hace scroll y va sintiendo la marca, no solo viendo specs.

Cuando lo termines, este frame debería poder enviarse al cliente como **una pieza de comunicación de marca por sí mismo**, no como anexo técnico.
