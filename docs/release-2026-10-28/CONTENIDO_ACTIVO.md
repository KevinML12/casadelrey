# Contenido activo y diseño publicado — 28 de octubre de 2026

El propietario autorizó incorporar el contenido activo existente y depurarlo en todos los módulos, aplicando la filosofía fotográfica y de cristal establecida. Se creó primero un respaldo privado recuperable de ambos esquemas.

## Datos reales

Se importaron desde `public` hacia `cdr_render_qa` las cinco categorías y 16 células activas, diez departamentos, cinco destinos de donación, un mensaje publicado, siete eventos activos, cuatro publicaciones de redes, dos anuncios activos, un perfil público de líder, el encabezado y la configuración guardada. Se conservan los cuatro eventos de ejemplo solicitados anteriormente y las cuentas de QA existentes.

Las identidades de las 29 cuentas históricas no eliminadas conservan sus nombres, roles y hashes de contraseña; las relaciones con células, autores y líderes se remapean. Las sesiones y los tokens de recuperación/verificación/refresh no se transfieren; las credenciales que ya existían en destino se conservan. Los movimientos financieros, comprobantes, solicitudes y reportes históricos permanecen en el esquema original: esta importación publica contenido y mantiene la continuidad de cuentas, sin presentar una migración integral del historial transaccional.

La lectura del origen y la escritura del destino usan conexiones separadas. No se ampliaron permisos para que el rol QA pudiera leer `public`. La importación tiene transacción, bloqueo de ejecución simultánea, mapa de identificadores y ensayo con rollback. Una repetición conserva los registros ya importados y las ediciones posteriores del administrador.

## Fotos y depuración

Se preservaron 691 registros de galería. Quedaron públicos 495: se archivaron en destino 192 copias de la misma imagen dentro del mismo álbum y cuatro imágenes externas de ejemplo. Los archivos de R2 y los datos del origen se conservan. Todas las referencias R2 activas comprobadas existen en el inventario del bucket.

Las cinco fotografías de categoría fueron sustituidas por planos amplios de las carpetas originales y sus objetos existentes en R2, guardados en el recurso administrable de categorías. Son imágenes de contexto de la comunidad, no una afirmación de pertenencia individual a cada célula. También se seleccionaron trece portadas de álbum y fondos de redes con contexto correspondiente. La portada externa del mensaje fue sustituida por una toma real de congregación. Procedencia en `portadas-administrables.json`.

## Interfaz y flujos

Inicio obtiene células, mensajes y publicaciones sociales desde la API: una escena fotográfica con una ficha de cristal compacta y navegación identificada. No hay fotos dentro de nuevas cards ni lista local de categorías de respaldo. Se conservan enlaces a células, lectura del blog y destinos originales de redes; vacíos, carga y error con reintento son estados distintos.

Administrador: Adolescentes aparece entre los tipos de célula; el líder ya asignado permanece seleccionable aunque no aparezca en el listado de nuevos líderes. El backend permite conservar códigos históricos como V1 al editar, sin aceptar códigos nuevos inválidos ni renumerar registros. El selector de códigos conserva el prefijo V al cambiar el número dentro del mismo tipo.

Verificación local: 37 regresiones de escenas/foco/módulos aprobadas, cinco pruebas específicas de publicación/edición aprobadas y nueve casos adicionales de responsividad incluidos en la suite de 13 comprobaciones. Tests Go de handlers y routes aprobados; build correcto; lint sin errores y con 20 avisos anteriores. Pruebas de interfaz aisladas, sin escrituras reales en datos históricos.

Pendiente al redactar: publicar y comprobar la revisión en los dos frontends y el backend Render, incluyendo lectura del contenido real, detalle de una célula, solicitud e inscripción, edición administrativa y permisos. El correo transaccional y una transferencia de dinero no se certifican mediante pruebas de interfaz.
