# Prompts atómicos para Pencil — Refactor por componente

> Cada prompt es **independiente** — Pencil no recuerda contexto entre conversaciones.
> Cada uno tiene specs exactas para que NO improvise.
> **Modelo recomendado:** Sonnet 4.6 en **Normal** (no High — son tareas puntuales).
>
> **Orden sugerido de implementación:** del 1 al 12 (impacto visual descendente).

---

## TOKENS COMUNES (incluye estos en CADA prompt al inicio)

```
SISTEMA Casa del Rey — Brand v1.0

COLORES:
  Navy:        #0D1B4B   (primario)
  Navy press:  #091237
  Navy deep:   #060D24   (hero/dark)
  Turquesa:    #4AD0CE   (acento principal — celeste)
  Violeta:     #7C3AED   (acento juvenil opcional)
  Cream:       #FAFAF8   (fondo del sitio)
  Surface:     #FFFFFF   (cards)
  Tinta:       #050505   (texto)
  Texto sec:   #525B7A
  Borde:       #E5E7EB

TIPOGRAFÍA:
  Inter para todo (400/500/600/700/800/900)
  Playfair Display Italic para citas bíblicas
  JetBrains Mono para metadata editorial (tracking 0.2em)

RADIOS:  4 / 8 / 12 / 16 / 24 / 28 / pill 9999px
EASINGS: spring cubic-bezier(0.34, 1.56, 0.64, 1)
         decelerate cubic-bezier(0, 0, 0.2, 1)

REGLAS:
  ✗ NO gradient orbs SaaS
  ✗ NO sombras heavy
  ✗ NO violeta dominante (solo acento juvenil)
  ✓ Asimetría editorial
  ✓ Apple HIG en componentes UI
  ✓ Elevation drama solo en hero principal
```

---

# 🏠 PROMPT 1 — HERO DEL HOME (el más importante)

```
[PEGAR TOKENS COMUNES]

Diseña el HERO PRINCIPAL de la página de inicio de Casa del Rey.
Este es el frame más importante — un visitante nuevo decide en 3 segundos si la iglesia es para él.

VIEWPORT: 1440 × 900 desktop, full bleed (sin max-width).

LAYOUT:
- Fotografía masiva del culto con iluminación violeta/celeste (placeholder de pexels.com)
- Overlay navy #060D24 con opacity 50% sobre la foto
- Grano/noise sutil 5% opacity sobre toda el área

CONTENIDO (alineado a la izquierda, padding-left 96px):

1. Esquina superior izquierda (top: 32px):
   "● IGLESIA CRISTIANA · HUEHUETENANGO · DESDE 2016"
   Inter 600, 12px, uppercase, tracking 0.15em, color #4AD0CE
   El bullet ● en turquesa

2. Esquina superior derecha (top: 32px, right: 48px):
   "MATEO 5:14"
   JetBrains Mono 500, 11px, tracking 0.2em, color #4AD0CE

3. Título principal — el momento dramático (center vertical, left-aligned):
   Línea 1: "LUZ PARA"
     Inter 900, clamp(4rem, 9vw, 8rem)
     Color: blanco sólido
     Letter-spacing: -0.05em
     Line-height: 0.9

   Línea 2: "LAS NACIONES"
     Misma tipografía y tamaño
     Color: transparent + -webkit-text-stroke 2px white
     DESPLAZADA 120px a la derecha (asimetría editorial)

4. Subtítulo (debajo del título, margin-top 48px):
   "Empieza tu propósito aquí."
   Inter 400, 1.5rem, color rgba(255,255,255,0.85)
   Max-width: 480px

5. Schedule (margin-top 8px):
   "Domingos · 10am · Zona 1, Huehuetenango"
   Inter 500, 0.875rem, uppercase, tracking 0.1em
   Color: rgba(255,255,255,0.6)

6. Botones (margin-top 56px, flex gap 16px):
   Botón 1 PRIMARIO:
     Texto: "Ver próximos eventos"
     Fondo: #7C3AED violeta (este botón usa el acento juvenil)
     Texto blanco, Inter 400, 17px
     Padding: 12px 24px, border-radius 9999px

   Botón 2 SECUNDARIO:
     Texto: "Conócenos →"
     Sin fondo, sin borde, solo texto blanco
     Inter 400, 17px
     La flecha → tiene margin-left 8px

7. Stats al fondo del hero (bottom 80px del viewport):
   Layout asimétrico editorial — NO 3 columnas iguales:

   "200+" a la izquierda — Inter 900, clamp(4rem, 8vw, 7rem), blanco
   Debajo: "FAMILIAS" — Inter 500, 11px, uppercase, tracking 0.15em, rgba(255,255,255,0.5)

   "20+" y "10" al centro-derecha, ambos más pequeños:
     Inter 800, clamp(2rem, 4vw, 3rem)
     Debajo: "CÉLULAS ACTIVAS" y "AÑOS SIRVIENDO"
     Separados por línea vertical 1px #4AD0CE al 40% opacity, altura 60px

8. Scroll hint (bottom 24px, centered):
   "↓ EXPLORAR"
   Inter 600, 11px, uppercase, tracking 0.2em, rgba(255,255,255,0.5)
   El ↓ con animación sutil sube/baja 4px loop 2s

OUTPUT: mockup desktop 1440×900 + mockup mobile 375×812 (en mobile el offset de 120px de "LAS NACIONES" se elimina, ambas líneas quedan alineadas a la izquierda).
```

