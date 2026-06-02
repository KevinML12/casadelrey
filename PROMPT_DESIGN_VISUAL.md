# Prompt — Sistema de Diseño Visual Casa del Rey

> Pega esto en Claude Design / Claude.ai para generar el sistema visual completo.

---

Diseña el sistema visual completo para **Casa del Rey**, una iglesia cristiana guatemalteca moderna orientada a jóvenes y familias.

## Referencia de estética

La dirección visual combina dos referencias:

**1. Elevation Church** — la iglesia más influyente en diseño del mundo cristiano:
- Tipografía extra bold, oversized, impactante
- Fondos oscuros con fotografía dramática de alta calidad
- Composiciones limpias con mucho espacio en blanco
- Jerarquía visual extremadamente fuerte
- Sin decoraciones innecesarias — el contenido ES el diseño

**2. Apple Human Interface Design:**
- Minimalismo absoluto — si algo no tiene función, no existe
- Transiciones y estados de hover sutiles pero notables
- Bordes y sombras casi invisibles — la profundidad se logra con color, no con adornos
- Tipografía como elemento visual principal, no de soporte
- Fondos: o completamente blancos o completamente oscuros — nunca grises genéricos

**NO usar:** PostHog, ilustraciones, personajes, Material Design genérico, sombras exageradas, gradientes arcoíris, bordes decorativos.

---

## Identidad visual de la iglesia

**Logo:** Mapa del mundo en azul marino sobre fondo negro. Slogan: "Luz para las Naciones"
**Personalidad:** Seria pero accesible. Moderna pero con raíces. Dramática pero limpia.
**Audiencia:** Jóvenes de 15-35 años + familias guatemaltecas

**Fotografía existente de referencia:**
- Fotografía editorial en blanco y negro de pastores predicando
- Iluminación escénica violeta/púrpura intensa en cultos
- Tomas de audiencia desde el escenario
- Citas bíblicas en tipografía serif sobre fondos oscuros
- Cielos azules con tipografía script para posts inspiracionales

---

## Paleta de colores

### Colores de marca (NO cambiar estos)

| Nombre | Hex | Uso principal |
|---|---|---|
| **Navy** | `#0D1B4B` | Sidebar, hero oscuro, fondo de cards premium |
| **Navy profundo** | `#060D24` | Hero principal, fondos de sección oscura |
| **Celeste marca** | `#4A90D9` | CTA primario, links, acentos interactivos |
| **Blanco** | `#FFFFFF` | Texto sobre oscuro, superficies limpias |
| **Negro** | `#050505` | Texto principal, fondos dark mode |

### Colores derivados del Instagram

| Nombre | Hex | Por qué |
|---|---|---|
| **Violeta escenario** | `#7C3AED` | Color exacto de su iluminación de cultos |
| **Violeta suave** | `#EDE9FE` | Superficies de acento ligero |
| **Gris editorial** | `#1A1A2E` | Fondos de sección semi-oscura |
| **Crema** | `#FAFAF8` | Fondo principal del sitio en modo claro |

### Semántica de color

```
Acción primaria:     Celeste #4A90D9
Acción secundaria:   Blanco con borde
Hover/énfasis:       Violeta #7C3AED
Superficie clara:    Crema #FAFAF8
Superficie oscura:   Navy #0D1B4B
Hero/impacto:        Negro profundo #060D24
Texto sobre claro:   #050505
Texto sobre oscuro:  #FFFFFF
Texto secundario:    rgba(255,255,255,0.6) sobre oscuro
```

---

## Tipografía

### Fuentes a usar

**Display / Titulares grandes:**
`Inter` — peso 900 (Black), tracking muy apretado (-0.03em)
Alternativa si se quiere más editorial: `Playfair Display` en itálica para frases bíblicas

**Cuerpo / UI:**
`Inter` — pesos 400, 500, 600

**Estilo Elevation Church:**
- Titulares que ocupan casi todo el ancho del contenedor
- Mixing de pesos: una palabra en 900, la siguiente en 400 italic
- Texto en mayúsculas para labels y categorías (tracking +0.1em)

