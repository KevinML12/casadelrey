# Documento maestro: Manual de Usuario y Estado del Proyecto — Casa del Rey Web

**Importante:** Este documento describe el estado **actual** del proyecto tal como está implementado y subido al repositorio de GitHub. Refleja exactamente lo que existe en el código en marzo de 2025.

---

## INSTRUCCIONES PARA GENERACIÓN DE DOCUMENTO .DOCX

**Objetivo:** Utilizar este archivo Markdown como fuente para generar un documento Word (.docx) profesional y detallado.

**Instrucciones para el LLM:**
1. Lee todo el contenido de este archivo.
2. Genera un documento .docx con la siguiente estructura:
   - Portada con título "Manual de Usuario y Estado del Proyecto — Iglesia Casa del Rey"
   - Índice automático
   - Todas las secciones numeradas y formateadas para documento formal
   - Tablas bien formateadas
   - Listas con viñetas y numeración donde corresponda
   - Encabezados jerárquicos (Título 1, Título 2, Título 3)
   - Fecha de generación en pie de página
3. Mantén todo el contenido técnico y las credenciales exactamente como están.
4. Añade una sección final "Resumen ejecutivo" de 1 página que sintetice: qué está hecho, qué falta, y recomendaciones para la entrega.
5. El tono debe ser profesional, claro y apto para presentar a un cliente (iglesia).

---

# PARTE I: INFORMACIÓN GENERAL DEL PROYECTO

## 1. Datos del proyecto

