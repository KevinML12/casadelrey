# Cierre adicional — 1 de noviembre de 2026

Se completaron dos controles técnicos pendientes, sin introducir datos bancarios, realizar transferencias o enviar correos a personas.

## Configuración bancaria administrable

Banco, cuenta, tipo y titular deben provenir de valores guardados por administración. Se retiraron los nombres y tipos bancarios de ejemplo del backend y del frontend. La vista pública muestra contacto cuando falta algún campo. El panel indica exactamente qué falta guardar y conserva el estado anterior mientras el administrador prepara un cambio. Los datos largos se ajustan a 320 px.

La confirmación de la cuenta oficial sigue correspondiendo a la iglesia. La aplicación no puede deducirla ni validar que el banco haya recibido dinero a partir de una imagen.

También se reprodujo y corrigió una doble activación de «Continuar» durante la transición: ahora no puede saltarse la selección del destino de una donación. La regresión específica falló antes de la corrección y pasó después.

## Recuperación íntegra desde R2

La nueva operación `remote-restore-check` descarga sólo respaldos cifrados del bucket privado en un espacio temporal nuevo. Valida autenticación, nombres, referencias, tamaños y SHA-256; rechaza corrupción, rutas fuera del respaldo y destinos existentes. No consulta ni restaura una base remota y no modifica objetos de R2.

Pasaron ambas bases de 28 tablas, las dependencias de autenticación y los 749 archivos. Los 536 contenidos distintos se descargaron de R2 una sola vez y se comprobaron también después de restaurar las bases en PostgreSQL local desechable. Se eliminó el material temporal y se conservó únicamente un informe agregado. Así queda cerrado el límite del ensayo anterior, que había utilizado las copias locales.

Los respaldos automáticos del 31 de octubre y del 1 de noviembre también terminaron correctamente. El horario es un objetivo de ejecución de GitHub, que puede demorarlo; requiere revisar copias recientes, no sólo comprobar que el workflow esté activo.

## Validación

- Backend completo con detector de carreras y `go vet`: correctos. Casos adicionales para campos bancarios vacíos y recuperación cifrada.
- Diez regresiones de interfaz correctas: datos bancarios incompletos/completos, guardado y borrado desde administración, doble activación durante la transición, pago por evento, donación, corrección de comprobante, estados de correo y recepción presencial. Usan datos controlados e interceptan la API.
- Build correcto; lint sin errores y con los 18 avisos anteriores.
- Vercel y Render Static: cuatro pruebas de rutas públicas, a 390 y 1440 px, sin errores de ejecución o desbordamiento. Se ejecutan sin credenciales ni cuentas QA retiradas.
- Cuatro comprobaciones adicionales del formulario público de donación a 320 y 1440 px, en ambos sitios: doble activación sin salto de pasos, contacto visible y cero envíos de donaciones o comprobantes. Utilizan los destinos publicados reales y permiten únicamente consultas.

El backend quedó publicado desde `470c31f`; ambos frontends contienen `9ae8133`, que añade la corrección de doble activación. Identificadores de despliegue y resultados en [deployment.json](deployment.json), [vista de pago](payment-preview.json), [Vercel](vercel-public.txt), [Render](render-public.txt), [recuperación remota](remote-restore.json) y [respaldos programados](scheduled-backups.json).

## Decisiones de la iglesia

Permanecen la cuenta bancaria oficial, el alojamiento continuo, el dominio para correo y medios y la aceptación/capacitación. No se contrataron planes ni dominios. Las dos máquinas de Fly siguen detenidas; el bloqueo de facturación del proveedor para retirar su arranque automático permanece documentado. Tarjetas requiere proveedor y credenciales propios antes de poder ofrecer ese medio de pago.