### Escala

| Uso | Tamaño | Peso | Ejemplo |
|---|---|---|---|
| Hero principal | clamp(3.5rem, 8vw, 7rem) | 900 | "CASA DEL REY" |
| Sección título | clamp(2.5rem, 5vw, 4.5rem) | 800 | "Nuestros eventos" |
| Card título | 1.5rem–2rem | 700 | "Culto dominical" |
| Body | 1rem | 400 | Párrafos normales |
| Label/tag | 0.75rem | 600, UPPERCASE | "PRÓXIMO EVENTO" |

---

## Componentes clave a diseñar

### 1. Hero del sitio público
```
Fondo: fotografía del culto (iluminación violeta) con overlay navy al 70%
Encima: 
  - Label pequeño uppercase: "CASA DEL REY · HUEHUETENANGO"
  - Título gigante: "LUZ PARA" en blanco peso 900
                    "LAS NACIONES" con borde/outline weight
  - Subtítulo: "Iglesia Cristiana · Domingos 10am"
  - 2 botones: [Ver próximos eventos] [Conócenos]
Referencia visual: exactamente como elevation.church/app o gateway.church
```

### 2. Card de evento
```
Fondo oscuro navy o fotografía del evento
Esquina: fecha en número grande + mes pequeño (como Apple Calendar)
Título bold
Lugar + hora en texto secundario
Botón "Registrarse" o badge de precio si tiene costo
Sin bordes decorativos — solo sombra sutil o separación por color
```

### 3. Card de blog/post
```
Imagen a sangre (sin padding, ocupa todo el card)
Gradient overlay de abajo hacia arriba: negro al 0% → negro al 80%
Título sobre la imagen en blanco peso 700
Si tiene redirect_url: badge de Instagram/Facebook en esquina superior
```

### 4. Sidebar del panel admin/líder
```
Fondo: #060D24 (negro profundo, no navy)
Ítem activo: fondo violeta #7C3AED al 15% + borde izquierdo 3px violeta #7C3AED
Ítem hover: fondo blanco al 5%
Texto: blanco 100% activo, blanco 55% inactivo
Logo: arriba con padding generoso
Usuario + rol: abajo, separado por línea sutil
```

### 5. Botón primario (Apple-inspired)
```
Fondo: Celeste #4A90D9
Texto: Blanco, peso 600, sin uppercase
Border-radius: 980px (pill) para acciones principales / 12px para acciones de formulario
Hover: escala 1.02 + ligero oscurecer el fondo
Sin sombra en reposo — solo en hover (sombra celeste 30% opacity)
Tamaño mínimo: 44px alto (Apple HIG)
```

### 6. Sección "Stats" / impacto
```
Fondo: navy #0D1B4B o negro profundo
Números gigantes: blanco peso 900, clamp(3rem, 6vw, 5rem)
Label debajo: uppercase blanco 60%, peso 500
Separados por líneas verticales sutiles
Ejemplo: "87  /  FAMILIAS   ·   12  /  CÉLULAS   ·   3  /  AÑOS"
```

### 7. Formulario (Material pero sin el ruido)
```
Inputs: sin border inferior solamente (como Apple iOS)
        O: borde completo 1px, color muy sutil, radius 12px
Label: flotante arriba cuando activo (como Material), pero en celeste no en violeta
Focus ring: 3px celeste #4A90D9 al 30% opacity
Error: texto rojo debajo, SIN ícono extra
Botón submit: siempre full-width en mobile, auto en desktop
```

---

## Patrones de layout

### Sitio público — espaciado Apple
```
Secciones: padding vertical mínimo 96px (6rem), idealmente 128px (8rem)
Contenedor: max-width 1200px, padding horizontal 24px mobile / 48px desktop
Grid: 12 columnas, gaps generosos
"Respiración" entre elementos: nunca menos de 24px entre items relacionados
```

