# Visor adaptable y superposición — 29 de octubre de 2026

La aclaración del propietario conserva la escena principal de fotografía y cristal, pero permite fotografías completas dentro de los detalles abiertos, conservando simultáneamente el fondo. Se actualizó también la skill personal y la dirección de diseño del repositorio.

## Cambios

`WindowStack` dedica la mayor parte de su ventana a la fotografía original, sin recorte, con los detalles al lado en escritorio y debajo en móvil. El cierre y la navegación entre registros quedan fuera del contenido desplazable. En pantallas horizontales bajas, la zona fotográfica se adapta a la altura restante para no esconder los controles. El fondo conserva la escena fotográfica y se disuelve junto a la imagen interior; cambiar Galería/Fotos/Información mantiene la fotografía seleccionada. Las URLs R2 administradas se conservan y las fotos locales conocidas usan derivados responsive de calidad. El cambio también alcanza los detalles de células, departamentos y eventos.

Voluntariado mantiene un departamento a la vez, con ficha compacta, más aire para la fotografía y selector directo generado desde la API. Conserva quiz, aplicación y departamentos añadidos por el administrador. Fundadores y pastores vuelven a mostrar sus retratos anteriores dentro del bloque de cristal, con prioridad para las fotos administradas correspondientes. Los slots `about_fundadores`, `about_visitanos` y `about_podcast` aparecen en Fotos del sitio; `about_pastores` conserva su imagen existente. No se modificaron registros de contenido para cambiar la presentación.

Inicio y Nosotros comparten `VisitExperience`: dirección/mapa y podcast/horario administrables, pestañas con teclado, copiar información y conexión al formulario existente. El enlace de reproducción `about_podcast_url` es opcional y comienza vacío; sólo se acepta HTTP(S). No se inventó una transmisión de audio ni un enlace para escuchar. `LayeredPanel` añade un desplazamiento breve de primer plano según el puntero fino y el scroll, sin inclinación, 3D, zoom ni reflejo que siga al mouse. Movimiento reducido desactiva esta superposición.

## Verificación

39 pruebas de interfaz aprobadas: visor a 320×568, 390×844, 768×1024, 1024×768, 1440×1000 y 844×390; recorrido de fotografías, fondo sincronizado, teclado, foco restaurado, selección directa de departamentos, aplicación, retratos, mapa, copia, enlace de podcast y movimiento reducido. La revisión de los módulos públicos incluye anchos de 320 a 1920 px y los formularios existentes. Tests de handlers y routes Go aprobados; build correcto; lint sin errores y con los mismos 20 avisos anteriores. La skill pasó su validador.

Las capturas de esta carpeta se revisaron con contenido real de Supabase y medios existentes. El backend local se limitó a una conexión para convivir con Render sin agotar el límite del rol de Supabase. Se mantuvieron datos, roles y relaciones existentes; las pruebas de escritura usan API interceptada.

La verificación no certifica una prueba de carga ni un envío real de correo o dinero.

## Publicación y comprobación de los enlaces

La versión de aplicación `b4ca64f` está publicada en Vercel Production READY y Render Static Live. La revisión real en ambos enlaces abrió SABADOS con su original R2 de **6000×4000 px**, foto completa con object-contain, fondo sincronizado, navegación y ventana ajustada a móvil. También comprobó selección directa de Logística, retratos de pastores y pestaña Podcast. Sin errores de ejecución en ninguna de las dos vistas. Resultados en `live-verification.json`; capturas en `vercel-visor-publicado.png`, `vercel-visor-movil-publicado.png` y `render-visor-publicado.png`.

El intento de publicar el backend `b4ca64f` falló al abrir la conexión: `SQLSTATE 53300`, límite de conexiones del rol. El backend anterior sigue atendiendo las dos interfaces. Se identificó un límite de cuatro conexiones del rol, sin ampliarlo ni cambiar sus permisos. El Mac se bloqueó antes de reintentar desde Safari y el control de la aplicación requiere desbloqueo manual. Por tanto, los nuevos slots de Fotos del sitio y el nuevo enlace opcional del podcast están preparados y probados en el código, pero su publicación en la API de Render permanece pendiente. No se presenta ese paso como completado.

El backend local quedó reiniciado con esta versión, conexión a Supabase y R2 activos; `/health` responde y `/api/v1/settings` ya expone el nuevo campo opcional de podcast. Se deja abierto el álbum SABADOS en el navegador local.
