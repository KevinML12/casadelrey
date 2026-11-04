# Validación de roles y comprobantes — 3 de noviembre de 2026

## Entorno y alcance

Chromium ejecuta el frontend actual, el backend Go y una base PostgreSQL local desechable. Se generan cinco identidades con contraseñas aleatorias: administrador, líder, segundo líder, miembro y voluntario. El visitante público usa también un contexto sin sesión.

No se heredan credenciales de Supabase, R2 ni Brevo. Los archivos privados se almacenan localmente y los correos quedan en la cola cifrada local; no se envían a destinatarios reales. Las cuentas, base, sesiones y archivos temporales se eliminan al terminar cada ejecución. No se modifican los registros de la iglesia ni se realizan transferencias bancarias.

## Resultado

**39 escenarios aprobados, 0 fallidos y 0 omitidos en la ejecución conjunta final (4,4 minutos), sin reintentos automáticos.** Se completó también la limpieza de las cuentas, base, sesiones y archivos temporales.

No se requirieron cambios de funcionamiento en la aplicación. Se amplió la cobertura de pagos y se corrigió una expectativa de la suite de pruebas.

## Recorridos comprobados

| Perfil o flujo | Comprobación |
| --- | --- |
| Administrador | Navegación de sus 27 módulos a 390 y 1440 px; creación, edición y baja/ocultación de catálogos; cuentas, publicaciones, fotografías, células, configuración y seguimiento. |
| Líder | Navegación de sus 11 módulos a ambas anchuras; edición de su célula, reporte y aprobación; seguimiento de solicitudes asignadas; directorio y perfil. |
| Otro líder | No puede leer ni modificar información privada de otro líder: solicitudes, boletas y casos de soporte. |
| Miembro y visitante | Rutas públicas, metas personales, solicitudes de conexión/células, oración e inscripción a eventos. No pueden acceder a recursos administrativos ni concederse permisos. |
| Voluntario | Inscripción pública, asignación, creación y verificación de cuenta, reporte de servicio y aprobación visible en su panel. |
| Acceso y recuperación | Creación desde administrador/líder, verificación, acceso, recuperación, cambio de contraseña e invalidación de sesiones anteriores. |
| Soporte | Archivo privado real, respuesta administrativa, resolución y reapertura con control de acceso. |
| Aporte presencial | Permanece pendiente hasta confirmar la recepción; las correcciones conservan historial. |
| Comprobante de donación | Carga privada, bloqueo de lectura anónima, rechazo motivado, enlace privado leído de la cola local, reemplazo del archivo y aprobación. |
| Evento gratuito | Carga de fotografía, publicación, inscripción pública y lectura de asistentes desde administración. |
| Evento con aporte | Bloqueo si faltan datos bancarios; con datos locales de simulación, inscripción con comprobante en una sola operación y reserva de plazas. La revisión administrativa confirma la inscripción. |

## Regresiones añadidas o afinadas

- Un evento con capacidad de tres personas recibe una inscripción para dos, con aporte de Q50 por persona. La aplicación exige comprobante, mantiene el pago pendiente y reserva dos lugares. Tras revisar la imagen privada y aprobar, administración muestra el pago verificado y sigue habiendo una única inscripción para dos personas, con un lugar disponible. Repetir la misma solicitud tampoco duplica inscripción ni reserva.
- Las pruebas de eventos exigen que frontend y API estén en `127.0.0.1`, además de la habilitación expresa del entorno desechable.
- La baja de destinos de donación conserva el registro inactivo para proteger el historial financiero. La prueba comprueba esa conservación y la exclusión del catálogo público; espera la fila actualizada y no acepta como éxito la ausencia momentánea durante la carga.

## Incidencias de la ejecución inicial

La primera ejecución terminó con 28 aprobados y 10 fallidos. Hubo esperas excedidas de carga/interacción y una expectativa de eliminación que no reflejaba la baja lógica de destinos. Los diez casos fallidos se volvieron a ejecutar junto a un recorrido de control: 11 aprobados. El nuevo flujo de pago y la comprobación corregida de destinos también pasaron en una ejecución dirigida de cuatro escenarios. Finalmente se ejecutaron conjuntamente los 39 escenarios y todos pasaron.

## Repetir

Desde la raíz del proyecto, con Go, Node, PostgreSQL local y Chromium de Playwright instalados:

```sh
python3 ops/test_fullstack.py roles-fullstack.spec.js events.spec.js prayer.spec.js \
  --output docs/pulido-2026-11-03/diagnosticos/validacion-roles-final
```

Los diagnósticos completos permanecen locales e ignorados por Git porque pueden contener credenciales temporales y enlaces de un solo uso. Este documento no los reproduce.

Esta revisión comprueba funcionalidad y permisos. No acredita entrega real de correo, funcionamiento del almacenamiento externo en esta ejecución, movimientos bancarios ni aceptación o capacitación por parte de la iglesia.
