# Prompt para Pencil — Patrones Apple.com para Casa del Rey

> **Pegar este prompt como continuación** del Style Guide que está generando.
> Esto refina la estética con patrones específicos de apple.com/la (no del HIG abstracto, sino del sitio real).

---

Aplica los siguientes **patrones específicos de apple.com/la** al sistema de Casa del Rey. No copies a Apple — adapta sus patrones a la marca de la iglesia (navy + celeste, no azul Apple).

---

## 1. NAV SUPERIOR STICKY (CRÍTICO — copia exacto el patrón)

```
┌─────────────────────────────────────────────────────────────────────┐
│  🌐  Inicio   Nosotros   Eventos   Blog   Voluntarios   Donar   🔍 │
└─────────────────────────────────────────────────────────────────────┘
```

**Especificaciones (idénticas a Apple):**
- Altura: 44px (sí, solo 44px — más delgado que Bootstrap)
- Fondo: `rgba(255,255,255,0.72)` con `backdrop-filter: blur(20px) saturate(180%)`
- Sobre hero oscuro: `rgba(13,27,75,0.72)` con backdrop blur
- Items centrados al medio del nav (no a la izquierda como Bootstrap)
- Logo del mapamundi a la izquierda, 18px alto
- Search icon a la derecha (no botón Login — el login va más sutil)
- Cada item: padding `8px 16px`, font `14px peso 400`, NO uppercase
- Hover de item: opacity `0.8` (sin underline, sin cambio de color)
- Item activo: opacity `1.0` (los demás `0.85`)
- NO usar borders, dividers ni sombras — solo el blur del fondo

**Mostrar 3 estados del nav:**
1. Sobre fondo blanco → nav blanco translúcido, items en `#050505`
2. Sobre fondo oscuro → nav navy translúcido, items en blanco
3. Mega-menu desplegado al hacer hover en "Nosotros"

---

## 2. MEGA-MENU (cuando hover en un item del nav)

Cuando el usuario hace hover en "Eventos" o "Nosotros", se despliega un panel de ancho completo (no dropdown estrecho).

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Conoce Casa del Rey            Más sobre nosotros                  │
│                                                                     │
│  Nuestra historia              Soporte espiritual                   │
│  Pastores Leonel e Ismeina     Únete a una célula                   │
│  Visión y propósito            Conviértete en voluntario            │
│  Equipo pastoral               Únete al equipo de oración           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Animación de apertura: `opacity 0→1` + `translateY(-8px → 0)` en 300ms `ease-decelerate`
- Padding interno: `48px 96px`
- Columna izquierda (60%): título "Conoce Casa del Rey" en 11px tracking 0.15em gris, debajo lista en Inter 600 28px black negro/blanco con espacio entre items
- Columna derecha (40%): título secundario, debajo lista en Inter 400 14px gris claro
- Hover en cada item: el item se vuelve azul/celeste, los demás se atenúan a `opacity 0.5`
- Click fuera del menú = cierra
- Tab para navegar entre items, Enter para entrar

---

## 3. HERO PATTERN APPLE (para landing pages secundarias)

Este es el patrón que usa Apple en cada producto. Aplícalo a páginas como `/eventos`, `/blog`, `/voluntarios`:

```
                    [foto/ícono sutil]

                          Eventos.

           Conéctate con tu generación cada semana.

              [Ver próximos]    [Comprar entrada]
                ◯ filled         ◯ outlined
```

**Specs:**
- Padding superior: 64px desde el nav
- Padding inferior: 96px
- Título: Inter 700, `clamp(2.5rem, 5vw, 4rem)`, letter-spacing `-0.03em`, centrado
- Subtítulo: Inter 400, 24px, color `#525B7A`, centrado, max-width 600px
- Dos botones pill lado a lado, gap 16px
- Botón 1 filled: fondo `#0D1B4B`, texto blanco, padding `12px 24px`, border-radius `9999px`, font 17px peso 400
- Botón 2 outlined: fondo transparente, borde 1px `#0D1B4B`, texto `#0D1B4B`, misma altura
- Foto del producto/ícono: debajo del bloque, centrada, full-bleed o con border-radius grande (32px)
- **NO usar título "Eventos y Cultos"** — Apple usa "Eventos." con punto. Limpio.

---

## 4. FAMILIA DE PRODUCTOS (tira horizontal scrollable)