### Paneles internos — densidad controlada
```
No Elevation aquí — más linear/Notion
Padding de página: 24px–32px
Cards: border-radius 16px, padding interno 20px–24px
Tablas: filas de 52px mínimo (Apple HIG para touch targets)
Sidebar: 240px fijo, contenido en el resto
```

---

## Dark sections (Elevation-style)

Para secciones de alto impacto en el sitio público:

```
Patrón A — Foto de fondo:
  background: url(foto-culto.jpg)
  overlay: linear-gradient(to bottom, #060D24 0%, rgba(6,13,36,0.7) 50%, #060D24 100%)
  Texto: blanco puro

Patrón B — Color sólido:
  background: #0D1B4B
  Acento: línea violeta o punto celeste
  Texto: blanco con opacidad variable

Patrón C — Split:
  Mitad foto, mitad texto sobre navy
  Referencia: Apple MacBook Pro pages
```

---

## Lo que NO hacer (anti-patterns)

- ❌ Gradientes arcoíris o multicolor
- ❌ Sombras tipo `box-shadow: 0 10px 30px rgba(0,0,0,0.5)` — demasiado heavy
- ❌ Bordes de todos los lados en todos los elementos
- ❌ Cards con 3+ colores diferentes
- ❌ Tipografía decorativa/cursiva para el UI (solo para citas bíblicas específicas)
- ❌ Animaciones que duren más de 300ms
- ❌ Íconos rellenos mezclados con íconos de línea — consistencia total
- ❌ Más de 2 colores de acento en la misma pantalla

---

## Contexto adicional

**Stack técnico:** React 19 + Tailwind CSS 3 + Material Symbols Rounded (íconos)

**Módulos que necesitan diseño:**
1. Home público — landing page impactante
2. Página de eventos con cobros
3. Blog con links a redes sociales
4. Galería fotográfica
5. Página de voluntariado
6. Panel admin (sidebar + páginas internas)
7. Panel líder
8. Dashboard voluntario

**Implementación:** Las variables CSS ya existen en `index.css` como `--pri`, `--sec`, `--surf`, etc. Solo necesito los nuevos valores hex para reemplazarlos.

---

## Componentes faltantes (completar también)

### 8. Header público (sticky)
```
Estado inicial (sobre hero oscuro):
  Fondo: transparente
  Logo: blanco
  Nav links: blanco 80% opacity
  Botón "Ingresar": outlined blanco

Estado al hacer scroll (sobre contenido claro):
  Fondo: blanco con backdrop-blur
  Logo: navy
  Nav links: navy
  Botón "Ingresar": filled celeste
  Transición: 200ms ease

Mobile:
  Solo logo + hamburger
  Drawer lateral desde la derecha (no izquierda)
  Fondo: navy profundo
  Links: grandes, touch-friendly (min 48px)
```

### 9. Footer
```
Fondo: #060D24 (negro profundo)
3 columnas desktop / 1 columna mobile:
  Col 1: Logo + "Luz para las Naciones" + redes sociales (iconos)
  Col 2: Links rápidos (Inicio, Blog, Eventos, Galería, Voluntarios)
  Col 3: Datos de contacto (dirección, teléfono, horarios de culto)
Línea divisoria: blanco al 10%
Copyright: blanco al 30%
```

### 10. Sistema de navegación admin (breadcrumbs)
```
No breadcrumbs — el sidebar es suficiente contexto
Título de página siempre visible en el área de contenido
Subtítulo con conteo o estado ("5 reportes · 2 pendientes")
```

### 11. Estados de carga
```
Spinner: círculo de 24px, borde 2px, arco superior en celeste
         Velocidad: 0.6s linear infinite
Skeleton loader: rectángulos con shimmer animation (de left a right)
                 Color: outline-var al 60%
                 Para: listas de cards, tablas, imágenes
Página completa: spinner centrado sobre fondo surf, sin texto
```

### 12. Empty states
```
Estructura:
  Ícono Material grande (48px) — color outline-var
  Título (body-l, font-medium): "Sin [recurso] aún"
  Subtítulo (body-s, on-surf-var): instrucción o contexto
  Botón de acción (si aplica)

Estilo: no ilustraciones — minimalista Apple
        No centrado verticalmente en toda la pantalla — solo en el contenedor
```

