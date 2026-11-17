# Preparación del despliegue de comprobantes privados

Fecha: 7 de octubre de 2026. El código está validado localmente; la migración y la configuración real siguen pendientes. No desplegar esta transición sin resolver los archivos históricos que el equipo necesita consultar.

## Configuración

- R2: crear un bucket separado para boletas. Definir `CF_R2_PRIVATE_BUCKET` con ese nombre; conservar `CF_R2_BUCKET` para imágenes públicas. La credencial debe permitir PUT/GET sobre el bucket privado.
- Desactivar acceso público por r2.dev y cualquier dominio/Worker que sirva el bucket privado. Usar un nombre distinto del bucket público no garantiza por sí solo que Cloudflare lo mantenga privado; hay que verificarlo desde una petición anónima.
- El código no genera presigned URLs. Las lecturas pasan por la API autenticada; no requiere URL pública para el bucket privado.
- Desarrollo/local: los archivos van a `uploads-private`, junto a `uploads` y fuera de su raíz. En contenedores con storage local se necesita persistencia y permisos de escritura para ese directorio, además del volumen público. No copiar ni montar el directorio privado dentro del público.

## Migración histórica

1. Respaldar tablas de donaciones/comprobantes y los objetos antes de modificar referencias. Preparar un inventario con ID de registro, referencia anterior, checksum y destino privado. No guardar nombres, correos ni tokens en logs públicos.
2. Copiar cada objeto a storage privado con nombre UUID y extensión validada. Para R2, leer mediante el SDK y una clave obtenida del inventario confiable; no ejecutar fetch de URLs arbitrarias tomadas de la base.
3. Verificar checksum, tamaño y lectura autenticada de la copia. Actualizar `payment_receipts.receipt_image_url` a `receipt-private:<uuid>.<ext>`, junto con referencias heredadas en donaciones cuando existan. Preservar los estados financieros, fechas, IDs y relaciones. No deduplicar ni reclasificar pagos durante esta migración.
4. Completar una verificación de todos los registros migrados. Si falla una copia o una actualización, conservar su original y registrar el fallo; no cambiar la referencia a un objeto no verificado.
5. Después de comprobar copias y referencias, retirar las boletas del bucket/directorio público y revocar o purgar las copias servidas por el CDN. Confirmar que la URL antigua ya no devuelve bytes sin autenticación. La protección de la API no elimina copias públicas anteriores ni archivos que alguien ya haya descargado.
6. Publicar backend/frontend coordinadamente. Los registros sin migrar mostrarán «Comprobante pendiente de migración»; no se abrirán sus antiguas URLs públicas desde el panel.

## Criterios de staging

Con archivos y cuentas sintéticas: subir imagen y PDF desde donación/comprobante, comprobar preview local, registrar el pago, abrirlo con admin y verificar/revertirlo. Probar anónimo, miembro, voluntario, líder, admin revocado y registro eliminado. Ninguno de esos casos debe permitir una descarga no autorizada.

Confirmar `private, no-store` y `nosniff`, ausencia de URLs/tokens públicos, fallo de subida cuando falta bucket privado, persistencia tras reiniciar y rechazo de las URLs históricas. Realizar un rollback de prueba usando el inventario y copias protegidas; nunca restaurar visibilidad pública para solucionar un fallo de configuración.
