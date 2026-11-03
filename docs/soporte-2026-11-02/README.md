# Soporte interno

La aplicación es una plataforma web de gestión eclesiástica a medida: sitio público, CMS y procesos de comunidad para células, voluntariado, eventos y aportes. El nuevo soporte acompaña su operación desde los paneles existentes.

## Uso

- Administradores: Sistema → Soporte (`/admin/support`). Consultan y atienden todos los casos.
- Líderes: Soporte (`/leader/support`). Sólo consultan, responden y reabren sus propios casos.
- Nuevo caso: asunto, módulo afectado y descripción. Las capturas son opcionales. Tras guardar se abre la conversación; si una captura falla, el caso permanece creado y el reintento conserva la clave del archivo.
- Estados: abierto, en revisión, esperando respuesta y resuelto. Resolver exige documentar la solución; pedir información exige explicar qué se necesita. Cada cambio conserva autor y fecha. Si el solicitante responde a una solicitud de información, el caso vuelve a abierto. Los resueltos pueden reabrirse.
- Los avisos aparecen en la navegación. El administrador ve casos abiertos/en revisión; cada líder ve sus casos esperando respuesta. No se consumen envíos de correo ni se contrata un servicio externo.
- Configuración → Soporte permite editar las instrucciones del formulario.

## Datos y privacidad

Tres tablas nuevas: `support_tickets`, `support_messages`, `support_attachments`. Creación, conversación y cambios de estado se guardan en transacciones; los envíos repetidos conservan su identidad. Las decisiones de estado comprueban la revisión para evitar pisar cambios de otro administrador.

Las capturas se guardan en el bucket privado existente, bajo `soporte/`, con referencias separadas de comprobantes. Nunca se entregan URLs públicas ni firmadas. Cada lectura comprueba la sesión, el rol y la pertenencia al caso. El navegador libera las vistas previas al cerrarlas. Las consultas de soporte no registran descripciones en los logs SQL.

PNG/JPG hasta 5 MiB y 20 millones de píxeles; máximo 3 por selección, 12 por caso y 32 MiB por usuario/24 horas. Hasta 20 casos nuevos por usuario/24 horas. Los archivos quedan asociados a un caso antes de subir; los fallos conservan una fila de seguimiento y admiten reintento con una concesión temporal. No se borran casos, respuestas ni capturas desde esta primera versión.

Los respaldos existentes incluyen las tablas por inventario dinámico y todos los objetos privados. Los casos de soporte no modifican contenido público ni invalidan su caché. No se crearon casos ni cuentas de ejemplo en la base activa.

## Validación

Pruebas de permisos y aislamiento por propietario; cambios de estado, conflictos de revisión, rollback, reapertura, idempotencia y fallos de archivos. Concurrencia de PostgreSQL desechable para casos, mensajes y carga de una misma captura. Navegador con API interceptada para creación, reintentos, borradores conservados, estados, permisos de interfaz y visor privado a 320, 768 y 1440 px. Las capturas de esta carpeta proceden de esos datos aislados de verificación.

La interfaz reutiliza el cristal blanco del panel, con radios contenidos, bordes estáticos, tipografía existente, foco de teclado, bloqueo/foco compartidos de diálogos y transiciones breves de opacidad. No agrega pictogramas decorativos ni movimiento tridimensional.