---

# 🧭 PROMPT 2 — NAV SUPERIOR STICKY

```
[PEGAR TOKENS COMUNES]

Diseña la NAVEGACIÓN SUPERIOR sticky de Casa del Rey.
Patrón exacto: copiado de apple.com/la — translúcido con blur, items centrados.

VIEWPORT: 1440 × 88 (mostrar los 3 estados apilados verticalmente, cada uno 1440×88)

SPECS:
- Altura: 44px (sí, solo 44px — Apple es delgado)
- Logo del mapamundi a la izquierda, 22px alto
- Items centrados (NO a la izquierda como Bootstrap)
- Search icon a la derecha
- Sin bordes, sin sombras, sin underlines

ESTADO 1 — Sobre fondo blanco (página claro scroll):
- Fondo: rgba(255,255,255,0.72) + backdrop-blur(20px) saturate(180%)
- Logo: color #050505 (negro)
- Items: Inter 400, 14px, color #050505, padding 8px 16px
- Items: NO uppercase, NO bold, sin underline
- Hover de item: opacity 0.7 (sin cambio de color)

Items a mostrar:
Inicio · Nosotros · Eventos · Blog · Voluntarios · Donar

ESTADO 2 — Sobre fondo oscuro (sobre hero navy):
- Fondo: rgba(13,27,75,0.72) + backdrop-blur
- Logo: blanco invertido
- Items: blancos, opacity 0.85 en inactivos, opacity 1.0 en activo
- Mismo padding y tipografía

ESTADO 3 — Mega-menu abierto (al hover sobre "Nosotros"):
- Panel ancho completo de 480px alto
- Animación: opacity 0→1 + translateY(-8px → 0), 300ms decelerate
- Layout asimétrico 60/40:

  Columna izquierda (60%):
    Label arriba: "CONOCE CASA DEL REY"
    Inter 600, 11px, tracking 0.15em, color #525B7A

    Items en lista vertical (Inter 600, 28px, color #050505):
      Nuestra historia
      Pastores Leonel e Ismeina
      Visión y propósito
      Equipo pastoral

  Columna derecha (40%):
    Label: "MÁS SOBRE NOSOTROS"
    Items en Inter 400, 14px, color #525B7A:
      Soporte espiritual
      Únete a una célula
      Conviértete en voluntario
      Únete al equipo de oración

OUTPUT: frame 1440 × 600 con los 3 estados apilados verticalmente, separados por 32px de espacio.
```

---

# 🦶 PROMPT 3 — FOOTER

