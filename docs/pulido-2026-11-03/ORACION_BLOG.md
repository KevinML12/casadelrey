# Oración y Blog

Oración pasa de una portada, etiquetas y una segunda sección a una sola ficha sobre su fotografía administrable. Los datos opcionales se despliegan; los errores se asocian a sus campos y un fallo de servidor mantiene el borrador. El formulario conserva su contrato y el recorrido público → administración.

El Blog elimina la portada separada y coloca una cabecera discreta dentro de la escena del mensaje. Las categorías y publicaciones siguen derivándose de la API; la navegación es manual y por disolución. El título gana jerarquía con menos compresión y el panel crece con títulos largos. Los demás consumidores del carrusel conservan su composición por defecto.

La lectura mantiene una ruta propia, contenido sanitizado, categoría y fecha existentes. La portada aparece completa dentro del cristal y de fondo durante el desplazamiento. Los controles de audio se adaptan a pantallas pequeñas, permiten reintentar y liberan la reproducción al salir o detenerla; las solicitudes canceladas no pueden empezar a reproducirse después.

Se conserva Arimo local, el relleno original del cristal blanco y el oscuro casi transparente. No se modifican registros del CMS, secretos, permisos ni recursos del backend.

Verificación: regresiones de 320, 768 y 1440 px, formularios y reintentos, correo opcional inválido, filtros reales, enlaces de mensajes, portada completa, contenido vacío/fallido y ciclo de vida del audio. La suite completa usa PostgreSQL, identidades, correo y archivos locales desechables. Los diagnósticos se guardan en la carpeta ignorada `diagnosticos/`.
