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