```
[PEGAR TOKENS COMUNES]

Diseña el FOOTER de Casa del Rey.
Estilo Apple — denso pero limpio, gris muy claro, multi-columna, tipografía pequeña.

VIEWPORT: 1440 × 480

LAYOUT:
- Fondo: #F5F5F7 (gris muy claro)
- Padding: 64px vertical, 96px lateral
- 4 columnas equidistantes

COLUMNA 1 — Casa del Rey:
  Header: "CASA DEL REY"
  Inter 600, 12px, tracking 0.1em, color #525B7A

  Items debajo (Inter 400, 13px, color #050505):
    Luz para las naciones
    Domingos 10:00 a.m.
    Miércoles 7:00 p.m.
    Huehuetenango, Guatemala
    info@casadelrey.gt

COLUMNA 2 — Conecta:
  Header: "CONECTA"
  Items:
    Planifica tu visita
    Nuevos en casa
    Células por zona
    Oración y consejería
    Bautismo

COLUMNA 3 — Crece:
  Header: "CRECE"
  Items:
    Sermones recientes
    Series bíblicas
    Escuela de liderazgo
    Casa Kids
    Jóvenes del Rey

COLUMNA 4 — Sirve:
  Header: "SIRVE"
  Items:
    Voluntariado
    Alabanza y producción
    Misiones
    Generosidad
    Eventos

SEPARADOR: línea horizontal 1px #E5E7EB al 100% ancho, margin-top 48px.

PIE DEL FOOTER (debajo del separador):
  Izquierda:
    "Casa del Rey · Huehuetenango, Guatemala · Servicios presenciales y en línea"
    Inter 400, 12px, color #525B7A

  Derecha:
    "© 2026 Casa del Rey. Todos los derechos reservados."
    Inter 400, 12px, color #525B7A

NO INCLUIR:
- Íconos sociales grandes (Apple no los usa)
- Newsletter signup (Apple no lo tiene)
- Logo gigante (ya está en el nav)

OUTPUT: frame 1440 × 480 con el footer completo.
```

---

# 🎟 PROMPT 4 — CARD DE EVENTO

```
[PEGAR TOKENS COMUNES]

Diseña la CARD DE EVENTO en 3 estados: default, hover, sin foto.

VIEWPORT: 1280 × 600 (mostrar las 3 cards lado a lado, gap 24px)

CARD SPECS (cada una 380 × 480px):
- Border-radius: 28px
- SIN borde 1px
- SIN sombra en reposo
- Background: #FFFFFF

ESTRUCTURA:
1. Imagen del evento (foto culto/iglesia):
   - Ocupa los primeros 280px de altura
   - object-fit: cover
   - Aspect ratio 16:11

2. Contenido (padding 24px):
   - Label superior:
     "CULTO ESPECIAL" o "CONFERENCIA" o "RETIRO"
     Inter 600, 11px, uppercase, tracking 0.15em
     Color #4AD0CE turquesa

   - Título (margin-top 8px):
     "Noche de Adoración" o nombre del evento
     Inter 700, 24px, color #050505
     Letter-spacing -0.01em

   - Fecha/lugar (margin-top 4px):
     "Domingo · 7pm · Templo Central"
     Inter 400, 14px, color #525B7A

   - Botón al fondo (position absolute, bottom 24px):
     Texto: "Registrarme →"
     Solo texto, Inter 600, 14px, color #0D1B4B navy
     Sin fondo ni borde

CARD 1 — Default (reposo): como descrito arriba.

CARD 2 — Hover:
- transform: translateY(-3px)
- box-shadow: 0 10px 25px rgba(13,27,75,0.10)
- La flecha → del botón se desplaza 4px a la derecha
- Transición 200ms ease-spring

CARD 3 — Sin foto (fallback):
- En lugar de foto: fondo navy #0D1B4B sólido en los primeros 280px
- Logo mapamundi blanco centrado al 30% opacity
- Resto del contenido igual

OUTPUT: frame con las 3 cards lado a lado + label arriba de cada una indicando su estado.
```

---

# 📰 PROMPT 5 — CARD DE BLOG (foto a sangre estilo Elevation)

