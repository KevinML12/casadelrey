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