### 13. Toasts / notificaciones
```
Posición: bottom-center en mobile, bottom-right en desktop
Ancho: auto, max 380px
Border-radius: 12px
Sombra: elev-3
Variantes:
  Success: borde izquierdo 3px verde + ícono check_circle
  Error:   borde izquierdo 3px rojo + ícono error
  Info:    borde izquierdo 3px celeste + ícono info
  Loading: spinner inline + mensaje
Sin fondo de color — fondo blanco/navy + solo el borde de color
Auto-dismiss: 3.5s con barra de progreso sutil en la base
```

### 14. Modales / Dialogs
```
Overlay: negro al 50% con backdrop-blur(4px)
Contenedor:
  Fondo: surf (#FFFFFF)
  Border-radius: 20px
  Sombra: elev-4
  Max-width: 480px (sm), 640px (md)
  Padding: 24px
  Max-height: 90vh, overflow-y: auto en el contenido

Estructura fija:
  [Ícono contextual + Título] + [X cerrar] — header
  Línea divisoria
  [Contenido — formulario o información]
  Línea divisoria
  [Botón secundario] [Botón primario] — siempre alineados a la derecha

Animación entrada: translateY(8px) opacity(0) → translateY(0) opacity(1), 200ms
```

### 15. Chips / Badges de estado
```
Estructura: ícono 14px + texto label-s + padding 4px 10px + border-radius full

Colores por estado:
  Pendiente:   fondo #FEF3C7, texto #92400E, ícono schedule
  Aprobado:    fondo #D1FAE5, texto #065F46, ícono check_circle
  Rechazado:   fondo #FEE2E2, texto #991B1B, ícono cancel
  Verificado:  fondo #D1FAE5, texto #065F46, ícono verified
  Nuevo:       fondo celeste/10%, texto celeste, ícono fiber_new
  Publicado:   fondo verde/10%, texto verde oscuro
  Borrador:    fondo gris/10%, texto gris oscuro
  Convertido:  fondo violeta/10%, texto violeta
  Reconciliado:fondo navy/10%, texto navy

Nota: fondos suaves, textos oscuros — nunca fondo saturado con texto blanco
```

### 16. Paginador
```
Estilo Apple: números simples, sin bordes en cada número
  ← Anterior  · 1 · 2 · [3] · 4 · 5 · Siguiente →
El número activo: fondo celeste #4A90D9, texto blanco, border-radius 8px
Hover: fondo surf-dim
Separador "..." si hay muchas páginas
Texto auxiliar: "Mostrando 41-60 de 127" — alineado a la izquierda, gris
```

### 17. Formularios — detalle completo
```
Input text:
  Height: 48px
  Border: 1px #D1D5E0
  Border-focus: 2px celeste #4A90D9
  Border-error: 2px rojo #DC2626
  Border-radius: 12px
  Padding: 0 16px
  Label: encima del input (no flotante) — label-m, on-surf-var
  Error: texto rojo debajo, label-s, sin ícono
  Placeholder: on-surf-var opacity 60%

Textarea:
  Igual que input pero resize: vertical only
  Min-height: 80px

Select:
  Igual que input + chevron_down icon a la derecha

Checkbox/Radio:
  Custom — no usar el nativo del browser
  Checkbox: 20x20, border-radius 6px, check en celeste
  Radio: 20x20, círculo, dot en celeste

Upload zone (fotos comprobantes/células):
  Border: 2px dashed outline-var
  Border-radius: 16px
  Padding: 32px
  Centro: ícono grande + texto + texto auxiliar
  Hover: border celeste + fondo celeste/5%
  Con archivo: preview de imagen + botón "cambiar"
```