```
[PEGAR TOKENS COMUNES]

Diseña la CARD DE BLOG con foto a sangre + gradient overlay.

VIEWPORT: 1280 × 520 (3 cards lado a lado, gap 24px)

CARD SPECS (380 × 480px):
- Border-radius: 24px
- overflow: hidden
- SIN borde
- SIN sombra hasta hover

ESTRUCTURA:
- Foto a sangre ocupa el 100% del área de la card
- Gradient overlay de abajo hacia arriba:
    linear-gradient(to top,
      rgba(6,13,36,0.95) 0%,
      rgba(6,13,36,0.6) 40%,
      transparent 70%)

- Contenido posicionado en el bottom:
  Padding: 32px

  Label de plataforma/categoría (top):
    Si tiene redirect_url → "[📷] INSTAGRAM"
    Si es post normal  → "REFLEXIÓN" o "ENSEÑANZA"
    Background rgba(0,0,0,0.5) backdrop-blur, padding 4px 10px, radius 6px
    Inter 600, 10px, tracking 0.15em, blanco

  Título (margin-top auto, pegado al bottom):
    "La fe que mueve montañas"
    Inter 700, 26px, color blanco
    Letter-spacing -0.01em
    Line-height 1.15
    Max 3 líneas con line-clamp

  Metadata (margin-top 12px):
    "Pastor Roberto · 15 jun · 4 min de lectura"
    Inter 400, 13px, color rgba(255,255,255,0.7)

ESTADOS:
- Default: como arriba
- Hover: transform scale(1.02), 250ms ease-decelerate
- Si tiene redirect_url: cursor pointer + ícono → en esquina superior derecha

OUTPUT: 3 cards con fotos distintas (reflexión, post Instagram, video) en una fila.
```

---

# 🔘 PROMPT 6 — BOTONES (Apple pills)

```
[PEGAR TOKENS COMUNES]

Diseña el SISTEMA DE BOTONES de Casa del Rey.
Estilo Apple — pills, padding 12px 24px, peso 400 (NO bold).

VIEWPORT: 1440 × 800

MOSTRAR matriz de 5 variantes × 4 estados = 20 botones.

VARIANTES (filas):

1. PRIMARIO NAVY:
   Background: #0D1B4B
   Texto: blanco, Inter 400, 17px
   Padding: 12px 24px
   Border-radius: 9999px

2. PRIMARIO VIOLETA (para eventos juveniles):
   Background: #7C3AED
   Texto: blanco

3. SECUNDARIO OUTLINED:
   Background: transparent
   Border: 1px #0D1B4B
   Texto: #0D1B4B, Inter 400, 17px

4. TERCIARIO TEXT-ONLY:
   Sin fondo, sin borde
   Texto: #0D1B4B navy + sufijo "→"
   Inter 600, 17px

5. DESTRUCTIVO:
   Background: #EF4444
   Texto: blanco

ESTADOS (columnas):

A. DEFAULT: como descrito arriba

B. HOVER:
   - Filled: opacity 0.9, transform scale(1.02)
   - Outlined: background rgba(13,27,75,0.05)
   - Text-only: la flecha → se desplaza 4px a la derecha
   - Transition: 100ms cubic-bezier(0.34, 1.56, 0.64, 1) spring

C. ACTIVE (press):
   transform scale(0.97), 80ms accelerate

D. DISABLED:
   opacity 0.4
   cursor: not-allowed
   Sin transformaciones

TEXTOS DE EJEMPLO (usar uno por fila, contenido REAL de iglesia):
- Primario navy:    "Planifica tu visita"
- Primario violeta: "Únete al movimiento"
- Outlined:         "Conócenos"
- Text-only:        "Ver más eventos →"
- Destructivo:      "Eliminar reporte"

DEBAJO DE LA MATRIZ — sección de specs:
Caja oscura (#060D24) con código CSS de cada estado y su timing.

OUTPUT: matriz 5×4 completa con label arriba de cada columna y label izquierdo de cada fila.
```

---

# 📝 PROMPT 7 — INPUTS Y FORMULARIOS

