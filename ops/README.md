# Operación y recuperación

Las utilidades se ejecutan fuera de la API. No hay endpoint público de respaldo, restauración o limpieza. Los secretos y las copias descifradas nunca se guardan en este repositorio público.

## Entorno privado

La instalación local usa `~/.local/share/casadelrey-operations/`, con directorio 0700, `environment.json` 0600 y una clave independiente `backup.key` de 32 bytes, 0600. Se compilan allí `backend/cmd/maintenance`, `backend/cmd/loadtest` y el backend usado para ensayos aislados. Las claves reales se suministran por entorno, no por argumentos ni por Git.

La clave de respaldo usa AES-256-GCM y no depende de `JWT_SECRET`. Conservar una copia de recuperación de esta clave en un lugar institucional seguro y separado. Perder todas sus copias impide descifrar los respaldos. Los archivos y las bases tienen copias cifradas en el bucket privado R2 y copias locales. Los nombres, relaciones, hashes e inventarios se encuentran en manifiestos cifrados, no en evidencias públicas.

## Respaldo

Desde la raíz del proyecto:

```sh
python3 ops/recovery.py backup --active-only --storage
```

Sin `--active-only` se incluye también el historial original y sus dependencias de autenticación. El historial no se mezcla automáticamente con los totales actuales. La copia completa original y el estado posterior al saneamiento se conservaron.

La base se exporta en formato PostgreSQL custom. Cada dump se descifra y compara antes de confirmar su subida privada. Los objetos se cifran por contenido y se deduplican; se verifica el manifiesto remoto y no se sobrescriben snapshots existentes. En ejecuciones incrementales se comprueba la integridad de los objetos locales y sus metadatos de origen. No se eliminan copias antiguas automáticamente; revisar almacenamiento y retención con el responsable institucional.

El inventario de filas se obtiene del mismo snapshot exportado, evitando diferencias si entran registros durante el respaldo. La instalación local usa `BACKUP_DATABASE_URL` con la conexión de mantenimiento existente, separada del rol limitado de la aplicación; esa credencial administrativa no se ha entregado a GitHub. El ensayo final restauró las dos bases y comprobó los 749 objetos actuales desde las copias cifradas locales. Las subidas de bases y manifiestos se descargan de R2 para compararlas; los blobs de archivos tienen comprobación remota de tamaño y validación criptográfica local, no un ensayo de descarga integral desde R2.

La automatización local de Codex, `respaldos-diarios-de-casa-del-rey`, quedó **pausada** después de comprobar el ejecutor de GitHub. Se conserva como alternativa manual; no se ejecutan dos tareas diarias duplicadas. Las copias locales existentes permanecen disponibles.

## Respaldo diario en GitHub

`.github/workflows/recovery-backup.yml` está activo en la rama principal, diariamente a las **03:00 de Guatemala (09:00 UTC)** y también de forma manual desde Actions. Funciona con el Mac apagado. Usa checkout fijado a un commit, permisos de lectura del repositorio, una ejecución a la vez y clientes PostgreSQL 18 en contenedores desechables. No publica dumps, archivos, claves o manifiestos descifrados como artifacts.

El titular autorizó guardar en secretos de **este repositorio** la conexión de la cuenta dedicada `cdr_backup_readonly`, las claves R2 y la clave independiente de cifrado. La conexión administrativa del historial no fue compartida. Se comprobó lectura de las 28 tablas activas, cero tablas modificables, cero tablas ajenas accesibles, cero permisos de creación en schemas de usuario y cero funciones privilegiadas accesibles. La cuenta no administra roles o bases, no omite RLS y tiene una conexión máxima. Los permisos de lectura de futuras tablas y secuencias están definidos para el propietario actual de las migraciones; revisarlos si cambia ese propietario.