### 18. Gráficas del dashboard (Recharts)
```
Colores de series:
  Serie 1 (principal): celeste #4A90D9
  Serie 2: violeta #7C3AED
  Serie 3: verde #10B981
  Serie 4: naranja #F59E0B

Estilo de gráfica:
  Sin bordes en el contenedor
  Eje Y: líneas horizontales muy sutiles (outline-var al 40%)
  Eje X: texto label-s, on-surf-var
  Tooltip: fondo surf, sombra elev-2, border outline-var, border-radius 8px
  No usar fondos de color en el área de la gráfica
  Dots: solo en hover
  Animación: ease-out 400ms
```

### 19. Página de login
```
Layout desktop: dos paneles 50/50
  Panel izquierdo: fondo navy profundo #060D24
    - Logo grande centrado (blanco)
    - Nombre de la iglesia bold 32px
    - Cita o frase inspiracional
    - Overlay de foto del culto con blend mode multiply
  Panel derecho: fondo blanco
    - "Bienvenido de vuelta" como título
    - Formulario centrado, max-width 380px

Layout mobile: solo el formulario, logo arriba pequeño

Formulario:
  Email + Password con toggle show/hide
  Link "¿Olvidaste tu contraseña?" — alineado a la derecha del campo
  Botón "Ingresar" — full width, filled celeste
```

### 20. Página de blog — detalle del post
```
Layout: max-width 720px centrado (como Medium)
Imagen de portada: full-width, max-height 400px, object-cover, border-radius 0
Fecha: label-s, uppercase, celeste, debajo de la imagen
Título: display-s (2.25rem), peso 800, margin-bottom 24px
Banner de red social (si tiene redirect):
  Card con ícono de la plataforma + "Ver en Instagram" + URL
  Fondo: surf-low, border: outline-var, radius: 12px
TTS player: antes del contenido
Contenido: max-width 65ch, body-l, line-height 1.8
  h2: 1.5rem, bold
  blockquote: border-left 3px celeste, italic, padding-left 16px
  Imágenes: border-radius 8px
```

### 21. Galería — lightbox
```
Overlay: negro al 90%
Imagen: centrada, max-height 85vh, max-width 90vw, object-contain
Controles:
  ← → para navegar (teclas y botones)
  X para cerrar
  Contador: "3 / 24" en la esquina superior derecha
Metadata: título en la parte inferior sobre fondo gradient
```

### 22. Sistema de motion / animaciones — Apple-first, Elevation-bold

La filosofía es: **las transiciones no se ven, se sienten.**
Apple no anima para impresionar — anima para orientar. Elevation usa el movimiento para crear momentum y energía. Juntos: fluidez que da peso y propósito.

#### Curvas de easing (las mismas que usa Apple)
```css
--ease-standard:  cubic-bezier(0.4, 0.0, 0.2, 1);   /* entradas y salidas normales */
--ease-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);  /* elementos que entran a escena */
--ease-accelerate: cubic-bezier(0.4, 0.0, 1.0, 1);  /* elementos que salen de escena */
--ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1); /* botones, checkboxes — tiny bounce */
--ease-sharp:     cubic-bezier(0.4, 0.0, 0.6, 1);   /* drawers, sidebars */
```

#### Escala de duraciones
```
50ms  — micro: cambios de color, opacity de íconos
100ms — rápido: hover de botones, focus rings
150ms — normal: hover de cards, chips, links
200ms — medio: modales entrando, tooltips
300ms — suave: page sections, sidebars
400ms — dramático: hero reveals, grandes transiciones de página
600ms — cinematográfico: SOLO para el hero del home (Elevation-style)
```

#### Regla de oro
```
Si el usuario lo inició (click, hover) → más rápido (100–150ms)
Si el sistema lo inició (carga, auto) → más lento (300–400ms)
Si es decorativo (hero) → puede ser dramático (500–600ms)
```

#### Por componente

**Botones (Apple spring feel):**
```css
/* Reposo → Hover */
transform: scale(1) → scale(1.02);
background-color: celeste → celeste oscurecido 8%;
transition: transform 100ms var(--ease-spring),
            background-color 100ms var(--ease-standard);

/* Hover → Active (press) */
transform: scale(1.02) → scale(0.98);
transition: transform 80ms var(--ease-accelerate);

/* Active → Release */
transform: scale(0.98) → scale(1);
transition: transform 200ms var(--ease-spring);
```

