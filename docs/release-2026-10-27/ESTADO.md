# Revisión del 27 de octubre de 2026

Correcciones: fotos de respaldo ante URLs administradas rotas; ventanas con cierre accesible fuera del formulario, foco estable, movimiento reducido, títulos largos y desbloqueo si desaparece el registro; galería vacía/paginada y descripciones correspondientes a la foto seleccionada; búsqueda de células vacía con contacto; detalles de células sin esperas acumuladas; enlaces a eventos pasados; etiquetas de inscripción; información institucional con reintento; fondos de Oración y Conéctate administrables.

Validación antes de integrar: 45 pruebas de interfaz/regresión aprobadas, 12 comprobaciones posteriores de escenas y pulido aprobadas, build correcto, lint sin errores (20 avisos existentes), tests Go handlers/routes aprobados. Las suites aisladas interceptan la API y no crean datos reales.

Cambio solicitado: integrar en `main`, publicar Vercel apuntando a Render y conservar Supabase como base. La conexión de Render conserva el schema QA existente; no se copian registros de producción.

Pendiente de esta revisión: verificar los despliegues finales y recorrer los módulos contra Render real. Registrar aquí el resultado observado, diferenciando lectura de módulos, escrituras sintéticas y flujos que requieren correo externo.