La [primera ejecución real](https://github.com/KevinML12/casadelrey/actions/runs/41165501659) terminó correctamente: 28 tablas activas y 749 archivos, con base y manifiestos remotos descargados y comparados. Sólo después se habilitó el horario diario. La operación usa `--active-only`: el historial original permanece en su archivo cifrado separado. La publicación del workflow utilizó la conexión GitHub ya autorizada para el repositorio, sin ampliar los permisos del token de la terminal.

El responsable debe revisar Actions, confirmar una copia reciente en R2 y atender los fallos. GitHub puede retrasar las ejecuciones programadas y desactiva los horarios de repositorios públicos después de 60 días sin actividad; [reglas oficiales](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule). Si ocurre, reactivar el workflow, ejecutar manualmente y comprobar el resultado. La programación no sustituye esa supervisión ni un ensayo periódico de recuperación.

## Ensayo de restauración

```sh
python3 ops/recovery.py restore-check
```

El programa crea un PostgreSQL local desechable, con contraseña aleatoria, ligado a loopback. No acepta una URL remota de destino ni sobrescribe una base de producción. Restaura las tablas y dependencias, compara inventarios y restricciones y descifra todos los objetos de la última copia para comparar tamaño y SHA-256. El servidor y sus archivos temporales se retiran al terminar.

Para un incidente real, preparar un destino nuevo, recuperar el dump y manifiesto desde almacenamiento privado y conservar los servicios anteriores hasta validar las cuentas, datos y archivos recuperados. No servir un dump antes de comprobar accesos y sesiones. Mantener protegidas las claves de aplicación de Render que sean necesarias para datos cifrados dentro de la base.

**No restaurar comprobantes a almacenamiento público.** Los snapshots anteriores al saneamiento pueden registrar sus ubicaciones históricas; el plan privado `legacy-plan.json.aes` conserva la correspondencia con sus referencias privadas. La copia posterior al saneamiento registra únicamente los archivos actuales. Las URLs públicas antiguas fueron retiradas, conservando copias verificadas y recuperables.

## Limpieza controlada

`ops/closeout.py` presenta un plan por defecto. `--apply` exige una acción expresa. Sólo archiva los cuatro eventos identificados en el manifiesto de demostración y las dos cuentas controladas que se le proporcionen; verifica que queden administradores institucionales. No oculta eventos con inscripciones o comprobantes. Los originales se conservan cifrados y no se borran filas financieras. El saneamiento de archivos verifica las copias antes de retirar los originales públicos.

También se archivó una donación y su comprobante pendientes, identificados inequívocamente como registros sintéticos no recibidos. La operación comprobó sus marcadores y estados dentro de una transacción y conservó los originales cifrados. No se modificaron recepciones verificadas ni montos reales.

## Disponibilidad y capacidad

- `/health`: proceso activo. No se bloquea por el limitador de tráfico.
- `/ready`: conexión a PostgreSQL disponible en un plazo de dos segundos; no devuelve credenciales ni detalles de la base. Render y el healthcheck del contenedor utilizan esta comprobación.
- La caché pública sólo cubre rutas explícitas, lectores anónimos y respuestas JSON correctas. Tiene límite de memoria y agrupa lecturas simultáneas. Las operaciones de escritura correctas la invalidan. Las respuestas autenticadas y los errores no se comparten.
- Producción exige R2 configurado y un bucket de comprobantes separado. Una configuración incompleta impide arrancar; no se cambia silenciosamente a disco efímero.
- Liberar el backend local antes de desplegar o realizar operaciones remotas que necesiten la conexión disponible del rol activo. Mantener el pool de Render en tres conexiones; la cuenta local utiliza una.
- El backend antiguo de Fly dejó sus dos máquinas detenidas. Fly rechazó el cambio de arranque automático por la situación de facturación: el retiro remoto definitivo queda pendiente de resolver con el titular/proveedor. El manifiesto histórico está marcado como retirado; no desplegarlo. Los frontends publicados y la configuración local de producción apuntan a Render.

```sh
python3 ops/load_copy.py
```

Este ensayo usa una copia local, sin claves de correo. Para una medición autorizada del servicio QA, `backend/cmd/loadtest` sólo acepta loopback o el backend QA conocido, lecturas GET, hasta 40 solicitudes por segundo y un máximo de 100 lectores. No crea usuarios, pagos ni correos.

El escenario comprobado fue de 6.000 consultas públicas a 25/s, equivalentes a 1.000 visitas de seis consultas, con hasta 50 lectores y servicio despierto. No mide 1.000 personas simultáneas, navegación autenticada, descargas fotográficas ni arranque en frío. Los resultados locales no son una promesa de rendimiento del alojamiento.

## Recursos que requieren titular

- Contratar/confirmar alojamiento continuo. El backend sigue en Render Free, con suspensión por inactividad; [Render lo distingue de un entorno de producción](https://render.com/docs/free).
- Registrar un dominio y configurar correo autenticado. El proveedor actual está conectado, pero hubo una entrega a No deseado.
- Vincular el dominio propio de medios en Cloudflare. La URL pública actual usa `r2.dev`, [destinada a desarrollo y sujeta a límites](https://developers.cloudflare.com/r2/buckets/public-buckets/#public-development-url).
- Confirmar los datos bancarios oficiales en el panel.
- Para tarjetas: seleccionar y afiliar un proveedor, recibir credenciales sandbox/producción, acordar conciliación y devoluciones y certificar transacciones y webhooks. No se ofrecen cobros con tarjeta sin esa integración.

Los respaldos de la base no cubren por sí solos las imágenes o comprobantes; [Supabase recomienda exportaciones externas para el plan Free](https://supabase.com/docs/guides/platform/backups). Esta implementación incluye ambos tipos de datos, con sus límites operativos descritos arriba.