**Cards (flotación sutil):**
```css
/* Reposo → Hover */
transform: translateY(0) → translateY(-3px);
box-shadow: elev-1 → elev-2;
transition: transform 180ms var(--ease-decelerate),
            box-shadow 180ms var(--ease-standard);
/* NUNCA más de -4px — Apple nunca exagera */
```

**Focus rings (accesibilidad Apple):**
```css
/* Aparecen con keyboard, no con mouse */
outline: 3px solid rgba(74, 144, 217, 0.5);
outline-offset: 2px;
transition: outline-offset 100ms var(--ease-spring);
/* Al obtener focus: outline-offset 2px → 0px en 80ms → 2px en 150ms */
/* Ese micro-bounce es exactamente lo que hace Apple */
```

**Modales (peso y presencia):**
```css
/* Entrada */
opacity: 0 → 1;
transform: scale(0.95) translateY(8px) → scale(1) translateY(0);
transition: opacity 200ms var(--ease-decelerate),
            transform 250ms var(--ease-decelerate);

/* Salida */
opacity: 1 → 0;
transform: scale(1) → scale(0.97);
transition: opacity 150ms var(--ease-accelerate),
            transform 150ms var(--ease-accelerate);
/* Salida SIEMPRE más rápida que entrada — ley de Apple */
```

**Sidebar / Drawer:**
```css
/* Entrada */
transform: translateX(-100%) → translateX(0);
transition: transform 280ms var(--ease-sharp);

/* Overlay */
opacity: 0 → 0.5;
transition: opacity 280ms var(--ease-standard);
```

**Aparición de listas (stagger — Elevation-style):**
```css
/* Cada ítem de una lista aparece con 40ms de delay entre ellos */
/* Efecto: ola de arriba hacia abajo */
.list-item:nth-child(1) { animation-delay: 0ms }
.list-item:nth-child(2) { animation-delay: 40ms }
.list-item:nth-child(3) { animation-delay: 80ms }
/* máximo 5 ítems con stagger — el resto aparece sin delay */

/* La animación de cada ítem */
@keyframes slideInUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
animation: slideInUp 300ms var(--ease-decelerate) both;
```

**Hero del home (Elevation dramático):**
```css
/* El título aparece en dos partes con 120ms entre ellas */
/* Línea 1: */
animation: heroReveal 600ms var(--ease-decelerate) 100ms both;

/* Línea 2: */
animation: heroReveal 600ms var(--ease-decelerate) 220ms both;

/* Subtítulo: */
animation: heroReveal 400ms var(--ease-decelerate) 380ms both;

/* Botones: */
animation: heroReveal 400ms var(--ease-decelerate) 480ms both;

@keyframes heroReveal {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
/* Resultado: el hero se construye visualmente de arriba hacia abajo
   como si cada elemento "cayera" suavemente al lugar — signature Elevation */
```

**Inputs (micro-feedback Apple):**
```css
/* Focus */
border-color: outline-var → celeste;
box-shadow: 0 0 0 0px rgba(74,144,217,0.3) → 0 0 0 3px rgba(74,144,217,0.3);
transition: border-color 100ms var(--ease-standard),
            box-shadow 150ms var(--ease-spring);
/* El ring "crece" desde el borde hacia afuera — exactamente iOS */

/* Error */
border-color: celeste → rojo;
/* Además: pequeña vibración horizontal */
animation: shake 300ms var(--ease-standard);
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-4px); }
  40%       { transform: translateX(4px); }
  60%       { transform: translateX(-3px); }
  80%       { transform: translateX(3px); }
}
```

**Tabs / Filter chips:**
```css
/* El indicador activo se desliza entre tabs — no aparece/desaparece */
/* Usar motion layout o transition de left/width */
transition: left 200ms var(--ease-spring),
            width 200ms var(--ease-spring);
/* El chip "salta" de posición — signature Apple tabs */
```

