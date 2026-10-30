# Administración y promoción de redes

Entrega del 30 de octubre de 2026.

## Cambios

- Inicio y Nosotros promocionan perfiles oficiales, sin consumir citas, imágenes ni enlaces de publicaciones individuales. No se eliminan los registros antiguos.
- Administración → Redes permite editar título, presentación, descripciones y enlaces de Instagram, Facebook, TikTok, X y YouTube. Vaciar un enlace oculta esa red también en el pie de página y en el estado vacío de Eventos. No se inventa un canal de YouTube.
- Los perfiles confirmados que antes estaban fijos en el pie ahora son valores iniciales editables de configuración. Un valor vacío guardado conserva la decisión del administrador.
- El servidor y el formulario validan que el enlace corresponda al perfil de la plataforma, usando HTTPS.
- El panel tiene navegación agrupada, búsqueda, menú accesible en móvil, espacios consistentes y cristal blanco sobrio.
- Células incorpora búsqueda por nombre/código/líder/zona, filtros y visibilidad reversible. Conserva códigos históricos y líderes asignados. Los formularios mantienen el borrador si falla el guardado.
- Categorías y fotos permite subir la imagen original, editar nombre, descripción, clasificación y orden en el mismo formulario.
- Configuración conserva otros borradores al guardar un campo. El resumen distingue donaciones recibidas, muestra pendientes reales de reportes y no presenta fallos de carga como ceros.

## Validación

- 73 pruebas aisladas de interfaz: 23 de contenido/administración y 50 de visor, responsividad, navegación, pagos, comprobantes y correos.
- Las 9 pruebas específicas de administración se repitieron tras los ajustes visuales finales; todas pasaron.
- Compilación del frontend correcta. Análisis estático: 0 errores y 18 advertencias ya existentes.
- `go test ./...` correcto. La nueva cobertura verifica enlaces de perfiles, rechazo de publicaciones/otros dominios y ocultación persistente sin reactivar valores iniciales.
- Revisión visual local con datos reales: 16 células y sus categorías; escritorio y móvil. Nueve capturas privadas y cero errores de ejecución.

## Alcance de la entrega

Esta entrega mejora administración y contenido editable. No sustituye los pendientes operativos documentados para producción: autenticación del remitente con dominio propio, revisión de comprobantes históricos, restauración de copias, capacidad de alojamiento y aceptación con responsables reales.

## Publicación verificada

- Backend en Render: `e806bcb`, despliegue `dep-dbif2kmi0phs7399qtg0`, Live.
- Frontend en Vercel y Render: `58b0c82`; Render `dep-dbif46vb9u1s73bn8ir0`, Live. Vercel sirve la misma hoja de estilos compilada y las pantallas nuevas verificadas.
- Seis pruebas adicionales de lectura en sitios publicados: tres en Vercel y tres en Render. Incluyen todas las rutas públicas en móvil/escritorio, todos los módulos de administración y la denegación del panel a un miembro.
- Comprobación específica en ambos sitios: cuatro perfiles públicos, ausencia de solicitudes al feed antiguo, textos editables cargados desde el backend, filtros móviles y cero desbordamientos/errores de ejecución.
- Persistencia real autenticada comprobada en la descripción de YouTube, sin publicar un perfil nuevo. El valor original fue restaurado y leído de nuevo.
- Backend local restablecido con una sola conexión; `/health` responde correctamente.

Resultados: [Vercel](admin-vercel-live.txt) y [Render](admin-render-live.txt).
