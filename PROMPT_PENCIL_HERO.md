# Prompt para Pencil — Hero dinámico Casa del Rey

> Pega esto en Pencil. Los `{campos}` son variables CMS, NO inventes texto en su lugar.

---

Diseña el **HERO de la página principal** de una iglesia cristiana llamada "Casa del Rey" en Huehuetenango, Guatemala. Es un CMS — los textos vienen del panel admin, no son hardcoded.

## CRÍTICO: NO hacer esto

- ❌ Gradient orb violeta de fondo (cliché SaaS Vercel/Linear)
- ❌ Layouts simétricos centrados
- ❌ Cards uniformes
- ❌ Verse esquina con padding genérico

## SÍ hacer

Estilo **elevation.church + revista Wallpaper + A24 Films website**. Editorial, asimétrico, fotográfico.

---

## Estructura visual

### Capa 1: Fotografía a sangre
Placeholder de foto del culto con iluminación violeta intensa (real, no decorativa).
**Ocupa el 100% del viewport** del hero — no es decoración, es protagonista.
`object-fit: cover`, sin padding, sin border-radius.

### Capa 2: Overlay
```css
background-color: {overlay_color};         /* default #060D24 */
opacity: {overlay_opacity};                /* default 0.5 */
```
Aplicar **noise/grain sutil** sobre toda el área (5% opacity, blend mode multiply).

### Capa 3: Contenido (asimétrico, NO centrado)

**Alineación general:** todo el contenido alineado al lado izquierdo, padding 96px desde la izquierda.

#### Top-right (metadata editorial)
Posición: absoluta, top: 32px, right: 48px
```
{verse_reference}      ej. "MATEO 5:14"
```
- Fuente: Inter Mono, 11px
- Color: `#7C3AED` (violeta marca)
- Letter-spacing: 0.2em
- Uppercase

#### Label superior (sobre el título)
```
{label_top}            ej. "● IGLESIA CRISTIANA · HUEHUETENANGO · DESDE 2016"
```
- Fuente: Inter 600, 12px
- Color: `#7C3AED`
- Letter-spacing: 0.15em
- Uppercase
- El bullet "●" es parte del texto, viene del CMS

#### Título principal — la pieza dramática

**Línea 1 (sólida):**
```
{title_line_1}         ej. "LUZ PARA"
```
- Fuente: Inter 900
- Tamaño: `clamp(4rem, 9vw, 8rem)`
- Color: blanco puro
- Letter-spacing: -0.05em (muy apretado)
- Line-height: 0.9

**Línea 2 (outline):**
```
{title_line_2}         ej. "LAS NACIONES"
```
- Misma tipografía y tamaño
- `color: transparent`
- `-webkit-text-stroke: 2px white`
- **DESPLAZADA 80px hacia la derecha** respecto a la línea 1
- Esto es lo que crea el efecto editorial signature

#### Subtítulo
```
{subtitle}             ej. "Empieza tu propósito aquí."
```
- Inter 400, 1.5rem
- Color: blanco 80%
- Margin-top: 48px (espacio generoso después del título)
- Max-width: 480px

#### Línea de horario/contexto
```
{schedule_text}        ej. "Domingos · 10am · Zona 1, Huehuetenango"
```
- Inter 500, 0.875rem
- Color: blanco 60%
- Uppercase
- Letter-spacing: 0.1em
- Margin-top: 8px

#### Botones (espacio generoso arriba: 56px)