**Toasts:**
```css
/* Entrada desde abajo */
transform: translateY(100%) → translateY(0);
opacity: 0 → 1;
transition: transform 300ms var(--ease-spring),
            opacity 200ms var(--ease-standard);

/* Salida hacia arriba (no hacia abajo) — Apple siempre sale hacia donde vino */
transform: translateY(0) → translateY(-8px);
opacity: 1 → 0;
transition: transform 200ms var(--ease-accelerate),
            opacity 150ms var(--ease-accelerate);
```

**Skeletons (loading):**
```css
/* Shimmer de izquierda a derecha — velocidad Apple */
@keyframes shimmer {
  from { background-position: -200% center; }
  to   { background-position: 200% center; }
}
background: linear-gradient(90deg,
  var(--surf-dim) 0%,
  var(--surf-high) 50%,
  var(--surf-dim) 100%
);
background-size: 200% 100%;
animation: shimmer 1.5s ease-in-out infinite;
/* 1.5s es el ritmo exacto que usa Apple en iOS skeleton loaders */
```

#### Lo que NUNCA hacer
```
❌ bounce exagerado (spring > 1.6 en amplitud)
❌ transiciones > 500ms en elementos de UI (solo hero)
❌ animate-bounce de Tailwind — demasiado agresivo
❌ animaciones en loop que no sean loading states
❌ fade + scale + translateY + rotate todo junto
❌ diferentes duraciones para el mismo tipo de elemento
❌ transitions en propiedades que no sean transform/opacity/color/shadow
   (animar width, height, padding causa reflow = laggy)
```

#### La diferencia Apple vs Elevation en motion
```
Apple:  invisible, funcional, consistente — el usuario no lo nota conscientemente
Elevation: usarlo en los MOMENTOS DE IMPACTO — hero reveal, página nueva, logro
Juntos: UI suave como Apple, momentos dramáticos como Elevation en los heroes
        y en transiciones de sección importantes
```

### 23. Página 404 / Error
```
Fondo: navy #0D1B4B
Número de error: 6rem, peso 900, blanco al 20% (enorme, decorativo)
Mensaje: "Página no encontrada" — blanco, título-l
Subtítulo: blanco al 60%, body-m
Botón: "Volver al inicio" — outlined blanco
Sin ilustraciones — solo tipografía
```

### 24. Tarjeta de conexión pública (/comprobante y futuro /conectarme)
```
Diseño: card centrada, max-width 560px, fondo blanco
Header: navy con logo e ícono contextual
Datos bancarios: table-like, clean
Upload zone: prominente, el elemento más importante
Botón submit: full-width, celeste, altura 52px
```

### 25. Perfil de usuario (/profile)
```
Header del perfil:
  Avatar: iniciales en círculo navy, 64px
  Nombre + rol (chip)
  Email

Sección de metas:
  Lista vertical de GoalCards
  GoalCard: checkbox custom + título + fecha + botón eliminar
  Completadas: tachadas, opacidad 60%, al final de la lista
  Nueva meta: botón + inline form (no modal)
```

---

## Output esperado (completo)

Genera todo esto como un sistema coherente:

1. **Variables CSS completas** — todos los tokens de color para `index.css`
2. **Tokens Tailwind** — colores, radios, sombras para `tailwind.config.js`
3. **Mockups de pantallas públicas:**
   - Hero del home
   - Card de evento (gratis y con precio)
   - Card de blog (con y sin redirect a red social)
   - Página de login (desktop)
4. **Mockups de paneles internos:**
   - Sidebar admin con nuevo estilo
   - Dashboard con KPIs y gráficas
   - Tabla de reportes de célula
5. **Sistema de componentes:**
   - Todos los estados de chips/badges
   - Botones (todas las variantes)
   - Formulario completo
   - Toast/notificación
   - Modal
6. **Guía de motion** — tabla de duraciones y easings

El resultado debe verse como si lo hubiera diseñado el equipo de Elevation Church con la pulcritud de Apple, usando los colores de marca de Casa del Rey.
