# Revisión del 27 de octubre de 2026

Correcciones: fotos de respaldo ante URLs administradas rotas; ventanas con cierre accesible fuera del formulario, foco estable, movimiento reducido, títulos largos y desbloqueo si desaparece el registro; galería vacía/paginada y descripciones correspondientes a la foto seleccionada; búsqueda de células vacía con contacto; detalles de células sin esperas acumuladas; enlaces a eventos pasados; etiquetas de inscripción; información institucional con reintento; fondos de Oración y Conéctate administrables.

Validación antes de integrar: 45 pruebas de interfaz/regresión aprobadas, 12 comprobaciones posteriores de escenas y pulido aprobadas, build correcto, lint sin errores (20 avisos existentes), tests Go handlers/routes aprobados. Las suites aisladas interceptan la API y no crean datos reales.

Cambio solicitado: integrar en `main`, publicar Vercel apuntando a Render y conservar Supabase como base. La conexión de Render conserva el schema QA existente; no se copian registros de producción.

Pendiente de esta revisión: verificar los despliegues finales y recorrer los módulos contra Render real. Registrar aquí el resultado observado, diferenciando lectura de módulos, escrituras sintéticas y flujos que requieren correo externo.

Primera publicación `22048b3`: `main` integrado por fast-forward y Vercel Production READY (`dpl_5HpRrHmHaeKHZZF1ZVFcj7n3DXB3`); Render Static Live desde `main` (`dep-dbghjg942hec73d2vo30`). El endpoint público de Vercel devuelve los mismos 12 campos `about_*` que Render. La conexión SQL de QA confirma Supabase, TLS y schema `cdr_render_qa`, con 26 tablas.

Ajuste posterior solicitado: dar protagonismo a la fotografía en vistas previas, cristal inferior compacto con blur de 5 px y contraste localizado; Eventos despliega la descripción completa y conserva inscripción/cancelación. Blog y colecciones comparten esta composición. Acceso, confirmación y 404 comparten fotografía administrable y radio de 16 px. Corrección de `/admin/social/`: el servidor requiere la barra final para listar/crear. La primera revisión real recorrió los 25 módulos de administrador sin excepciones JS; encontró este 404. El envío de oración sí llegó al panel; se corrigió el localizador de prueba para el asunto precedido por separador.

Validación del ajuste fotográfico: 45 regresiones aprobadas y una prueba adicional de vista previa/detalles/inscripción aprobada. Publicar esta corrección y repetir el recorrido real antes de darlo por terminado.

El recorrido real amplió la revisión a las 10 pantallas de líder accesibles para el administrador, además de sus 25 módulos. La pantalla de registro de cuentas necesitaba un landmark principal: se corrigió a `<main>` y se alineó el radio a 16 px. La comprobación local de los 18 puntos de entrada públicos pasa sin excepciones JS y con un único h1 por página. Los flujos reales de oración/conexión/eventos usan QA y eliminan sus registros temporales al terminar.

Contenido de ejemplo solicitado expresamente: cuatro eventos administrables con nombres naturales y fotos reales de grupo/infraestructura, sin etiquetas de prueba en sus títulos. Se actualizó el registro sintético inicial y se añadieron tres eventos en el schema QA, mediante la API de administrador. No se modificaron registros históricos del schema público. Inventario en `eventos-ejemplo.json`.

La prueba real de crear un evento detectó una respuesta pública previamente cacheada al seguir su enlace. El enlace `?id=` ahora también identifica la petición del feed, para que la nueva convocatoria no quede oculta por una respuesta anterior; el efecto recarga si cambia ese identificador. Se conserva la caché habitual para el listado general.

Interacción final solicitada: `CollectionNavigation` distingue los recorridos de los paneles estáticos; controles con borde y fondo tenue, posición discreta, estado de pulsación de 160 ms, estados de 120 ms y fundidos de contenido de 180 ms. Tabs conservan foco y muestran estado activo. Movimiento reducido sin animaciones. 48 pruebas locales aprobadas tras este ajuste, build correcto y lint sin errores (20 avisos existentes).

