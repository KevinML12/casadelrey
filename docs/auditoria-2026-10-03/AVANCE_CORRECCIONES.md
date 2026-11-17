# Correcciones: validación local

Fecha: 4 de octubre de 2026. Actualización: 7 de octubre de 2026, America/Guatemala.

Se retomaron los cambios locales de la sesión interrumpida. Se corrigieron dos selectores desactualizados de la prueba de donaciones y espacios finales en archivos modificados. Después se implementó protección ante reintentos y envíos simultáneos de donaciones. Se conservaron los cambios anteriores y no se desplegó ni se accedió a bases de producción.

## Evidencia actual

| Comprobación | Resultado | Alcance |
|---|---|---|
| `go test -count=1 ./...` desde backend | Aprobado | Todos los paquetes; router con SQLite en memoria y storage falso. |
| `go vet ./...` desde backend | Aprobado | Revisión estática Go. |
| `go test -race ./routes -run 'TestSecurityRegression_Donation'` | Aprobado | Regresiones financieras con detector de carreras. |
| `npm run lint` desde frontend | 0 errores, 20 advertencias | Advertencias de hooks, Fast Refresh y un comentario de supresión sin uso. |
| `npm run build` desde frontend | Aprobado | Persiste aviso de bundle principal superior a 500 kB. |
| `PW_BASE_URL=http://127.0.0.1:5173 npx playwright test e2e/audit-fixes.spec.js` | 6 de 6 aprobadas | Chromium escritorio, API interceptada y hosts externos bloqueados. |
| `go test -race ./storage ./routes -run 'Receipt\|Donation'` | Aprobado | Pruebas de comprobantes y donaciones con detector de carreras. |
| `git diff --check` | Aprobado | Sin espacios finales en el diff. |

El servidor de las pruebas se inició con `VITE_API_URL=http://127.0.0.1:18080 VITE_SENTRY_DSN= npm run dev -- --host 127.0.0.1 --port 5173`. La salida de UI está en `fixes-ui-tests.txt`; la compilación está en `fixes-build.txt`.

## Correcciones existentes cubiertas por regresión

`backend/routes/security_regression_test.go` comprueba rechazo de IDs manipulados, privacidad de autores, revocación por cambio de rol/eliminación de cuenta/reset/cambio de contraseña, rotación de refresh de un solo uso y rechazo del hash almacenado como credencial. También comprueba autoservicio del voluntario y aprobación administrativa, importe/moneda/propósito/reutilización de boletas, verificación y reversión transaccional de donaciones, rollback ante fallo de DB, cancelación con credencial y rechazo de imágenes falsas.

`frontend/e2e/audit-fixes.spec.js` comprueba la ruta enviada por correo para reset y su payload, foco/Escape/retorno al disparador en el modal, envío del reporte del voluntario, donación y comprobante en una única petición, actualización de cuenta tras refresh y ausencia de Authorization obsoleto tras salir.

## Reintentos de donaciones — validado local

Antes, repetir un POST podía crear otra donación y otro comprobante. Ahora `POST /api/v1/donations/register` requiere `Idempotency-Key` (16–128 caracteres alfanuméricos, guion o guion bajo). El frontend genera una UUID aleatoria, conserva la clave y el digest del formulario en sessionStorage para reintentos y recargas, y bloquea envíos simultáneos. No guarda datos personales en ese estado. Cambiar los datos o pulsar «Hacer otra donación» genera una operación nueva.

La base guarda el hash de la clave en una columna con índice único. La inserción utiliza `ON CONFLICT DO NOTHING` dentro de la misma transacción que crea el comprobante. Si ya existe, solo devuelve su ID cuando coincide el digest de los datos y el registro no está eliminado. El backend permite el encabezado en CORS.

| Caso | Respuesta |
|---|---|
| Primer envío válido | 201 y nuevo ID |
| Reintento con la misma clave y los mismos datos | 200 y el mismo ID, sin nuevas filas |
| Misma clave con otros datos o registro eliminado | 409, sin nuevas filas |
| Clave ausente o inválida | 400 |
| Fallo al crear el comprobante | 500; rollback de donación y clave, permitiendo reintentar |

Las regresiones incluyen ocho solicitudes concurrentes (una creación, siete respuestas de repetición, una donación y un comprobante), conflicto por cambio de monto, clave inválida/ausente, nueva donación deliberada y rollback. La prueba UI simula un fallo 503 y comprueba que el segundo envío conserve tanto la clave como el payload; también verifica que «Hacer otra donación» limpie el estado del envío anterior.

Archivos: `backend/models/donation.go`, `backend/handlers/donation.handler.go`, `backend/main.go`, `backend/handlers/donation_handler_test.go`, `backend/routes/security_regression_test.go`, `frontend/src/components/sections/DonationCard.jsx` y `frontend/e2e/audit-fixes.spec.js`.

