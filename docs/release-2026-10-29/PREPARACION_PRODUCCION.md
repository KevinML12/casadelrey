# Preparación para producción — 29 de octubre de 2026

> Registro histórico. El saneamiento, los respaldos, la restauración y la carga posteriores están en [Cierre técnico del 30 de octubre](../release-2026-10-30/CIERRE_PRODUCCION.md); consultar allí el estado actual de los pendientes.

**Valoración técnica: 7/10 listo; aproximadamente 3/10 pendiente.** Es una estimación de cierre, no un porcentaje medido ni una promesa de capacidad. Se excluyen capacitación, aceptación y pruebas con personas reales. Se incluyen todavía las verificaciones técnicas con cuentas controladas, restauración y carga sintética.

## Verificado

- 34 espacios fotográficos del administrador configurados con 26 imágenes reales, dos fotos por cada uno de los diez departamentos. Escenas generales de alta resolución, variantes WebP y originales intactos. Las dos fotos administradas que existían se conservaron.
- Los dos frontends usan Render y Supabase. Se verificaron los 16 registros de células, departamentos, galería y relaciones; las cuentas históricas conservan roles y contraseñas importadas. Las solicitudes y la asignación a líderes tienen evidencia de revisión real con registros temporales retirados.
- 47 regresiones de interfaz aprobadas después de actualizar dependencias: responsividad, foco, ventanas, formularios, edición/preview/guardado del blog y sanitización de artículos. Build correcto y lint sin errores, con los 20 avisos anteriores.
- El análisis npm pasó de 12 avisos de producción (uno crítico, nueve altos y dos moderados) a cero avisos en todas las dependencias, incluidas las herramientas de compilación. No se usó `npm audit fix --force`. Esto no sustituye una auditoría de seguridad integral de código, Go, infraestructura o datos.
- Se comprobaron las dos fotos de cada departamento en Vercel y Render: 40 verificaciones de imagen completa y resolución, sin excepciones de ejecución. Las 26 URLs publicadas respondieron HTTP 200 y tipo WebP.

## Pendientes del cierre formal

| Prioridad | Pendiente | Evidencia y criterio de cierre |
| --- | --- | --- |
| Antes de habilitar cobros | Clasificar y retirar de exposición pública los archivos antiguos de la carpeta de comprobantes | Tres objetos legados respondieron HTTP 200 a HEAD. No se abrieron ni descargaron sus contenidos y no se afirma que todos contengan datos reales. Revisar referencias, respaldar/migrar los que correspondan y verificar que dejen de ser públicos. El nuevo flujo privado ya existe; no revoca URLs antiguas. |
| Bloqueante para flujos por correo | Confirmar remitente/dominio, configuración y entrega transaccional | La evidencia actual no certifica entrega real de registro/verificación, recuperación ni cancelación. Probar con un buzón controlado y enlaces hacia el frontend definitivo, sin enviar mensajes a usuarios reales. |
| Antes del lanzamiento público sostenido | Cerrar alojamiento y presupuesto operativo | La configuración versionada usa Render Free. Este plan duerme tras 15 minutos sin tráfico y su despertar tarda aproximadamente un minuto; Render desaconseja usarlo en producción. No se compró ningún plan. El pool de Supabase comparte un límite de cuatro conexiones y ya se observó un fallo al coexistir despliegue y servidor local. Definir capacidad y un procedimiento de despliegue con margen. |
| Antes de declarar los datos definitivos | Separar datos de demostración y decidir el historial canónico | El schema `cdr_render_qa` contiene el contenido real importado, además de dos cuentas QA y cuatro eventos demostrativos solicitados. El historial financiero, reportes y solicitudes del origen no se migraron. Aprobar/archivar ejemplos y definir qué historial se conserva activo. No se modificó ni borró ese historial. |
| Antes del cierre operativo | Respaldos periódicos, restauración, monitoreo y carga técnica | Hay snapshots manuales privados y copia previa de las fotos. No se acreditó aquí una restauración completa ni una estrategia periódica externa. Tampoco se certificó capacidad para mil usuarios simultáneos. Realizar carga sintética con un objetivo de concurrencia realista y un ensayo de recuperación. |

El trabajo restante se concentra en seguridad histórica, integraciones y operación. Publicar una interfaz no equivale a haber cerrado esos puntos. No se realizaron transferencias, envíos de correo a terceros, eliminación de objetos, ampliación de permisos ni contrataciones.

## Referencias oficiales de operación

Las limitaciones del plan gratuito se verificaron en [Render: Deploy for Free](https://render.com/docs/free). Para respaldo y recuperación, [Supabase: Database Backups](https://supabase.com/docs/guides/platform/backups) recomienda exportaciones periódicas fuera del servicio para proyectos Free; los respaldos de base de datos no incluyen los objetos de storage. La clasificación de archivos de R2 necesita su propio control.

La evidencia de los archivos legados contiene sólo estados y tamaños, sin enlaces de comprobantes ni contenidos (`legacy-public-object-check.json`). La selección visual y sus fuentes están en `SELECCION_FOTOGRAFICA.md` y `seleccion-fotografica.json`; el análisis de dependencias en `dependency-security.json`.

## Publicación verificada

La versión `fd06c26` quedó READY en Vercel y Live en Render Static (`dep-dbi1o93bc2fs739rts70`). Las dos vistas publicadas respondieron HTTP 200 y mostraron la fotografía administrada de Multimedia completa, con 1440 × 2560 px, sin desbordamiento a 390 px ni excepciones de JavaScript. El backend no necesitó otro despliegue y su health respondió HTTP 200. Identificadores y comprobaciones en `photo-deployment.json`.