```
[PEGAR TOKENS COMUNES]

Diseña el SISTEMA DE INPUTS de Casa del Rey.

VIEWPORT: 1280 × 1000 (todos los inputs apilados verticalmente)

ESPECIFICACIONES BASE:
- Altura: 48px (apple HIG)
- Border-radius: 12px
- Border: 1px #E5E7EB
- Padding horizontal: 16px
- Font: Inter 400, 17px, color #050505
- Placeholder: color #9CA3B8

ESTADOS:

1. DEFAULT:
   Label arriba: "Correo electrónico"
   Inter 600, 14px, color #525B7A
   Margin-bottom: 8px del input

2. FOCUS:
   Border: 2px #0D1B4B navy
   Box-shadow: 0 0 0 3px rgba(13, 27, 75, 0.20)
   Transición ring crece desde 0 → 3px, 150ms spring
   Label se queda arriba (no flota)

3. FILLED:
   Border: 1px #E5E7EB
   Texto: "pedro@casadelrey.gt" en #050505

4. ERROR:
   Border: 2px #EF4444
   Mensaje debajo: "El correo no es válido"
   Mensaje en Inter 400, 13px, color #EF4444
   Animación shake: ±4px horizontal, 300ms

5. DISABLED:
   Background: #F4F6FB
   Texto: #9CA3B8
   cursor: not-allowed
   opacity: 0.7

6. CON ÍCONO LEFT:
   Ícono Material "mail" 18px a 16px de la izquierda
   Texto con padding-left ajustado

VARIANTES ADICIONALES:

7. TEXTAREA:
   Min-height: 96px
   Resize: vertical only
   Mismo styling base
   Placeholder: "Cuéntanos qué necesitas..."

8. SELECT:
   Chevron_down ícono 18px a la derecha
   Click → dropdown con border-radius 12px y shadow elev-2
   Items del dropdown: padding 12px 16px, hover background #F4F6FB

9. CHECKBOX:
   20×20px, border-radius 6px
   Default: border 2px #E5E7EB, background blanco
   Checked: background #0D1B4B navy, check blanco
   Animación check: scale 0 → 1, 200ms spring

10. RADIO:
    20×20 circular
    Default: border 2px #E5E7EB
    Checked: border 6px #0D1B4B con centro blanco
    (Crea efecto dot dentro)

11. TOGGLE (switch iOS):
    Width 48px, height 28px
    Background off: #E5E7EB
    Background on: #0D1B4B navy
    Dot: 24px blanco con sombra sutil
    Animación 250ms spring

12. UPLOAD ZONE:
    Border: 2px dashed #E5E7EB
    Padding: 48px
    Centro: ícono add_photo_alternate 32px + texto
    "Toca para subir tu comprobante"
    Inter 400, 15px, color #525B7A
    Subtexto: "JPG, PNG o PDF · máx. 10 MB"
    Inter 400, 12px, color #9CA3B8
    Hover: border-color #4AD0CE turquesa + background #4AD0CE10

OUTPUT: 12 estados/variantes apilados en una columna con label de cada uno a la izquierda.
```

---

# 🏷 PROMPT 8 — CHIPS DE ESTADO

```
[PEGAR TOKENS COMUNES]

Diseña los CHIPS DE ESTADO del sistema.

VIEWPORT: 1280 × 240

GRID: 3 filas × 3 columnas = 9 chips

SPECS BASE:
- Padding: 4px 10px
- Border-radius: 9999px
- Font: Inter 600, 11px
- Letter-spacing: 0.03em
- Estructura: ícono 14px + texto

CHIPS (cada uno con su color):

Fila 1:
- Pendiente:     bg #FEF3C7, text #92400E, icon "schedule"
- Aprobado:      bg #D1FAE5, text #065F46, icon "check_circle"
- Rechazado:     bg #FEE2E2, text #991B1B, icon "cancel"

Fila 2:
- Verificado:    bg #D1FAE5, text #065F46, icon "verified"
- Nuevo:         bg #D6F5F4, text #0F4D4C, icon "fiber_new"     (turquesa tinte)
- Publicado:     bg #D1FAE5, text #065F46, icon "published_with_changes"

Fila 3:
- Borrador:      bg #F3F4F6, text #4B5563, icon "edit_note"
- Convertido:    bg #EDE9FE, text #5B21B6, icon "church"        (violeta tinte)
- Reconciliado:  bg #E0E7FF, text #3730A3, icon "favorite"      (navy tinte)

ETIQUETA debajo de cada chip indicando dónde se usa:
- "Reporte de célula pendiente"
- "Pago verificado"
- "Comprobante rechazado"
- etc.

OUTPUT: grid 3×3 con label arriba "CHIPS DE ESTADO" + matriz limpia.
```