La migración automática añade `idempotency_key` nullable y `request_hash`, sin deduplicar ni reclasificar registros históricos. Antes de publicar, verificarla sobre una copia PostgreSQL y coordinar frontend/backend: clientes antiguos que no envíen la clave recibirán 400. PostgreSQL no pudo probarse aquí: no hay herramientas de servidor locales y el daemon Docker no está activo. La prueba concurrente usa SQLite con una sola conexión y no sustituye la comprobación de bloqueos en PostgreSQL. La clave distingue operaciones; no detecta una boleta bancaria reutilizada mediante claves distintas.

## Comprobantes privados — validado local, 7 de octubre

Antes, las boletas se subían al storage público y el panel las abría mediante una URL directa. Los archivos nuevos ahora se suben por `ReceiptStore`, separado de las imágenes públicas. Localmente se guardan en `uploads-private`, fuera de `/uploads`, con permisos 0700 para la carpeta y 0600 para los archivos; `os.OpenRoot` impide que una ruta o un symlink escape del directorio. En R2 se exige `CF_R2_PRIVATE_BUCKET`, distinto del bucket público. Si falta, se rechaza la operación; no existe fallback a subida pública.

La API de upload devuelve una referencia opaca `receipt-private:<uuid>.<ext>`, con nombre aleatorio que no contiene el nombre original del archivo. Los formularios guardan esa referencia y muestran una vista previa local del archivo seleccionado. Las altas de comprobantes rechazan URLs externas y rutas manipuladas.

`GET /api/v1/admin/receipts/:id/file` consulta el registro y transmite sus bytes desde storage tras validar sesión vigente y rol admin. Anónimo recibe 401; miembro, líder y voluntario reciben 403. La respuesta tiene `Cache-Control: private, no-store`, `nosniff` y un nombre controlado. No se crean URLs públicas, enlaces firmados reutilizables ni tokens en parámetros URL. El panel usa Authorization para descargar el archivo, muestra una URL blob local y la revoca al desmontarse; admite imágenes y enlaces a PDF.

Las URLs históricas no se consultan ni se redirigen. El endpoint devuelve 409 y el panel indica «Comprobante pendiente de migración». También se bloqueó `/uploads/comprobantes`, incluidos rutas normalizadas y nombres codificados, para impedir servir boletas locales antiguas. Esto no revoca las URLs del bucket público de R2 que ya existían.

Pruebas: permisos negativos, revocación de sesión admin, respuestas sin caché, IDs inexistentes, rechazo de URL externa sin fetch, bloqueo del static histórico, falta de private storage sin fallback, roundtrip local fuera del directorio público, permisos de archivo, prevención de sobrescritura/traversal/symlinks, rechazo de R2 sin bucket separado y llamadas SDK PUT/GET al bucket privado mediante un servidor HTTP simulado. UI: preview blob del donante y apertura del comprobante con Authorization y blob local en admin. La suite completa Go, vet, detector de carreras, build, lint sin errores y seis pruebas UI aprobaron.

Archivos principales: `backend/storage/receipts.go`, `backend/storage/receipts_test.go`, `backend/storage/storage.go`, `backend/handlers/upload.handler.go`, `backend/handlers/payment_receipt.handler.go`, `backend/handlers/donation.handler.go`, `backend/routes/routes.go`, `frontend/src/hooks/useFilePreview.js`, `frontend/src/components/sections/ReceiptFile.jsx`, los dos formularios públicos y `frontend/src/pages/admin/AdminReceipts.jsx`.

**Antes del despliegue:** seguir [COMPROBANTES_PRIVADOS.md](COMPROBANTES_PRIVADOS.md). Configurar y verificar un bucket R2 sin acceso público, preparar persistencia local cuando aplique, migrar registros/objetos históricos y revocar sus URLs públicas. Publicar backend y frontend de forma coordinada: el contrato de subida ya no devuelve una URL navegable. No se ejecutó ninguna operación en R2 ni en una base real durante estas pruebas.

## Trabajo pendiente

- Probar concurrencia y migración con PostgreSQL de pruebas; SQLite no verifica los bloqueos de filas de producción.
- Completar tratamiento trazable de datos históricos y detección de boletas reutilizadas en operaciones distintas; validar idempotencia y migración en PostgreSQL/staging.
- Configurar/verificar el bucket privado real y migrar boletas históricas, retirándolas del storage público. La separación y descarga autenticada para archivos nuevos ya están comprobadas localmente.
- Completar permisos por registro/asignación y escenarios negativos restantes de la matriz de roles.
- Verificar entrega real de correos y cancelación/reset de extremo a extremo en staging con cuentas sintéticas.
- Completar estados de error, caché por audiencia, metadatos OG, sistema visual, móvil y navegadores adicionales.
- Optimizar imágenes/bundles y atender las advertencias de hooks según sus dependencias y comportamiento.

El primer bloque tiene evidencia local. La auditoría completa y la preparación para producción siguen en curso.