Apple muestra todos sus productos en una tira de íconos con badges "Nueva" / "Nuevos". Aplica a las **células** y **departamentos de voluntariado**:

```
   📷           🎵           ⛪           🎤           🎨
Hombres      Mujeres      Jóvenes      Prejus       Niños
                            Nuevo
─────────────────────────────────────────────────────────
```

**Specs:**
- Cards 120×160px (foto/ícono grande arriba, label debajo)
- Imagen circular o con border-radius 24px
- Label en Inter 600 14px, centrado debajo
- Badge "Nuevo": Inter 600 11px, color `#FF6B00` (naranja Apple) DEBAJO del label
- Espacio entre cards: 24px
- Hover: scale 1.05, 150ms ease-spring
- Scroll horizontal si no caben (con snap)
- Sin sombras — solo separación por espaciado

---

## 5. SECTION DIVIDERS (alternancia Apple)

Apple alterna fondos entre secciones SIN usar líneas divisorias. Solo color.

```
[Sección 1] Fondo BLANCO   → Hero principal
[Sección 2] Fondo NEGRO    → "Únete al movimiento" CTA
[Sección 3] Fondo BLANCO   → Próximos eventos
[Sección 4] Fondo GRIS CLARO #F5F5F7  → Galería
[Sección 5] Fondo NEGRO    → Donaciones
[Sección 6] Fondo BLANCO   → Voz/testimonios
```

**Specs:**
- Cada sección: padding vertical mínimo `96px`, idealmente `128px`
- Padding horizontal: `48px` desktop, `24px` mobile
- Max-width del contenido: `1024px` centrado (no `1440px` — Apple es más estrecho de lo que parece)
- Transición entre secciones: cero líneas, cero sombras, solo el cambio de fondo
- Texto sobre negro: blanco puro
- Texto sobre gris claro: `#1D1D1F` (no negro puro — el negro suave de Apple)

---

## 6. CARDS APPLE-STYLE (sin chrome)

Apple no usa cards con borde + sombra + padding interno. Sus "cards" son rectángulos con border-radius grande y la imagen es el protagonista.

```
┌────────────────────────────────────┐
│                                    │
│         [foto a sangre]            │
│                                    │
│                                    │
│  CULTO ESPECIAL                    │
│  Noche de Adoración                │
│  Domingo 7pm · Templo Central      │
│           [Registrarme →]          │
└────────────────────────────────────┘
```

**Specs:**
- Border-radius: 28px (grande, casi un squircle)
- Sin borde 1px gris
- Sin sombra en reposo
- Imagen: full-bleed dentro de la card, `aspect-ratio: 16/10`
- Padding interno SOLO para el área de texto: `32px`
- Background: blanco o un gris MUY claro (`#F5F5F7`)
- Hover: la card escala 1.02, 200ms ease-spring. Sin sombra agregada.
- En mobile: padding `24px`

---

## 7. BOTONES PILL — exactos como Apple

```
[ Más información ]    [ Conócenos ]
  ─── filled ───        ── outlined ──
```

**Filled:**
- Background: `#0D1B4B` (navy de Casa del Rey, no azul Apple)
- Text: blanco
- Padding: `12px 24px`
- Border-radius: `9999px`
- Font: 17px peso 400 Inter
- **NO peso 600 ni bold** — Apple usa regular (400), eso es lo que se ve premium
- Hover: opacity 0.9, 100ms
- Active: scale 0.97

**Outlined:**
- Background: transparente
- Border: 1px `#0D1B4B`
- Text: `#0D1B4B`
- Mismas dimensiones
- Hover: background `rgba(13,27,75,0.05)`, 100ms

**Texto-only (terciario tipo "Conoce más →"):**
- No background, no borde
- Color: `#4A90D9` celeste
- Sufijo flecha "→"
- Hover: la flecha se desplaza 4px a la derecha, 200ms ease-spring

---

## 8. TIPOGRAFÍA APPLE EN SU SITIO

Apple usa pesos más livianos de lo que la gente cree:

| Uso | Peso | Tamaño |
|---|---|---|
| Hero title | **700 Bold** (NO 900 Black) | 56-96px |
| Section title | **600 Semibold** | 32-48px |
| Body | **400 Regular** | 17-21px |
| Caption | **400 Regular** | 13-15px |
| Footer/legal | **400 Regular** | 12px gris |