---

# 🪟 PROMPT 9 — MODAL / DIALOG

```
[PEGAR TOKENS COMUNES]

Diseña el MODAL/DIALOG del sistema.

VIEWPORT: 1440 × 900 (mostrar overlay + modal centrado)

ESPECIFICACIONES:

OVERLAY:
- Background: rgba(0, 0, 0, 0.5)
- Backdrop-filter: blur(4px)
- Cubre todo el viewport
- Click fuera del modal → cierra

CONTENEDOR MODAL:
- Background: #FFFFFF
- Border-radius: 20px
- Box-shadow: 0 25px 50px rgba(0,0,0,0.15)
- Max-width: 520px
- Centrado vertical y horizontal
- Animación entrada: opacity 0→1 + scale 0.95→1 + translateY(8px→0)
  Duración: 250ms ease-decelerate
- Animación salida: opacity 1→0 + scale 1→0.97
  Duración: 150ms ease-accelerate (más rápida que entrada — ley Apple)

ESTRUCTURA INTERNA:

1. HEADER (padding 24px):
   Izquierda: ícono contextual (Material Symbols, 24px, color navy)
     en círculo de 40×40 con background #E0E7FF (navy tinte)
   Centro: título "Confirmar registro"
     Inter 700, 20px, color #050505
   Derecha: botón X cerrar (24×24 circular, hover background #F4F6FB)

2. SEPARADOR: línea 1px #E5E7EB

3. CONTENIDO (padding 24px):
   Texto: "Estás a punto de registrarte para Noche de Adoración el Domingo 15 de junio a las 7pm en el Templo Central."
   Inter 400, 15px, color #525B7A
   Line-height: 1.6

   Debajo, info adicional en card #F4F6FB:
     - Fecha: Domingo 15 junio
     - Hora: 7:00 pm
     - Lugar: Templo Central

4. SEPARADOR: línea 1px #E5E7EB

5. FOOTER (padding 24px, flex justify-end gap 12px):
   Botón secundario "Cancelar" (outlined)
   Botón primario "Confirmar registro" (filled navy)

MOSTRAR 3 VARIANTES:

A. Modal estándar (descrito arriba)

B. Modal de confirmación destructiva:
   Ícono "warning" en círculo rojo (#FEE2E2 + #DC2626)
   Título: "¿Eliminar este reporte?"
   Texto: "Esta acción no se puede deshacer."
   Botón primario: "Eliminar" en rojo destructivo

C. Modal de éxito:
   Ícono "check_circle" en círculo verde (#D1FAE5 + #065F46)
   Título: "¡Registro confirmado!"
   Texto: "Te esperamos el domingo. Hemos enviado un correo de confirmación."
   Solo botón "Entendido"

OUTPUT: 3 modales lado a lado con sus overlays.
```

---

# 🪑 PROMPT 10 — SIDEBAR ADMIN