La prueba real de Eventos pasa: creación por UI de administrador, foto administrada, enlace a su vista previa, detalles y RSVP gratuito persistido. En eventos con costo, el entorno QA sin cuenta bancaria muestra «Registro no disponible aún»; no se inventa una cuenta ni se fuerza el pago. La prueba se corrigió para comprobar ese comportamiento real en vez de esperar el formulario que deliberadamente está bloqueado. Los eventos temporales e inscripciones de la verificación se limpian; se conservan únicamente los cuatro ejemplos solicitados.

## Resultado final verificado

Frontend de aplicación `2a139ab01d0c9ff9207c067ae2b3b3410a72399c`, rama `main`, publicado en ambos canales:

- Vercel Production READY: `dpl_AxzZSonB4Cmyu5zGsKRDVi6PxHQe`, enlace estable `https://casadelreyhue.vercel.app`.
- Render Static Live: `dep-dbgi19t9fdbs73dhpi50`, enlace `https://casadelrey-web-pruebas.onrender.com`.
- Backend Render existente, código `9e74735` (sin cambios posteriores de backend), conectado al mismo proyecto Supabase mediante el schema QA aislado.

48 pruebas locales de interfaz aprobadas; build y lint correctos, con 20 avisos anteriores. Suite real de 5 pruebas aprobada en 1.6 minutos: 18 puntos de entrada públicos a 390 y 1440 px, 25 módulos de administrador y 10 de líder, perfil/acceso de miembro, oración y conexión desde formulario público hasta el panel, creación de evento por UI, portada administrada, vista previa/detalles, inscripción gratuita y bloqueo de inscripción pagada sin cuenta bancaria. Las comprobaciones de voluntario y comprobantes privados tienen además regresiones aisladas en `audit-fixes.spec.js`; no se presentan como entrega de correo real ni transferencia de dinero.

Se eliminaron los registros temporales de estas pruebas. Permanecen cuatro eventos de ejemplo solicitados por el propietario, editables desde el administrador. No se cargaron álbumes, líderes ni células ficticios.

Las pestañas que estaban abiertas conservaban la interfaz anterior en memoria. Se recargó la pestaña de Render y se verificó por interfaz el evento «Noche de adoración», posición 2 de 4, controles nuevos y cambio de fondo. Una nueva pestaña de Vercel muestra y conserva la revisión actual. Captura final: `eventos-interaccion-final.png`.

Pendientes de puesta en servicio definitiva: mantener explícita la separación QA/producción, publicar contenido y cuentas definitivos, configurar y comprobar correo transaccional y los datos bancarios reales. Esta revisión no migra el schema histórico ni certifica carga concurrente de 1000 usuarios. No se compraron planes ni se eliminó infraestructura de Fly; el frontend deja de usarla.

## Cierre de responsividad

Solicitud final: verificar responsividad y guardar el commit de cierre. Nueve pruebas adicionales aprobadas en 37.7 segundos, sin cambios necesarios en el código de aplicación. Los 18 puntos de entrada públicos se revisaron a 320, 360, 390, 768, 1024 y 1920 px, con colecciones pobladas mediante API interceptada. Se comprobó ausencia de desbordamiento horizontal y de excepciones JS.

Galería, cambio de foto y formulario de inscripción se probaron a 320×568, 844×390 y 768×1024: controles dentro de la pantalla, cierre accesible, desplazamiento interno hasta la acción final y recuperación del contenido al cerrar. Estas verificaciones no enviaron formularios ni alteraron datos.

Revisión visual adicional de Eventos publicado en Vercel a 320 y 768 px, esperando la fotografía cargada: `responsive-live-320.png` y `responsive-live-768.png`. La aplicación conserva la versión publicada `2a139ab`; este cierre añade pruebas y evidencia, sin cambios de diseño ni migraciones. Resultado en `responsive-final.txt`.
