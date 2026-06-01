# Design Logic — Casa del Rey
> Qué hace cada pantalla, qué muestra, qué acciones tiene.
> Sin colores ni tipografía — eso se define aparte.

---

## Índice

- [Layouts](#layouts)
- [Sitio Público](#sitio-público)
- [Panel Admin](#panel-admin)
- [Panel Líder](#panel-líder)
- [Panel Voluntario](#panel-voluntario-nuevo)
- [Componentes reutilizables](#componentes-reutilizables)
- [Flujos clave](#flujos-clave)

---

## Layouts

### Layout Público
```
[Header sticky]
  Logo | Nav: Inicio · Nosotros · Blog · Eventos · Galería · Voluntarios · Donar | Botón "Ingresar"
  
[Contenido de la página — scroll]

[Footer]
  Logo + descripción breve | Links rápidos | Redes sociales | Copyright
```
- Header se vuelve sólido con sombra al hacer scroll
- En móvil: el nav colapsa a un menú hamburguesa → drawer lateral

---

### Layout Admin
```
[Sidebar fijo 240px]
  Logo + "Panel Admin"
  ─────────────────
  Nav items con íconos y badges de notificación
  ─────────────────
  Nombre del usuario
  "Ver sitio web"
  "Cerrar sesión"

[Contenido — scroll vertical]
  [Topbar solo en móvil: botón hamburguesa + título]
  [Página activa]
```
- En móvil: sidebar oculto, se abre como drawer con overlay oscuro

---

### Layout Líder
Idéntico al Admin, pero el sidebar tiene menos ítems:
`Inicio · Células · Nuevos · Voluntarios · Directorio · Perfil`

---

### Layout Voluntario *(nuevo)*
```
[Topbar]
  Logo | → espacio → | Nombre + rol "Voluntario" | Botón "Salir"

[Contenido centrado — max-width 640px]
```
- Sin sidebar
- Topbar sticky

---

## Sitio Público

### Home `/`

| Sección | Qué contiene | Acciones |
|---|---|---|
| Hero | Título grande, subtítulo, 2 CTAs | "Conoce más" → scroll / "Únete" → /volunteering |
| Próximos eventos | Cards con fecha, título, lugar (máx 3) | Botón RSVP por evento |
| Blog reciente | Cards con imagen, título, extracto (máx 3) | "Leer" → /blog/:slug · Si tiene red social → abre link externo |
| CTA Donaciones | Texto + botón | → /donate |
| CTA Voluntarios | Texto + botón | → /volunteering |
| Feed social | Posts de Instagram/Facebook | Abre red social en nueva pestaña |

---

### Nosotros `/about`

| Sección | Qué contiene |
|---|---|
| Hero de página | Imagen de fondo + título "Nosotros" |
| Historia | Texto largo de la iglesia |
| Visión y Misión | 2 columnas de texto |
| Liderazgo | Cards: foto, nombre, cargo del pastor/líderes principales |
| CTA | "Visítanos este domingo" o similar |

---

### Blog — Lista `/blog`

- Grid de cards (3 col desktop · 2 tablet · 1 móvil)
- Cada card: imagen de portada · título · extracto · fecha
- Si el post tiene `redirect_url`: la card abre directamente la red social (no va al detalle)
- Si no tiene `redirect_url`: va a `/blog/:slug`

---

### Blog — Detalle `/blog/:slug`

**Estructura de la página:**
```
← Volver al Blog

[Imagen de portada]

Fecha de publicación
Título del post

[SI TIENE redirect_url]
  Banner: "Ver en [Instagram/Facebook/YouTube]" → abre link en nueva pestaña

[Reproductor TTS — escuchar el post en voz alta]

[Contenido enriquecido del post — HTML con estilos de prosa]
```

**El banner de red social** detecta la plataforma por la URL y muestra el nombre correcto:
- instagram.com → "Ver en Instagram"
- facebook.com → "Ver en Facebook"
- youtube.com / youtu.be → "Ver en YouTube"
- tiktok.com → "Ver en TikTok"
- Cualquier otro → "Ver publicación"

---

### Eventos `/events`

- Calendario mensual + lista de próximos eventos
- Filtro: Próximos / Pasados
- Card de evento: título · fecha · hora · lugar · descripción corta · botón "Registrarme"
- Click en "Registrarme" → Modal de RSVP

**Modal RSVP:**
```
Título del evento
───────────────
Nombre completo *
Correo electrónico *
Teléfono
Cantidad de asistentes (número, mín 1)
Notas / observaciones

[Botón: Confirmar registro]
```
- Sin login requerido (anónimo o autenticado)
- Post-envío: mensaje de confirmación en el modal

---

### Galería `/gallery`

- Grid de fotos (masonry o uniforme)
- Filtro por evento (dropdown)
- Click en foto → modal lightbox con imagen grande + título + descripción

---

### Oración `/prayer` *(restringido)*

**Acceso:** Solo usuarios con rol `leader` o `admin`.
- Si no está autenticado → redirige a `/login`
- Si está autenticado pero sin el rol → pantalla de acceso denegado con mensaje claro

**Vista para roles permitidos:**
```
[Hero de página]
  Ícono · Título "Peticiones de Oración" · Cita bíblica

[Formulario]
  Nombre *
  Correo electrónico
  Teléfono
  Categoría (personal / familia / salud / ministerio / otro)
  Asunto *
  Mensaje de oración *
  [Botón: Enviar petición]

[Post-envío: mensaje de confirmación]
```

---

### Voluntariado `/volunteering`

**Lista de 10 departamentos** (clickeables — selecciona el depto en el formulario de abajo):

| # | Departamento | Descripción breve |
|---|---|---|
| 1 | Alabanza | Música y adoración en servicios |
| 2 | Danza | Adoración a través del movimiento |
| 3 | Servidores | Recepción, atención, limpieza |
| 4 | Protocolo | Atención VIP a invitados especiales |
| 5 | Pancartas | Coordinar pancartas en días de culto |
| 6 | Maestros de Niños | Enseñanza a niños en cultos |
| 7 | Técnicos Audiovisuales | Sonido, video, streaming |
| 8 | Multimedia | Diseño, redes sociales, contenido |
| 9 | Oración | Intercesión y cobertura espiritual |
| 10 | Logística | Organización de eventos y recursos |

**Formulario de inscripción** (al fondo de la página):
```
Nombre completo *
Correo electrónico *
Teléfono
Departamento de interés (select — pre-cargado si se clickeó un depto)
Mensaje / motivación (textarea)
[Botón: Enviar inscripción]
```
- Sin login requerido
- Post-envío: mensaje de confirmación

---

### Donaciones `/donate`

```
[Descripción del propósito de las donaciones]

Métodos disponibles:
  - Transferencia bancaria → muestra datos de cuenta del banco
  - Tigo Money → muestra número
  - Presencial → instrucciones de dónde y cuándo

[Formulario de registro de donación]
  Nombre completo *
  Correo electrónico *
  Monto (número) *
  Moneda (GTQ por defecto)
  Método de pago (select: Transferencia / Tigo Money / Presencial)
  Número de referencia / comprobante
  Subir foto del comprobante (imagen)
  Propósito (Diezmo / Ofrenda / Misiones / Otro)
  [Botón: Registrar donación]

[Post-envío: "Tu donación fue registrada y será verificada por el equipo"]
```

---

### Login `/login`

```
[Panel izquierdo decorativo — solo desktop]
  Logo + nombre de la iglesia

[Panel derecho — formulario]
  Logo (solo móvil)
  "Bienvenido de vuelta"
  
  Correo electrónico *
  Contraseña * [toggle ver/ocultar]
  Link: "¿Olvidaste tu contraseña?"
  
  [Botón: Ingresar — full width]
```

**Redirección post-login según rol:**
- `admin` → `/admin`
- `leader` → `/leader`
- `volunteer` → `/volunteer/dashboard`
- `member` → `/profile`

---

### Recuperar contraseña `/forgot-password`

```
"Recuperar contraseña"
Correo electrónico *
[Botón: Enviar instrucciones]
[Post-envío: "Revisa tu correo, te enviamos un enlace"]
```

### Restablecer contraseña `/reset-password/:token`

```
Nueva contraseña *
Confirmar contraseña *
[Botón: Guardar nueva contraseña]
```

---

### Perfil `/profile` *(requiere login)*

```
[Datos del usuario]
  Nombre · Correo · Rol · Código célula

[Mis metas]
  Lista de metas con:
    - Título
    - Descripción
    - Fecha límite
    - Toggle: Completada / Pendiente
    - Botón eliminar
  [Botón: Nueva meta]

[Modal / inline form de nueva meta]
  Título *
  Descripción
  Fecha límite
  [Guardar] [Cancelar]
```

---

### Verificar Email `/verify-email`

```
Ícono grande (check o error)
Mensaje de éxito: "Tu correo fue verificado"
  o mensaje de error si el token expiró
[Botón: Ir al inicio]
```

---

## Panel Admin

> Acceso: rol `admin`

### Navegación del sidebar

| Ítem | Badge |
|---|---|
| Dashboard | — |
| Usuarios | — |
| Blog | — |
| Eventos | — |
| Anuncios | — |
| Peticiones | Número de peticiones sin responder |
| Voluntarios | Número de solicitudes pendientes |
| Células | Número de reportes por aprobar |
| Nuevos | — |
| Galería | — |
| Redes | — |
| Actividad | — |
| Perfil | — |

---

### Dashboard `/admin`

```
[Fila de KPIs — 4 tarjetas]
  Total miembros | Nuevos este mes | Donaciones del mes (Q) | Voluntarios activos

[Fila de gráficas]
  Izquierda: gráfica de línea — crecimiento de miembros por mes
  Derecha: gráfica de dona — distribución por tipo de célula (H/M/J/P/N)

[Fila inferior]
  Izquierda: últimos 5 reportes de células (código, líder, fecha, estado como chip)
  Derecha: últimas 5 donaciones (nombre, monto, método, fecha)
```

---

### Usuarios `/admin/users`

**Barra superior:**
```
Buscador por nombre o email | Filtro por rol (dropdown) | [Botón: Nuevo usuario]
```

**Tabla:**

| Columna | Descripción |
|---|---|
| Nombre | — |
| Email | — |
| Rol | Chip de color según rol |
| Código célula | Ej. H1, M2 |
| Tipo célula | Chip: Hombres / Mujeres / Jóvenes / Prejus / Niños |
| Fecha de registro | — |
| Acciones | Cambiar rol · Editar |

**Modal Nuevo/Editar usuario:**
```
Nombre completo *
Correo electrónico *
Contraseña * (solo en creación)
Rol (select: admin / leader / volunteer / member)

[Sección visible si rol = leader]
  Tipo de célula (select: Hombres / Mujeres / Jóvenes / Prejuveniles / Niños)
  Número de célula (número 1, 2, 3…)
  → Preview del código resultante: "H2", "M1", "J3"...

[Guardar] [Cancelar]
```

---

### Blog `/admin/blog`

**Tabla:**

| Columna | Descripción |
|---|---|
| Miniatura | Imagen de portada pequeña |
| Título | — |
| Estado | Chip: Borrador / Publicado |
| Autor | — |
| Red social | Chip "Instagram" / "Facebook" / etc. si tiene redirect_url |
| Fecha | — |
| Acciones | Editar · Eliminar |

**Modal/Página de creación y edición:**
```
Título *
Slug (auto-generado desde título, editable)
Imagen de portada (subir)
Extracto (texto breve para el listado)

[Editor de contenido enriquecido]
  Herramientas: negrita · cursiva · links · listas · imágenes · citas · encabezados

[Sección: Link a red social]
  Plataforma (select: Ninguna / Instagram / Facebook / YouTube / TikTok)
  URL de la publicación (input, visible si plataforma ≠ Ninguna)
  → Nota: si se llena este campo, la card del blog redirige directo a la red social

Estado (radio: Borrador / Publicado)

[Guardar borrador] [Publicar]
```

---

### Eventos `/admin/events`

**Tabla:**

| Columna | Descripción |
|---|---|
| Título | — |
| Fecha | — |
| Lugar | — |
| Estado | Chip: Activo / Inactivo |
| RSVPs | Número de registrados |
| Acciones | Ver RSVPs · Editar · Eliminar |

**Modal crear/editar evento:**
```
Título *
Fecha * (date)
Hora (time)
Lugar *
Descripción (textarea)
Toggle: Evento activo
[Guardar] [Cancelar]
```

**Panel de RSVPs** (botón por evento → tabla expandible o modal):
```
Tabla: Nombre | Email | Teléfono | Asistentes | Notas | Fecha de registro
```

---

### Anuncios `/admin/announcements`

**Tabla:**

| Columna | Descripción |
|---|---|
| Título | — |
| Dirigido a | Chip: Todos / Miembros / Líderes / Admins |
| Activo | Toggle inline |
| Fecha | — |
| Acciones | Editar · Eliminar |

**Modal crear/editar:**
```
Título *
Contenido * (textarea enriquecida)
Dirigido a (select: Todos / Solo miembros / Solo líderes / Solo admins)
Toggle: Activo
[Guardar] [Cancelar]
```

---

### Peticiones de Oración `/admin/petitions`

**Header de página:**
```
Ícono + "Peticiones" + contador "X sin responder"    |    [Botón: PDF semanal]
```

**El botón "PDF semanal":**
- Llama al backend para obtener las peticiones de la semana en curso (lunes–domingo)
- Abre una nueva pestaña con una vista imprimible (una petición por hoja)
- El usuario imprime o guarda como PDF desde el navegador
- Cada hoja del PDF contiene: nombre · correo · teléfono · categoría · asunto · mensaje · fecha

**Lista de peticiones:**
```
Por cada petición:
  [Ícono de estado] Nombre · Asunto · Chip "Nueva" (si no está respondida)
  Correo
  Mensaje completo (en caja resaltada)
  Fecha de recepción
  [Botón: Marcar como respondida] (solo si está pendiente)
```

---

### Voluntarios `/admin/volunteers`

**Filtros:**
```
Departamento (select) | Estado (select) | Buscador por nombre
```

**Tabla:**

| Columna | Descripción |
|---|---|
| Nombre | — |
| Email | — |
| Teléfono | — |
| Departamento | Chip con nombre del depto |
| Estado | Chip: Pendiente / Asignado / Coordinando / Usuario creado |
| Líder asignado | Nombre del líder (si tiene) |
| Fecha | — |
| Acciones | Ver detalles · Asignar líder · Crear cuenta |

**Modal "Asignar líder":**
```
Seleccionar líder (dropdown con lista de líderes)
[Asignar] [Cancelar]
```

**Modal "Crear cuenta de usuario":**
```
"Se creará una cuenta de voluntario para [nombre] ([email])"
Contraseña inicial *
[Crear cuenta y enviar correo de verificación] [Cancelar]
```

---

### Células `/admin/cell-reports`

> Sin botón de exportar CSV.

**Filtros:**
```
Tipo de célula | Estado | Líder | Rango de fechas
```

**Stats de resumen (siempre visibles):**
```
Total reportes | Total asistentes | Convertidos | Reconciliados | Ofrenda total
```

**Lista de reportes** (acordeón — click expande el detalle):

*Vista colapsada:*
```
[Código célula] Nombre de célula  [Chip estado]
Líder · Fecha · X asistentes · X nuevos
```

*Vista expandida:*
```
[Foto de la reunión — imagen grande]

Grid de números:
  Asistentes | Convertidos | Reconciliados | Ofrenda

Detalles:
  Pastor | Tema | Anfitrión + teléfono | Dirección

Notas (si las hay)

[Solo si status = pendiente y rol = admin]
  [Botón: Aprobar] [Botón: Rechazar]
```

---

### Nuevos Miembros (Boletas) `/admin/boletas`

> Sin botón de exportar CSV.

**Filtros por categoría:**
```
[Chip: Todas] [Chip: Convertidos X] [Chip: Reconciliados X] [Chip: Nuevos X]
```

**Botón:** "Nueva boleta" → formulario inline

**Formulario de nueva boleta:**
```
Fecha * | Categoría * (chips: Convertido / Reconciliado / Nuevo)
──────────────────────────────
Quien invitó:
  Nombre | Teléfono
──────────────────────────────
Invitado:
  Nombre * | Teléfono
  Dirección
──────────────────────────────
Notas
[Guardar boleta] [Cancelar]
```

**Lista de boletas:**
```
Por cada boleta:
  [Ícono de categoría] Nombre del invitado  [Chip categoría]
  Teléfono · Dirección
  Invitado por: [Nombre invitador] · [teléfono]
  Notas (si las hay)
  Fecha  [Botón eliminar — solo admin]
```

---

### Galería `/admin/gallery`

- Grid de miniaturas con overlay de acciones (Editar / Eliminar) al hover
- Botón "Subir foto" → Modal

**Modal subir/editar foto:**
```
Zona de drag & drop para imagen (o click para seleccionar)
Título
Descripción
Evento asociado (dropdown — opcional)
[Guardar] [Cancelar]
```

---

### Redes Sociales `/admin/social`

Lista de posts activos:
```
[Chip plataforma] Imagen miniatura · Caption · Orden de aparición | Activo toggle | Editar · Eliminar
```

**Modal crear/editar:**
```
Plataforma * (select: Facebook / Instagram)
URL de la publicación *
Caption / descripción
URL de imagen
Orden de aparición (número)
Toggle: Activo
[Guardar] [Cancelar]
```

---

### Registro de Actividad `/admin/activity-log`

Solo lectura. Sin acciones.

**Filtros:**
```
Usuario | Tipo de acción | Recurso | Rango de fechas
```

**Tabla:**

| Columna | Descripción |
|---|---|
| Fecha y hora | — |
| Usuario | Nombre |
| Acción | Chip: crear / actualizar / eliminar / aprobar |
| Recurso | Ej: "célula", "boleta", "usuario" |
| ID | ID del recurso afectado |
| IP | Dirección IP |
| Detalles | Texto breve |

---

## Panel Líder

> Acceso: rol `leader`

### Inicio del Líder `/leader`

```
[Fila de KPIs — 3 o 4 tarjetas]
  Total asistentes este mes | Nuevos este mes | Ofrenda acumulada del mes | Voluntarios asignados

[Lista de últimos 5 reportes propios]
  Código · Nombre · Fecha · Estado (chip)
  [Botón: Nuevo reporte]
```

---

### Células del Líder `/leader/reports`

Misma estructura visual que `/admin/cell-reports` pero:
- **Solo muestra sus propios reportes**
- No tiene botón de aprobar/rechazar (solo ve el estado)
- Siempre tiene visible el botón "Nuevo reporte"

**Formulario completo de nuevo reporte:**
```
[Zona de foto — arrastra o selecciona imagen]

Identificación:
  Tipo de célula (select: Hombres / Mujeres / Jóvenes / Prejuveniles / Niños)
  Número de célula → genera código automático (H1, M2…)
  Nombre de la célula
  Fecha de la reunión *

Responsables:
  Líder (pre-cargado con el nombre del usuario, no editable)
  Pastor asignado

Anfitrión:
  Nombre del anfitrión
  Teléfono del anfitrión
  Dirección de la reunión

Tema:
  Tema de la reunión

Números:
  Total asistentes | Convertidos | Reconciliados | Ofrenda (Q)
  [Auto-calculado] Nuevos = Convertidos + Reconciliados

Notas adicionales

[Botón: Enviar reporte]
```

**Post-envío:** mensaje de confirmación "Reporte enviado, pendiente de aprobación."

---

### Nuevos del Líder `/leader/boletas`

- Igual que `/admin/boletas` pero solo ve boletas que él creó
- El formulario es idéntico
- Sin botón eliminar (eso es solo admin)

---

### Voluntarios del Líder `/leader/volunteers`

- Solo ve voluntarios asignados a él
- Tabla: Nombre · Departamento · Estado · Teléfono · Acciones (ver detalle)

---

### Directorio de Miembros `/leader/cell-directory`

```
[Buscador por nombre o código]

Lista de miembros:
  Por cada miembro:
    Nombre | Email | Teléfono | Código célula | Tipo célula | Dirección | Rol
```

La **dirección** es visible aquí para que el líder pueda ubicar a nuevos miembros.

---

## Panel Voluntario *(nuevo)*

> Acceso: rol `volunteer`
> Layout: topbar simplificado, sin sidebar

### Dashboard del Voluntario `/volunteer/dashboard`

```
[Banner de bienvenida]
  "Bienvenido, [nombre]"
  Departamento asignado (si tiene registro de voluntario)
  Descripción del departamento

[Stats rápidas — 2 tarjetas]
  Metas pendientes | Metas completadas

[Sección: Mis metas]
  [Botón: Nueva meta]
  
  Lista de metas:
    Cada meta:
      ○ / ✓  Título de la meta
              Descripción
              Fecha límite
              [Botón: eliminar]
  
  Orden: pendientes primero, completadas al fondo (con tachado)
  
  Empty state si no hay metas:
    Ícono + texto + botón "Crear tu primera meta"

[Inline form de nueva meta]
  Título * | Descripción | Fecha límite
  [Guardar] [Cancelar]
```

**Lógica del departamento:**
- El dashboard llama a `/volunteer/me` → retorna el registro de voluntario por email
- Si el voluntario no tiene registro aún → el banner de bienvenida no muestra departamento, solo el nombre
- Si tiene registro → muestra el departamento y su descripción

---

## Componentes reutilizables

### Chip / Badge
Usado para mostrar estados y categorías.

Estados que aparecen en el sistema:

| Estado | Dónde |
|---|---|
| Pendiente | Reportes célula, voluntarios, peticiones |
| Aprobado | Reportes célula |
| Rechazado | Reportes célula |
| Asignado | Voluntarios |
| Coordinando | Voluntarios |
| Usuario creado | Voluntarios |
| Borrador | Posts de blog |
| Publicado | Posts de blog |
| Nueva | Peticiones |
| Respondida | Peticiones |
| Convertido | Boletas |
| Reconciliado | Boletas |
| Nuevo | Boletas |
| admin / leader / volunteer / member | Usuarios |

---

### Tabla
- Header fijo con nombres de columna
- Cada fila tiene zona de acciones al final (editar, eliminar, ver)
- En móvil colapsa a cards apiladas
- Paginación debajo

---

### Modal
Estructura fija:
```
[X para cerrar — esquina superior derecha]
Título del modal
Subtítulo opcional
─────────────────
Contenido (formulario o información)
─────────────────
Acciones: [Botón secundario] [Botón primario]
```

---

### Formulario de célula (Componente compartido)
Usado en `/leader/reports` y en `/admin/cell-reports`.
El formulario tiene exactamente las mismas secciones en ambos lados.
La diferencia es que en el lado del líder el campo "Líder" viene pre-cargado y bloqueado.

---

### Selector de código de célula (Componente nuevo)
Usado en: creación de usuario admin, formulario de reporte.
```
Tipo: [select: Hombres / Mujeres / Jóvenes / Prejuveniles / Niños]
Número: [input numérico]
Vista previa: "H2"
```
Los prefijos:
- Hombres → H
- Mujeres → M
- Jóvenes → J
- Prejuveniles → P
- Niños → N

---

### Empty State
Cuando una lista no tiene datos:
```
[Ícono grande contextual]
"No hay [nombre del recurso] aún"
Texto de guía: "Crea el primero con el botón de arriba"
[Botón de acción — opcional]
```

---

### Paginación
```
← Anterior  [1] [2] [3] … [N]  Siguiente →
"Mostrando X–Y de Z resultados"
```

---

## Flujos clave

### Login → Redirección por rol
```
/login → POST /auth/login
  rol admin     → /admin
  rol leader    → /leader
  rol volunteer → /volunteer/dashboard
  rol member    → /profile
  no autenticado que intenta acceder a ruta protegida → /login (con redirect de vuelta)
```

---

### Nuevo reporte de célula
```
Líder entra a /leader/reports
→ Clic "Nuevo reporte"
→ Llena formulario completo (foto + todos los campos)
→ Submit → estado: "pendiente"
→ Admin ve badge +1 en sidebar "Células"
→ Admin aprueba o rechaza
→ Líder ve el estado actualizado en su lista
```

---

### Nuevo voluntario → cuenta de usuario
```
Visitante en /volunteering
→ Selecciona departamento + llena formulario
→ Submit → estado: "pendiente"
→ Admin/líder ve badge +1 en "Voluntarios"
→ Admin asigna a un líder → estado: "asignado"
→ Admin/líder crea cuenta de usuario → estado: "usuario creado"
→ Voluntario recibe correo de verificación
→ Verifica correo → puede hacer login
→ Login → redirige a /volunteer/dashboard
```

---

### PDF semanal de oraciones
```
Admin en /admin/petitions
→ Clic "PDF semanal"
→ GET /admin/petitions/weekly (retorna peticiones del lunes al domingo actual)
→ Abre nueva pestaña con vista imprimible:
    Una hoja por petición con todos los datos
→ Admin imprime o guarda como PDF
→ Distribuye a los 8 intercessores
```

---

### Blog con link a red social
```
Admin crea post con redirect_url (URL de Instagram, Facebook, etc.)
→ En el listado público: la card redirige directamente a la red social
→ En el detalle del post (/blog/:slug):
    Se muestra un banner "Ver en [plataforma]" que abre la red social
    Debajo sigue el contenido del post (para quienes lo leen en el sitio)
```

---

## Pantallas nuevas a diseñar (resumen)

| Pantalla | Ruta | Estado |
|---|---|---|
| Dashboard Voluntario | `/volunteer/dashboard` | Nueva |
| Layout Voluntario (topbar) | — | Nuevo |
| Selector de código célula | — | Nuevo componente |
| Banner de red social en post | `/blog/:slug` | Modificación |
| Botón PDF semanal en peticiones | `/admin/petitions` | Modificación |
| Oración restringida a líderes/admins | `/prayer` | Cambio de acceso |
| Formulario completo de célula con foto arriba | — | Verificar vs. actual |

---

*Documento generado el 24 mayo 2026 — Casa del Rey*