```
[PEGAR TOKENS COMUNES]

Diseña el SIDEBAR ADMIN/LÍDER de Casa del Rey.

VIEWPORT: 240 × 900 (ancho del sidebar)

ESPECIFICACIONES:
- Width: 240px fijo
- Height: 100vh
- Background: #060D24 (navy deep, NO el navy normal)
- Padding: 20px

ESTRUCTURA:

1. HEADER (top):
   Logo mapamundi blanco 28px + "Casa del Rey" Inter 700 16px blanco
   Debajo: "Panel Admin" Inter 500 11px tracking 0.15em uppercase
     color rgba(255,255,255,0.4)
   Padding-bottom 20px
   Border-bottom: 1px rgba(255,255,255,0.10)

2. NAVEGACIÓN (mid):
   Lista vertical de items con gap 4px
   Cada item:
     Padding: 10px 12px
     Border-radius: 12px
     Display: flex, align-items: center, gap 12px
     Ícono Material 18px
     Texto Inter 500 14px

   Estados:
   - Default:  color rgba(255,255,255,0.65), background transparente
   - Hover:    color white, background rgba(255,255,255,0.05)
   - Active:   color white, background rgba(74,208,206,0.15) turquesa tinte
               + border-left 3px #4AD0CE turquesa (en el borde izquierdo del item)
               + ícono cambia a Filled (fill 1)

   ITEMS A MOSTRAR:
   - Dashboard           (icon: dashboard)
   - Hero del sitio      (icon: view_carousel)
   - Usuarios            (icon: manage_accounts)
   - Blog                (icon: article)
   - Eventos             (icon: calendar_month)
   - Anuncios            (icon: campaign)
   - Peticiones          (icon: volunteer_activism) → con badge "3" rojo
   - Voluntarios         (icon: group_add)         → con badge "2"
   - Células             (icon: groups)            → con badge "1"
   - Nuevos              (icon: person_add)
   - Comprobantes        (icon: receipt_long)      → con badge "5"
   - Galería             (icon: photo_library)
   - Redes               (icon: share)
   - Actividad           (icon: history)

   Badges: min-width 20px, height 18px, border-radius 9999px
   background #EF4444 rojo, texto blanco Inter 700 10px

3. FOOTER (bottom):
   Border-top: 1px rgba(255,255,255,0.10)
   Padding-top 16px

   Info usuario:
     Avatar circular 32×32 (background #4AD0CE con iniciales)
     Nombre: "Pastor Roberto Méndez" Inter 600 13px blanco
     Email: "pastor@casadelrey.gt" Inter 400 11px rgba(255,255,255,0.5)

   Botón "Ver sitio web" (texto + icon public)
   Botón "Cerrar sesión" (texto + icon logout, hover color #EF4444)

ESTADO MOBILE:
- Sidebar oculto por defecto
- Topbar 56px con botón hamburger
- Drawer desliza desde la izquierda con backdrop oscuro

OUTPUT: sidebar desktop completo + topbar mobile.
```

---

# 🚪 PROMPT 11 — PÁGINA DE LOGIN

```
[PEGAR TOKENS COMUNES]

Diseña la PÁGINA DE LOGIN de Casa del Rey.

VIEWPORT: 1440 × 900

LAYOUT: Split 50/50 desktop, single column mobile

LADO IZQUIERDO (50% width, fondo navy deep #060D24):
- Padding: 80px

- Top: Logo mapamundi 56px blanco
       + "Casa del Rey" Inter 700 20px blanco
       + "Luz para las Naciones" Inter 400 13px tracking 0.1em uppercase
         color rgba(255,255,255,0.5)

- Centro: Cita bíblica grande
  "Porque yo sé los planes que tengo para vosotros, dice el Señor."
  Playfair Display Italic 32px, color blanco
  Line-height 1.4
  Max-width: 460px

  Debajo:
  "JEREMÍAS 29:11"
  JetBrains Mono 500, 11px, tracking 0.2em
  Color #4AD0CE turquesa

- Bottom: Foto del culto sutil al fondo con opacity 0.15 mix-blend-mode multiply
  (NO una decoración separada — está SOBRE todo este lado, como atmosfera)

LADO DERECHO (50% width, fondo #FAFAF8 cream):
- Padding: 80px
- Contenido centrado vertical, max-width 400px

- "Bienvenido de vuelta."
  Inter 700, 36px, letter-spacing -0.02em, color #050505

- "Ingresa con tus credenciales."
  Inter 400, 16px, color #525B7A
  Margin-top 8px, margin-bottom 40px

- Formulario:
  - Input "Correo electrónico"
    Label arriba Inter 600 14px color #525B7A
    Input estándar con focus turquesa

  - Input "Contraseña" con toggle show/hide
    Trailing icon "visibility" 18px clickeable

  - Link "¿Olvidaste tu contraseña?"
    Alineado a la derecha debajo del input password
    Inter 500 14px, color #0D1B4B navy, hover underline

  - Botón "Ingresar"
    Full width, height 52px
    Background #0D1B4B navy
    Texto blanco Inter 600 17px
    Border-radius 9999px
    Hover: scale 1.01, background #091237

- Footer del lado derecho:
  Línea horizontal sutil #E5E7EB
  Debajo: "¿No tienes cuenta?" en gris + "Solicita acceso →" en navy

VARIANTE MOBILE (375×812):
- Solo el lado derecho (form)
- Logo + cita pasan a arriba del formulario en miniatura
- Padding lateral 24px

OUTPUT: desktop 1440×900 con split + mobile 375×812.
```