**Notar:**
- Apple NUNCA usa peso 900 ni 800 — solo 700 max
- El sentido de "drama" lo da el TAMAÑO, no el peso
- Letter-spacing siempre cercano a 0 (a veces `-0.022em` en hero)
- Line-height: 1.07-1.1 en hero, 1.5 en body

**Ajuste para Casa del Rey:**
- Mantener Inter 900 SOLO para "LUZ PARA LAS NACIONES" (signature Elevation)
- Todo lo demás Apple-style: peso 700 para títulos, 400 para body
- Esto da la mezcla perfecta: drama en el hero principal, sobriedad Apple en el resto

---

## 9. SEARCH (modal full-screen estilo Apple)

Cuando el usuario hace click en la lupa del nav, NO se abre un dropdown pequeño. Se abre una capa full-screen:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│    🔍  Buscar eventos, sermones, voluntarios...      ✕  │
│                                                         │
│    SUGERIDO                                             │
│    Próximos eventos                                     │
│    Cómo unirme a una célula                             │
│    Pastores                                             │
│                                                         │
│    POPULAR                                              │
│    Voz y propósito                                      │
│    Acoge en tu hogar                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Specs:**
- Background: `rgba(255,255,255,0.95)` con backdrop blur
- Input gigante: Inter 400 28px, sin border, solo separación por color
- Padding generoso: 96px arriba del input
- Sugerencias en columnas, hover azul
- Cerrar con Esc o click fuera

---

## 10. FOOTER APPLE-STYLE

Apple tiene footer denso pero limpio. Multi-columna, tipografía pequeña, gris claro.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  CASA DEL REY                                           │
│                                                         │
│  Sobre nosotros    Sirve            Comunidad           │
│  Historia          Voluntariado     Eventos             │
│  Pastores          Departamentos    Blog                │
│  Visión            Donaciones       Galería             │
│                                                         │
│                                                         │
│  Domingos 10am · Zona 1 · Huehuetenango                 │
│  © 2026 Casa del Rey                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Specs:**
- Background: `#F5F5F7` (gris muy claro Apple) o navy `#060D24`
- Padding: 48px vertical, 32px horizontal
- Columnas: 3-4 con headers en Inter 600 12px y links en Inter 400 12px
- Headers en gris medio, links en gris oscuro, hover negro
- Sin íconos sociales gigantes — solo text links discretos
- Logo NO en el footer (ya está en el nav)
- Copyright pequeño abajo, alineado izquierda

---

## RESUMEN DE LOS PRINCIPIOS APPLE A ADOPTAR

✅ Nav delgado (44px), translúcido con blur, items NO uppercase
✅ Mega-menú asimétrico de 2 columnas (60/40)
✅ Hero con título Apple-style (peso 700, no 900) + 2 botones pill
✅ Familia de productos como tira horizontal con badges
✅ Alternancia de secciones por color de fondo, sin líneas divisorias
✅ Cards sin chrome (sin borde, sin sombra, solo border-radius grande)
✅ Botones pill 9999px, padding 12px 24px, peso 400
✅ Tipografía con pesos livianos (drama por tamaño, no por peso)
✅ Search modal full-screen
✅ Footer denso pero limpio en gris muy claro
✅ Max-width 1024px, no 1440px
✅ Padding vertical 96-128px entre secciones

✅ MANTENER de Casa del Rey:
- "LUZ PARA LAS NACIONES" en Inter 900 con outline (este sí queda dramático Elevation)
- Cita bíblica en Playfair italic
- Logo mapamundi prominente
- Violeta como acento ocasional

---

## Output

Genera UN frame adicional al style guide que muestre:

1. **Nav superior** en sus 3 estados (sobre claro, sobre oscuro, con mega-menu abierto)
2. **Hero pattern Apple** aplicado a página de eventos (NO el hero principal — ese sigue siendo el dramático)
3. **Familia de células** como tira horizontal con badges "Nueva"
4. **3 secciones consecutivas** con alternancia de fondos (blanco → negro → gris claro)
5. **Cards estilo Apple** sin chrome
6. **Botones pill** filled y outlined, lado a lado
7. **Search modal** abierto
8. **Footer** completo

Este frame se llama: **"Casa del Rey × Apple Patterns"**

Mostrar estos patrones aplicados con contenido REAL de la iglesia (no abstracto).
