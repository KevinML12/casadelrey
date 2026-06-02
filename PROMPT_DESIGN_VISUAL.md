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

## Output esperado

Genera:
1. **Sistema de colores** completo en variables CSS
2. **Tokens de tipografía** para Tailwind
3. **Mockup del hero** del sitio público
4. **Mockup de card** de evento (con y sin precio)
5. **Mockup del sidebar** admin con el nuevo estilo
6. **Paleta visual** con todos los colores y sus usos

El resultado debe verse como si lo hubiera diseñado el equipo de Elevation Church con la pulcritud de Apple, usando los colores de marca de la iglesia.