**Botón primario:**
```
{cta_primary_text}     ej. "Ver próximos eventos"
```
- Fondo: `#7C3AED`
- Texto: blanco, Inter 600, 1rem
- Padding: 16px 32px
- Border-radius: 999px (pill)
- Hover: `transform: scale(1.02)`, fondo `#6D28D9`
- Transición: 100ms `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring sutil)

**Botón secundario:**
```
{cta_secondary_text}   ej. "Conócenos"
```
- Solo texto blanco, sin fondo ni borde
- Inter 600, 1rem
- Margin-left: 24px
- Sufijo: " →" (con espacio)
- Hover: el "→" se desplaza 4px a la derecha (transición 150ms)

---

### Capa 4: Stats al fondo del hero (Elevation-style)

Posición: parte inferior del hero, padding-bottom 64px.
**NO en 3 columnas iguales.** Layout editorial:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  HERO CONTENT ARRIBA                                    │
│                                                         │
│                                                         │
│  ─────────────────────────────────                      │
│                                                         │
│   200+              20+    │    10                      │
│   ────              ────        ────                    │
│   FAMILIAS          CÉLULAS     AÑOS                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- "200+" en `clamp(4rem, 8vw, 7rem)`, peso 900, blanco
- "20+" y "10" en `clamp(2rem, 4vw, 3rem)`, peso 800, blanco
- Labels ("FAMILIAS", "CÉLULAS", "AÑOS") en Inter 500, 11px, uppercase, tracking 0.15em, blanco 50%
- Separador entre 20+ y 10: línea vertical 1px violeta `#7C3AED` al 40% opacity, altura 60px

> Estos números pueden ser hardcoded por ahora — futuro: vendrán del backend

---

## Detalles que NO debes olvidar

### Grain/noise texture
Aplicar sobre toda la imagen + overlay:
```css
background-image: url('data:image/svg+xml,...noise texture...');
opacity: 0.05;
mix-blend-mode: overlay;
```
Esto da el "weight" de Elevation/A24.

### Línea divisoria sutil
Entre el contenido principal y los stats al fondo: línea horizontal 1px, blanco 10% opacity, ancho 80%, alineada a la izquierda.

### Cursor en CTA primario
Custom: cambia el cursor a una flecha → blanco custom cuando se hace hover sobre el botón primario.

### Scroll hint
En la esquina inferior izquierda, sutil:
```
↓ EXPLORAR
```
Inter 600, 11px, uppercase, tracking 0.2em, blanco 50%.
Animación: el "↓" sube y baja 4px cada 2 segundos (loop suave).

---

## Responsive

**Desktop (≥1024px):** como descrito arriba.

**Tablet (768-1023px):**
- Título reduce a `clamp(3rem, 7vw, 5rem)`
- Stats en 1 fila pero más comprimidos
- Foto background sigue full-bleed

**Mobile (<768px):**
- Título: `clamp(2.5rem, 12vw, 4rem)`
- La segunda línea del título YA NO se desplaza a la derecha (queda alineada izquierda)
- Stats en 1 columna apilada
- Botones full-width apilados
- Padding lateral: 24px (no 96px)

---

## Comportamiento dinámico

Cuando los campos del CMS vienen vacíos:

| Campo vacío | Comportamiento |
|---|---|
| `{label_top}` | Se oculta el bullet + texto |
| `{title_line_2}` | El título es solo una línea sólida |
| `{verse_reference}` | Se oculta la esquina superior derecha |
| `{subtitle}` | Se oculta |
| `{schedule_text}` | Se oculta |
| `{cta_secondary_text}` | Se oculta solo ese botón |
| `{background_image_url}` | Fondo color sólido `#060D24` sin foto |

---

## Output esperado

1. **Mockup desktop 1440×900** del hero completo
2. **Mockup mobile 375×812** del hero adaptado
3. **Variant con foto** y **variant sin foto** (fondo sólido) — para mostrar que el diseño aguanta ambos
4. **CSS de implementación** que el agente backend pueda usar

El resultado debe verse como **el hero de elevation.church/messages pero con identidad guatemalteca** — no como una landing de tech startup.

---

## Referencias

- elevation.church → hero con foto masiva, título dramático
- gateway.church → tipografía bold editorial
- vous.church → asimetría y desplazamiento de líneas
- a24films.com → mood oscuro con personalidad
- wallpaper.com → grid editorial
- Revista Apartamento → tipografía con kerning negativo

**NO referencias:** Vercel, Linear, Resend, PostHog, Stripe, Notion (todos SaaS oscuros genéricos).
