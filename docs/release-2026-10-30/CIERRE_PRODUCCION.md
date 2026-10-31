# Cierre técnico de producción — 30 de octubre de 2026

La aplicación conserva Vercel y Render Static como frontends, Render como API y Supabase como base activa. El historial original se conserva separado y cifrado. No se contrataron planes, dominios o procesadores de tarjeta ni se realizaron transferencias.

## Trabajo ejecutado

| Área | Resultado |
| --- | --- |
| Comprobantes históricos | Tres archivos copiados y verificados en privado, tres referencias actualizadas y originales públicos retirados. Se conservaron copias de recuperación; no se publican URLs o contenidos de comprobantes. |
| Respaldo de bases | 28 tablas activas y 28 históricas, con las dependencias de autenticación del origen, exportadas y cifradas con clave independiente. Copias remotas verificadas. |
| Respaldo de archivos | Copia inicial de 752 objetos comprobada íntegramente. La copia posterior al saneamiento registra 749 objetos actuales, sin los tres originales públicos retirados. Deduplicación por contenido y manifiestos cifrados. |
| Recuperación | PostgreSQL aislado y protegido por contraseña; restauración de ambas bases, conteos y restricciones correctos. Descifrado y SHA-256 comprobados para todos los objetos del ensayo. |
| Datos de demostración | Cuatro eventos sin inscripciones ni comprobantes ocultos; dos cuentas QA archivadas, sesiones revocadas y nuevos accesos rechazados. Permanecen cuatro administradores institucionales. Los datos originales se conservaron cifrados. |
| Registros financieros sintéticos | Una donación pendiente y su comprobante, con marcadores inequívocos de QA y sin recepción de dinero, archivados con copia cifrada previa. No se alteraron pagos verificados. |
| Configuración bancaria | Se detectaron cuatro campos con etiquetas de pruebas junto al número importado. Configuración preservada cifrada y número retirado de la vista pública hasta confirmación institucional. El flujo permite coordinar depósitos por contacto. |
| Capacidad | Caché breve y acotada para respuestas públicas, agrupación de lectores concurrentes e invalidación tras cambios. Respuestas privadas y errores excluidos. |
| Disponibilidad | `/ready` comprueba conexión a la base. Healthcheck de contenedor y Render configurados con esa ruta. Producción impide usar almacenamiento efímero cuando falta R2 privado. |
| Retiro de Fly | Las dos máquinas anteriores quedaron detenidas. Fly rechazó deshabilitar su arranque automático por facturación; ese retiro remoto aún debe resolverse. Frontends y configuración de compilación usan Render. |
| Capacitación | [Guía de administración y aceptación](../GUIA_ADMINISTRACION.md), con tareas de la iglesia y verificación de datos oficiales. |

## Medición de carga

| Entorno | Solicitudes | Ritmo | Lectores máximos | Errores | p95 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Copia aislada | 6.000 | 25/s | 50 | 0 | 2,991 ms |
| Render QA despierto | 6.000 | 25/s | 50 | 0 | 608,265 ms |

Equivale a 1.000 visitas de seis consultas públicas; no a 1.000 usuarios simultáneos. No incluye imágenes, cuentas autenticadas o arranque en frío. En Render, p99 fue 1.129,595 ms y el máximo 3.151,475 ms. Las 6.000 respuestas fueron HTTP 200. No se generaron pagos, correos o inscripciones durante la medición.

Las tres verificaciones públicas/roles/módulos pasaron en Vercel y otras tres en Render. Se realizaron antes de retirar las cuentas QA. El backend completo pasó con detector de carreras y `go vet`.

La restauración final comprobó 28 tablas activas (1.653 filas, incluidas las archivadas), 28 históricas (882 filas), las dependencias de autenticación y los 749 archivos actuales. El inventario se toma del snapshot exportado. El ensayo de archivos descifró la copia local completa; no certifica una descarga integral de todos los blobs desde R2. Las bases y los manifiestos remotos sí se descargaron y compararon después de subirlos.

## Automatización y límites abiertos

El respaldo diario local está programado a las 03:00 Guatemala y sólo avisa por fallos; requiere que el Mac y Codex estén disponibles. La plantilla GitHub está preparada en `ops/github-recovery-backup.yml`, sin workflow instalado, cron activo ni secretos compartidos. GitHub rechazó publicar el workflow por faltar ese permiso en la conexión OAuth actual. Sigue pendiente habilitar esa publicación y autorizar las credenciales mínimas del respaldo para dejar la tarea independiente del Mac.

El lanzamiento público sostenido aún requiere decisión de alojamiento, dominio para correo y medios, confirmación bancaria y aceptación de la iglesia. Render Free y `r2.dev` conservan sus limitaciones; la carga medida no elimina esas condiciones. Tarjetas requiere una afiliación y credenciales de procesador que todavía no se proporcionaron.

Las reglas de acceso quedan explícitas: cuentas gestionadas por líderes/administradores, sin autorregistro; envío público de peticiones de oración y consulta restringida al equipo autorizado. El plan histórico de mayo no describe por sí solo el comportamiento actual.

Instrucciones y recuperación: [Operación](../../ops/README.md). No se incluyen claves, manifiestos descifrados, números bancarios ni datos personales en estas evidencias públicas.

Evidencias agregadas: [saneamiento y despliegue](operations/closeout-checks.json), [restauración](operations/restore-check.txt), [carga de Render](operations/load-render.json), [módulos y permisos en Vercel](operations/live-vercel.txt), [módulos y permisos en Render](operations/live-render.txt), [backend](operations/backend-race.txt) y [parser del snapshot](operations/snapshot-tests.txt).