| Campo | Valor |
|-------|-------|
| **Cliente** | Iglesia Casa del Rey — Huehuetenango, Guatemala |
| **Sitio web** | [INSERTAR_ENLACE_VERCEL] (ej: https://casadelreyhue.vercel.app) |
| **Versión del manual** | Marzo 2025 |
| **Stack técnico** | Frontend: React 19 + Vite + Tailwind. Backend: Go + Echo. Base de datos: PostgreSQL/SQLite. Hosting: Vercel (frontend), Fly.io o similar (backend). El frontend consume la API del backend; debe configurarse `VITE_API_URL` apuntando al backend en producción. |

## 2. Estado actual del proyecto

### 2.1 Funcionalidades implementadas (completas)

- **Sitio público:** Página inicial, Conócenos, Blog, Eventos, Oración (peticiones), Voluntariado, Donaciones (Stripe + PayPal).
- **Autenticación:** Login, verificación de correo, recuperación de contraseña. Registro público desactivado (solo admin/líderes crean usuarios).
- **Panel Admin:** Dashboard con KPIs, Blog (CRUD con editor rich text e imágenes), Eventos (CRUD), Peticiones de oración, Voluntarios (asignar a líderes, crear usuarios), Reportes de células (import CSV, entrada manual, bulk), Redes sociales (Facebook/Instagram para feed), Perfil con metas.
- **Panel Líder:** Inicio, Células (reportes asignados), Voluntarios (asignados, crear usuario), Perfil.
- **Perfil (todos los roles):** Metas personales (crear, marcar completadas, eliminar).
- **Donaciones:** Stripe y PayPal integrados.
- **Voluntariado:** Inscripción pública → Admin asigna a líder → Líder crea usuario cuando esté coordinado.
- **Redes sociales:** Enlaces directos a Facebook, Instagram, X (Twitter), TikTok. Feed embebido de publicaciones FB/IG.
- **Contacto:** Dirección completa, teléfono, email, WhatsApp en Footer y Conócenos.

### 2.2 Funcionalidades pendientes o parciales

- **Multimedia:** No hay transmisiones en vivo ni galería de videos/audios por ministerio (según propuesta original).
- **WhatsApp:** No hay integración de notificaciones por WhatsApp (solo enlace de contacto).
- **Chat en vivo:** No implementado.
- **Recursos descargables:** No hay sección de predicas/estudios bíblicos descargables.
- **Contenido:** Historia, Misión/Visión/Valores, Declaración de Fe están como "Próximamente" (estructura lista, contenido por completar por la iglesia).

### 2.3 Comparativa con propuesta original (Mayo 2025)

| Ítem de la propuesta | Estado |
|----------------------|--------|
| Página inicial | ✅ Implementado |
| Historia y Declaración de Fe | ⚠️ Estructura lista, contenido pendiente |
| Noticias y Eventos | ✅ Blog + Eventos |
| Multimedia (transmisiones, videos) | ❌ No implementado |
| Contacto (formulario, mapa) | ✅ Formulario oración, ubicación, teléfono, WhatsApp |
| Donaciones en línea | ✅ Stripe + PayPal |
| Espacio nuevos miembros | ✅ Voluntariado + creación por admin/líder |
| Área miembros con privilegios | ✅ Admin, líder, miembro |
| Reportes y estadísticas | ✅ Células, KPIs |
| Panel administración | ✅ Completo |
| Voluntariado e inscripciones | ✅ Implementado |
| WhatsApp/Correos | ⚠️ Correos sí, WhatsApp no |
| Chat en vivo | ❌ No implementado |
| Recursos descargables | ❌ No implementado |
| Seguridad (SSL, autenticación, permisos) | ✅ Implementado |

---

# PARTE II: MANUAL DE USUARIO DETALLADO

## 3. Acceso e inicio de sesión

### 3.1 Usuarios de prueba

| Rol | Nombre | Correo electrónico | Contraseña |
|-----|--------|--------------------|------------|
| **Administrador** | Administrador | admin@casadelrey.org | Admin123! |
| **Líder** | María Líder | lider1@casadelrey.org | Lider123! |
| **Líder** | Juan Coordinador | lider2@casadelrey.org | Lider123! |
| **Miembro** | Pedro Miembro | usuario@casadelrey.org | Usuario123! |
| **Miembro** | Ana García | ana@casadelrey.org | Usuario123! |
| **Miembro** | Carlos López | carlos@casadelrey.org | Usuario123! |

**Nota:** Los usuarios de prueba deben estar cargados en la base de datos (seed). Si no existen, ejecutar el script de seed del backend. Todos tienen el correo verificado y pueden iniciar sesión de inmediato.

### 3.2 Pasos para iniciar sesión

1. Abrir el navegador y acceder a la URL del sitio.
2. En la esquina superior derecha, hacer clic en **Iniciar sesión** (o ir al menú si está en móvil).
3. Ingresar el **correo electrónico** y la **contraseña** de la tabla anterior.
4. Hacer clic en **Iniciar sesión**.
5. Si el correo no está verificado (usuarios nuevos creados por admin/líder), el sistema pedirá verificar el correo mediante el enlace enviado por email.

### 3.3 Recuperación de contraseña

1. En la pantalla de login, hacer clic en **¿Olvidaste tu contraseña?**
2. Ingresar el correo electrónico registrado.
3. Revisar el correo y hacer clic en el enlace de restablecimiento.
4. Definir la nueva contraseña (mínimo 6 caracteres).

---

## 4. Panel de Administrador

**Ruta:** `/admin`  
**Acceso:** Solo usuarios con rol **admin**.

### 4.1 Navegación

El panel tiene un menú lateral con las siguientes secciones:

| Sección | Ruta | Descripción |
|---------|------|-------------|
| Dashboard | /admin | Resumen general con métricas |
| Blog | /admin/blog | Gestión de artículos |
| Eventos | /admin/events | Gestión de eventos |
| Peticiones | /admin/petitions | Peticiones de oración recibidas |
| Voluntarios | /admin/volunteers | Inscripciones y asignación |
| Células | /admin/cell-reports | Reportes de células |
| Redes | /admin/social | Publicaciones para el feed |
| Perfil | /admin/profile | Metas personales |

### 4.2 Dashboard

- Muestra totales: usuarios, donaciones, peticiones, vistas del blog, reportes de células.
- Ingresos totales por donaciones exitosas.
- Acceso rápido a las demás secciones.

### 4.3 Blog

**Crear un artículo:**
1. Clic en **Nuevo post**.
2. Completar: **Título** (obligatorio), **Slug** (se genera automáticamente, editable), **Extracto** (resumen), **Imagen de portada** (opcional, subir archivo).
3. Escribir el contenido en el editor (negrita, cursiva, listas, enlaces, imágenes).
4. Seleccionar estado: **Borrador** o **Publicado**.
5. Clic en **Guardar**.

**Editar o eliminar:**
- Clic en el ícono de lápiz para editar.
- Clic en el ícono de papelera para eliminar (confirmación requerida).

**Publicar/Despublicar:**
- Cambiar el estado entre Borrador y Publicado según se necesite.

### 4.4 Eventos

**Crear un evento:**
1. Clic en **Nuevo evento**.
2. Completar: **Título** (obligatorio), **Fecha** (formato YYYY-MM-DD), **Ubicación** (opcional), **Descripción** (opcional).
3. Clic en **Guardar**.

**Editar o eliminar:**
- Clic en el ícono correspondiente en cada fila del listado.

### 4.5 Peticiones de oración

- Lista de todas las peticiones enviadas desde el formulario público.
- Campos visibles: nombre, email, asunto, mensaje, fecha, estado (respondida o no).
- Clic en el ícono de check (✓) para **marcar como respondida** cuando se haya dado seguimiento.
- Las peticiones no respondidas se destacan con borde azul y etiqueta "Nueva".

### 4.6 Voluntarios

**Flujo general:**
1. Las personas se inscriben en la página pública de Voluntariado (nombre, email, teléfono, área de interés, mensaje).
2. Las inscripciones aparecen aquí con estado: **Pendiente**, **Asignado**, **Coordinando**, **Usuario creado**.

**Asignar a un líder (solo admin):**
1. En cada voluntario, usar el **dropdown** que muestra "Sin asignar" o la lista de líderes.
2. Seleccionar el líder responsable. La asignación se guarda automáticamente al cambiar la selección.
3. El voluntario pasa a estado **Asignado**.

**Crear usuario:**
1. Cuando el voluntario esté coordinado y listo para tener cuenta:
2. Clic en **Crear usuario**.
3. En el modal, definir una **contraseña temporal** (mínimo 6 caracteres).
4. Clic en **Crear usuario**.
5. El sistema crea la cuenta con el nombre y correo del voluntario, envía un email de verificación, y actualiza el estado a **Usuario creado**.

**Nota:** Solo se puede crear usuario si el correo del voluntario no está ya registrado.

### 4.7 Células (Reportes)

**Importar CSV:**
1. Preparar un archivo CSV con encabezado. El sistema acepta varias variaciones de nombres de columna, por ejemplo:
   - Líder: `leader_name`, `leader`, `líder`, `lider`, `encargado`, etc.
   - Célula: `cell_name`, `cell`, `célula`, `celula`, `grupo`, etc.
   - Fecha: `meeting_date`, `date`, `fecha`, `fechareunion`, etc.
   - Asistencia: `attendance`, `asistencia`, `asistentes`, etc.
   - Visitantes: `new_visitors`, `visitors`, `visitantes`, `nuevos`, etc.
   - Notas: `notes`, `notas`, `observaciones`, etc.
2. Clic en **Elegir archivo** y seleccionar el CSV (acepta `,` `;` o tab como separador).
3. El sistema importa los reportes y muestra cuántos se importaron y cuántos se omitieron (por errores).

**Entrada manual (un reporte):**
1. Clic en **Formulario de un reporte**.
2. Completar: nombre del líder, nombre de la célula, fecha de reunión, asistencia, visitantes nuevos, notas.
3. Guardar.

**Entrada bulk (varios a la vez):**
1. Usar la tabla con botón **+ Fila** para agregar filas.
2. Completar cada fila con los datos.
3. Clic en **Guardar** para enviar todos.

**Estadísticas:**
- Se muestran totales y desglose por líder (admin ve todos; líder ve solo los suyos).

### 4.8 Redes sociales

- Agregar publicaciones de **Facebook** o **Instagram** para que aparezcan en el feed de la página principal.
- Campos: **Plataforma** (Facebook/Instagram), **URL de la publicación**, **Caption** (opcional), **Activo** (sí/no).
- Las publicaciones se muestran embebidas en la sección "Lo último en redes" del Home.

### 4.9 Perfil (admin)

- Ver datos del usuario (nombre, email, rol).
- Gestionar **metas personales**: agregar, marcar como completadas, eliminar.

---

## 5. Panel de Líder

**Ruta:** `/leader`  
**Acceso:** Solo usuarios con rol **leader**.

### 5.1 Navegación

| Sección | Ruta | Descripción |
|---------|------|-------------|
| Inicio | /leader | Resumen del panel |
| Células | /leader/reports | Reportes de células (solo los del líder) |
| Voluntarios | /leader/volunteers | Voluntarios asignados al líder |
| Perfil | /leader/profile | Metas personales |

### 5.2 Células

- El líder ve solo los reportes donde `leader_name` coincide con su nombre.
- Puede crear reportes manualmente o por bulk (el nombre del líder se asigna automáticamente).
- Puede importar CSV (solo se procesan las filas que correspondan a su nombre, según implementación).

### 5.3 Voluntarios

- Solo se muestran los voluntarios que el admin asignó a este líder.
- **Crear usuario:** mismo flujo que en admin. Clic en **Crear usuario** → definir contraseña temporal → el voluntario recibe email de verificación.

### 5.4 Perfil (líder)

- Igual que el perfil de admin: metas personales.

---

## 6. Perfil (miembro y todos los roles)

**Ruta:** `/profile`  
**Acceso:** Cualquier usuario autenticado (admin, líder, miembro).

- Ver nombre, email y rol.
- **Metas personales:** agregar metas (solo título por ahora), marcar como completadas, eliminar.
- **Próximamente:** Editar perfil, Cambiar contraseña (botones visibles pero no implementados).

---

## 7. Sitio público

### 7.1 Páginas disponibles

| Página | Ruta | Descripción |
|--------|------|-------------|
| Inicio | / | Home con secciones, blog reciente, eventos, redes, donaciones |
| Conócenos | /about | Historia, misión/visión/valores, declaración de fe, horario y ubicación |
| Blog | /blog | Listado de artículos publicados |
| Artículo | /blog/:slug | Detalle de un artículo |
| Eventos | /events | Listado de eventos |
| Oración | /prayer | Formulario de peticiones de oración |
| Voluntariado | /volunteering | Inscripción de interés (áreas, formulario) |
| Donaciones | /donate | Opciones de pago (Stripe, PayPal) |
| Iniciar sesión | /login | Login de usuarios |
| Registro | /register | Mensaje informativo: contactar a líder/admin para obtener cuenta |

### 7.2 Registro de usuarios

- **No hay registro público.** Las cuentas las crean únicamente admin o líderes.
- La página `/register` muestra un mensaje indicando que se debe contactar a un líder o administrador, o inscribirse como voluntario.

### 7.3 Peticiones de oración

1. Ir a **Oración**.
2. Completar: nombre, email, teléfono (opcional), categoría, asunto, mensaje.
3. Enviar. Se muestra confirmación.

### 7.4 Voluntariado

1. Ir a **Voluntariado**.
2. Revisar las áreas de servicio.
3. Completar el formulario: nombre, email, teléfono (opcional), área de interés (dropdown), mensaje.
4. Enviar. Se muestra confirmación de que el equipo se comunicará.

### 7.5 Donaciones

- Opciones de monto predefinidas o personalizado.
- Métodos: tarjeta (Stripe) o PayPal.
- En modo producción, configurar las claves correspondientes en el backend.

---

## 8. Flujos de prueba recomendados

### 8.1 Como administrador

1. Iniciar sesión con `admin@casadelrey.org` / `Admin123!`
2. Revisar Dashboard.
3. Crear un artículo en Blog (título, contenido, publicar).
4. Crear un evento.
5. Revisar Peticiones (si hay alguna).
6. En Voluntarios: asignar un voluntario a un líder (si hay inscripciones).
7. En Células: importar un CSV de prueba o agregar reportes manualmente.
8. En Redes: agregar una publicación de Facebook o Instagram.
9. Ir a Perfil y agregar una meta.

### 8.2 Como líder

1. Iniciar sesión con `lider1@casadelrey.org` / `Lider123!`
2. Revisar Células (reportes asignados).
3. Revisar Voluntarios (solo los asignados).
4. Crear usuario de un voluntario asignado (si hay).
5. Ir a Perfil y agregar metas.

### 8.3 Como miembro

1. Iniciar sesión con `usuario@casadelrey.org` / `Usuario123!`
2. Ir a Perfil y gestionar metas.
3. Navegar por el sitio público (Blog, Eventos).

### 8.4 Como visitante (sin sesión)

1. Navegar por Inicio, Conócenos, Blog, Eventos.
2. Enviar una petición de oración.
3. Inscribirse como voluntario.
4. Revisar la página de Donaciones (no completar pago en prueba si no está configurado).

---

## 9. Solución de problemas frecuentes

| Problema | Posible causa | Solución |
|----------|---------------|----------|
| No puedo iniciar sesión | Correo no verificado | Revisar bandeja de entrada y hacer clic en el enlace de verificación. |
| "Credenciales inválidas" | Contraseña incorrecta | Usar recuperación de contraseña. |
| No veo voluntarios (líder) | Ninguno asignado | El admin debe asignar voluntarios desde el panel admin. |
| Error al importar CSV | Formato incorrecto o columnas faltantes | El CSV debe tener encabezado con al menos: líder (o leader, lider), célula (o cell, celula), fecha (o date, meeting_date). Ver sección 4.7 para variaciones aceptadas. |
| Donación no procesa | Modo prueba / claves no configuradas | Verificar configuración de Stripe/PayPal en el backend. |

---

## 10. Contacto técnico

Para soporte técnico, dudas sobre el uso del sitio o reporte de incidencias, contactar al desarrollador del proyecto.

---

*Documento generado para la Iglesia Casa del Rey — Huehuetenango, Guatemala. Marzo 2025.*