---

# 🦴 PROMPT 12 — EMPTY STATES + LOADING

```
[PEGAR TOKENS COMUNES]

Diseña los ESTADOS VACÍOS Y DE CARGA.

VIEWPORT: 1280 × 800 (mostrar 6 variantes en grid 3×2)

PRINCIPIO: minimalista Apple — sin ilustraciones, solo tipografía + ícono.

VARIANTE 1 — Empty state principal:
- Ícono Material 48px en color #9CA3B8 (outline solamente, fill 0)
- Título: "Aún no hay reportes"
  Inter 700, 18px, color #050505
- Subtítulo: "Cuando un líder envíe su primer reporte aparecerá aquí."
  Inter 400, 14px, color #525B7A, max-width 320px
- Botón opcional: "Crear primer reporte" en outlined navy
- Centrado dentro del contenedor

VARIANTE 2 — Empty con CTA:
- Ícono "calendar_month" 48px
- "No hay eventos próximos"
- "Crea tu primer evento para que aparezca en el sitio."
- Botón filled navy "Crear evento"

VARIANTE 3 — Error de conexión:
- Ícono "cloud_off" 48px en color #525B7A
- "No pudimos conectar"
- "Verifica tu conexión a internet e intenta de nuevo."
- Botón outlined "Reintentar"

VARIANTE 4 — Spinner pequeño (loading inline):
- Círculo de 24px, border 2px
- Arco superior en #0D1B4B navy
- Animación rotate 360deg, 0.6s linear infinite
- Label opcional al lado: "Cargando..." Inter 400 13px color #525B7A

VARIANTE 5 — Spinner grande (full page loading):
- Círculo de 40px centrado en la pantalla
- Sin texto adicional
- Background #FAFAF8 cream sutil

VARIANTE 6 — Skeleton loader (3 filas):
- Rectángulos con border-radius 8px
- Background gradient animado:
  linear-gradient(90deg, #F4F6FB 0%, #E5E7EB 50%, #F4F6FB 100%)
  background-size: 200% 100%
  animation: shimmer 1.5s ease-in-out infinite

- Estructura típica de card:
  Rectángulo 48×48 circular (avatar)
  Rectángulo 200×16 (título)
  Rectángulo 320×12 (subtitle)

OUTPUT: grid 3×2 con label de cada variante. Cada uno en su propio contenedor.
```

---

# 🎯 ORDEN DE EJECUCIÓN RECOMENDADO

```
SEMANA 1 (alto impacto, lo que ve un visitante nuevo):
  Día 1: Prompt 1 (Hero Home) + Prompt 2 (Nav)
  Día 2: Prompt 3 (Footer) + Prompt 4 (Card Evento)
  Día 3: Prompt 5 (Card Blog) + Prompt 6 (Botones)

SEMANA 2 (componentes de UI funcional):
  Día 4: Prompt 7 (Inputs) + Prompt 8 (Chips)
  Día 5: Prompt 9 (Modal) + Prompt 12 (Empty/Loading)
  Día 6: Prompt 11 (Login)

SEMANA 3 (paneles internos):
  Día 7: Prompt 10 (Sidebar Admin)
```

---

# 💡 TIPS PARA NO QUEMAR TOKENS

1. **Un componente por sesión** — no metas dos prompts en una sola conversación
2. **Sonnet 4.6 Normal** — High solo para Hero (Prompt 1)
3. **Si Pencil se desvía**, dale corrección quirúrgica: "El botón está mal — debe ser exactamente como apple.com/la /iphone, padding 12px 24px, NO más"
4. **Cuando Pencil termine cada uno**, mándame screenshot y yo lo traduzco a código React
5. **No regeneres** — ajusta lo que ya hizo si algo no encaja
