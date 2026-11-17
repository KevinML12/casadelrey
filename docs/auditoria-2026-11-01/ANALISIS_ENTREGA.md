# Análisis de entrega — 1 de noviembre de 2026

## Dictamen

El proyecto tiene sus módulos principales implementados, contenido publicado y una interfaz coherente con la dirección visual acordada. Sin embargo, **todavía requiere un cierre técnico antes de anunciar producción sostenida con pagos**. La evaluación anterior de «sólo faltan decisiones externas» era demasiado optimista: esta revisión encontró dependencias con avisos vigentes y reglas de negocio que las pruebas existentes no cubrían.

La revisión no modificó cuentas, datos bancarios, pagos, inscripciones o permisos de producción. No envió correos ni realizó transferencias. Se consultaron recursos públicos, GitHub y agregados de usuarios mediante una transacción explícitamente de sólo lectura. Los casos adversos se reprodujeron en SQLite en memoria y almacenamiento simulado. Este informe y sus evidencias quedan locales; no se publicaron cambios en GitHub o en los servicios.

## Evidencia y límites de la revisión

| Comprobación | Resultado | Límite |
| --- | --- | --- |
| Pruebas del backend | 338 pruebas y subpruebas correctas; `go vet` correcto | Dos casos omitidos: previsualización manual de plantillas y concurrencia PostgreSQL que exige una base local desechable. No se ejecutó esa concurrencia nuevamente en esta revisión. |
| Interfaz con API interceptada | 48 pruebas correctas | Visores, pagos, corrección, administración, foco y anchuras de 320 a 1920 px; no equivale a ejecutar 48 operaciones reales en producción. |
| Navegación publicada | Dos pruebas en Vercel y dos en Render, a 390 y 1440 px, 18 rutas por prueba | Comprobaciones de renderizado, excepciones y desbordamiento; no certifican cada escritura administrativa. |
| Compilación y lint | Build correcto, cero errores y 18 avisos | Los avisos incluyen dependencias de efectos de React y organización de exportaciones. |
| Disponibilidad y contenido | `/ready` y 12 recursos públicos respondieron 200 | Es una observación puntual, no una garantía de disponibilidad. La primera medición de `/ready` tardó 42,049 s; una posterior, 0,487 s. No se instrumentó la causa exacta de la demora. |
| Medios públicos | 20 fotografías de muestra respondieron 200, entre aproximadamente 110 y 452 KiB | Se revisó visualmente Nosotros y el visor de Galería; no se certificó visualmente cada una de las 495 fotos. |
| Seguridad de dependencias | 20 avisos en una reconstrucción Linux con Go 1.25.12, equivalente a la configuración del Dockerfile | Análisis estático del binario reconstruido; no extracción del binario remoto, explotación ni certificación de penetración. |
| Casos adversos | Seis comportamientos confirmados en aislamiento | Que estas seis sondas pasen significa que reprodujeron los problemas, no que estén corregidos. |
| Respaldos | Las dos últimas ejecuciones programadas de GitHub terminaron correctamente | La restauración íntegra desde R2 ya está documentada en el cierre del mismo día; no se descargaron otra vez todos los respaldos durante este análisis. |

Evidencias: [backend](pruebas-backend.json), [interfaz](interfaz.txt), [Vercel](vercel-publico.txt), [Render](render-publico.txt), [casos adversos](reproducciones.txt), [consultas públicas](consultas-publicas.json), [compilación](build.txt), [lint](lint.txt).

## Correcciones técnicas antes de la entrega

### 1. Actualizar la base de seguridad del backend — prioridad alta

El Dockerfile sigue fijando Go 1.25.12. Se reconstruyó el backend con esa versión, Linux, amd64 y CGO desactivado, y se analizó el binario con `govulncheck`. El resultado fue **20 avisos que el analizador relaciona con símbolos presentes**, en la biblioteca estándar y tres módulos. El análisis inicial del Go 1.26.5 del Mac produjo 21; ese número no se usa como resultado de producción.

Entre las correcciones publicadas están Echo 4.15.3, `golang.org/x/net` 0.62.0 y `golang.org/x/text` 0.41.0. La herramienta de compilación también necesita una versión soportada y parcheada, como Go 1.26.10 o 1.27.3 según la información oficial consultada. Go 1.25 ya quedó fuera del período ordinario de soporte tras Go 1.27.

No son veinte ataques demostrados contra el sitio. Algunas condiciones dependen del protocolo, del proxy o de la entrada alcanzable. El aviso de Echo sobre rutas estáticas, por ejemplo, no demuestra exposición actual de comprobantes: éstos ya están en almacenamiento privado y existe una defensa adicional de rutas. Aun así, hay parches disponibles y este resultado debe cerrarse antes de entregar.

**Cierre verificable:** actualizar versiones compatibles, reconstruir, analizar el artefacto resultante, ejecutar regresiones y publicar backend y utilidad de respaldo con la base corregida.

Fuentes: [avisos del binario](vulnerabilidades-backend.txt), [Echo](https://pkg.go.dev/vuln/GO-2026-6293), [parser HTML](https://pkg.go.dev/vuln/GO-2026-6860), [política y versiones de Go](https://go.dev/doc/devel/release). Código: `backend/Dockerfile:10`, `backend/go.mod`.

### 2. Completar las reglas de eventos y cupos — prioridad alta para eventos con cobro

Se reprodujeron tres comportamientos:

- La API permite guardar un evento con fecha inválida, precio negativo y capacidad negativa. El frontend aplica algunas restricciones, pero el servidor sólo exige título al crear. Una modificación también necesita validación consistente.
- Un evento activo del año 2000 acepta una inscripción por API. La interfaz sí oculta la acción en eventos pasados; la regla falta en el servidor.
- Un pago rechazado sigue ocupando cupo. En el ensayo, un evento de un solo lugar continuó lleno después del rechazo. No hay vencimiento automático de reservas pendientes.

El último punto requiere una política explícita de reserva y corrección. No basta con dejar de contar rechazados: al corregir o aprobar después hay que volver a comprobar el cupo bajo bloqueo para evitar sobreventa. Tampoco debe borrarse automáticamente una recepción de dinero o un comprobante.

**Cierre verificable:** validación común de fechas, precio, capacidad y plazo; cierre de inscripciones por fecha en Guatemala; política de reserva/vencimiento; pruebas de concurrencia de inscripción y reaprobación sobre PostgreSQL desechable.

Código: `backend/handlers/events.go:35`, `:86`, `:119`; `backend/handlers/rsvp.handler.go:110`; `backend/handlers/payment_receipt.handler.go:341`. Evidencia: últimas tres sondas de negocio en [reproducciones](reproducciones.txt).

### 3. Conservar historial completo de decisiones financieras — prioridad alta

La confirmación de una donación presencial guarda al último responsable y la fecha. Al revertir, esos campos se vacían y se incrementa la revisión, pero no se añade una entrada a `activity_logs`. Se reprodujo confirmar y revertir: revisión dos, sin historial de actores. Los comprobantes también sobrescriben o limpian la última decisión al cambiar de estado.

La cola de correos conserva información parcial de cambios, pero no reemplaza un historial financiero que identifique responsable, fecha, estado anterior, nuevo estado y motivo. Los mensajes del servidor tampoco ofrecen ese historial completo al administrador.

**Cierre verificable:** registro histórico anexado dentro de la misma transacción de cada aprobación, rechazo, reversión y recepción presencial; consulta desde el panel; prueba de que una corrección no borra decisiones anteriores.

Código: `backend/handlers/donation.handler.go:242`, `backend/handlers/payment_receipt.handler.go:319`, `backend/handlers/activity_log.handler.go:50`.

### 4. Asegurar límites frente a automatizaciones y cargas abandonadas — prioridad alta antes de difusión amplia

Hay límites por IP, tamaño máximo de archivo, comprobación de MIME y almacenamiento privado; son protecciones reales. Sin embargo:

- Los limitadores usan `RealIP()` sin un extractor de proxies confiables configurado en la aplicación. En una prueba local, cambiar `X-Forwarded-For` permitió ocho solicitudes donde una identidad fija quedó limitada a cinco. **No se comprobó si Render sanea esa cabecera de forma suficiente**; no se presenta como evasión remota demostrada.
- Registro de donaciones y RSVP dependen del límite global de 50 solicitudes por segundo por IP, sin un límite específico de escritura comparable al de otros formularios.
- El upload público guarda el archivo antes de vincularlo a un envío. No se encontró una política para retirar cargas abandonadas ni una cuota agregada de almacenamiento. Abandonar el formulario deja un objeto que también se incorporará a respaldos posteriores.

**Cierre verificable:** identificar al cliente a través de la cadena real de proxies; límites por tipo de operación y destinatario; cuotas controladas de carga; registro temporal y limpieza segura de objetos sin referencia. Si se incorpora una verificación antiabuso, debe mantener una alternativa accesible.

Código: `backend/main.go:72`, `backend/middleware/rate_limit.go:86`, `backend/routes/routes.go:165`, `backend/handlers/upload.handler.go:131`. [Guía oficial de Echo](https://echo.labstack.com/guide/ip-address/).

### 5. Proteger administración y completar el cierre de sesión — prioridad media

La autorización del servidor consulta permisos vivos, valida la versión de sesión y revoca acceso al cambiar rol o contraseña. El autorregistro está desactivado. Sin embargo:

- El último administrador puede cambiar su propio rol y dejar el sistema sin administrador. La sonda confirmó respuesta 200 y cero administradores restantes. Hoy siguen existiendo cuatro administradores; no se alteraron.
- «Cerrar sesión» elimina tokens del navegador, pero no existe una operación de salida que invalide el refresh token en el servidor. Una copia previa puede seguir siendo válida hasta su vencimiento o revocación por otro mecanismo.
- Los tokens de sesión y renovación están en `localStorage`. La combinación con ausencia de CSP merece endurecimiento. No se encontró ni explotó un XSS en esta revisión; el contenido enriquecido público usa DOMPurify.
- La política mínima de contraseña sigue siendo seis caracteres y no hay segundo factor en el panel. Fortalecer contraseñas es un cierre razonable; un segundo factor puede planificarse según el alcance y la operación acordados.

**Cierre verificable:** proteger transaccionalmente al último administrador, revocar la renovación al salir y comprobar contraseñas y sesiones sin cambiar credenciales institucionales automáticamente.

Código: `backend/handlers/admin.go:188`, `frontend/src/context/AuthContext.jsx:48`, `backend/routes/routes.go:140`, `backend/auth/auth.service.go:44`.

### 6. Hacer repetible y controlada la publicación — prioridad media

GitHub confirmó que `main` no tiene protección clásica ni rulesets. El único workflow del repositorio es el de respaldos; no hay una barrera de pruebas, compilación o análisis de seguridad para cada cambio. El estado correcto de Vercel certifica su compilación, no las reglas financieras anteriores.

El backend y el frontend de Render tienen despliegue automático desactivado. Es una configuración válida para publicar manualmente, pero un push a Git no actualiza por sí solo los tres servicios. Es necesario un procedimiento con versiones verificadas, prueba posterior y reversión.

Además, **los dos frontends usan el mismo backend y los mismos recursos activos**. Render Static no es un entorno de datos independiente. Los ensayos de escritura deben usar una copia local o recursos realmente separados; el nombre «pruebas» no los aísla.

**Cierre verificable:** CI sin secretos para pruebas y análisis, protección de la rama con comprobaciones exigidas y procedimiento de publicación coordinada. No hace falta contratar otro servidor sólo para ensayos: ya se dispone de herramientas para copias locales desechables.

Evidencia: [GitHub](github.json), `.github/workflows/recovery-backup.yml`, `render.yaml:13` y `:49`, `frontend/vercel.json`.

## Pendientes de contenido y experiencia administrativa

La API publicó 16 células, cinco categorías, diez departamentos, cinco destinos de donación, 495 fotos y 36 posiciones fotográficas configuradas. No faltan esos módulos ni están sustituidos por una lista ficticia en el frontend.

Hay dos excepciones a la aspiración de «todo administrable» que conviene terminar:

1. **Voluntariado:** nombres, textos, orden y visibilidad proceden de la API, pero los intereses que usa el filtro/cuestionario están en el mapa `DEPT_MATCH`. Un departamento nuevo aparece en el recorrido, pero no participa automáticamente en recomendaciones ni en esos filtros. Añadir etiquetas administrables o derivarlas de un recurso editable. Código: `frontend/src/pages/public/VolunteeringPage.jsx:56`.
2. **Galería:** se pueden editar fotos y orden, pero el formulario exige una URL. No ofrece subida directa desde el dispositivo ni selección de álbum como entidad: agrupa por la convención del título «Álbum - Foto». Para personal no técnico, falta subir una o varias fotos y elegir el álbum con controles claros. Código: `frontend/src/pages/admin/AdminGallery.jsx:31`, `frontend/src/lib/feed.js:46`.

En el contenido actual, los siete eventos publicados tienen fechas pasadas y tres no tienen portada propia. La interfaz los trata como pasados y utiliza el fondo de respaldo cuando falta la foto. No se deben inventar convocatorias para llenar la pantalla: la iglesia tiene que publicar su siguiente actividad y escoger fotografías correspondientes. El enlace de reproducción del podcast está vacío; se conservan nombre y horario, sin inventar un destino. Hay cero FAQs, lo cual no bloquea la entrega si no desean publicar preguntas.

El visor real de Galería muestra la foto nítida dentro del panel y también en el fondo, con navegación y cierre accesibles en móvil. Las pruebas de interfaz y la revisión visual sostienen conservar esa dirección de diseño. **No recomiendo otra remodelación general del frontend para cerrar esta entrega.**

## Correo, capacidad y recursos externos

### Correo: la cuota importa además del dominio

La cola transaccional está implementada, cifrada y distingue «aceptado por proveedor» de entrega incierta. No hay un webhook propio que certifique entrega o rebote desde la aplicación; se consulta Brevo para ese detalle.

La aplicación limita las emisiones a **250 por 24 horas**, dentro del plan gratuito de Brevo de **300 diarios**. Los avisos ordinarios vencen por defecto a las 24 horas. Por tanto, un pico de mil inscripciones o donaciones que necesiten correo no puede recibir mil notificaciones el mismo día con esta configuración; las pendientes pueden vencer. Mil visitantes que sólo consultan el sitio no generan ese mismo volumen de correos.

Antes del lanzamiento se debe acordar el volumen esperado de operaciones, la duración de la cola y cómo se atienden mensajes vencidos. El dominio y la autenticación del remitente mejoran la entrega, pero no aumentan por sí solos la cuota. La comprobación anterior con Outlook llegó a No deseado; no se garantiza bandeja principal.

Fuentes: `backend/email/email.service.go:136`, `:247`, [límites oficiales de Brevo](https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan).

### Accesos institucionales

La consulta de sólo lectura encontró 29 cuentas activas: cuatro administradores, 22 líderes, un miembro y dos voluntarios. Veintiocho direcciones usan el dominio heredado; no se ha confirmado que la iglesia controle esas bandejas. **La recuperación de contraseña depende del correo guardado**, de modo que la validación de responsables y direcciones es parte necesaria de la entrega.

Ninguna cuenta activa coincidió con la contraseña fija del antiguo script de usuarios comprobado. Esto sólo descarta ese valor específico; no acredita fortaleza de todas las contraseñas ni control de todos los buzones. No se publican hashes, direcciones individuales ni credenciales. El script antiguo debe retirarse o protegerse para impedir nuevas cuentas con credenciales fijas.

### Alojamiento y medios

El backend permanece en Render Free. [Render documenta suspensión tras 15 minutos sin tráfico](https://render.com/docs/free), con demora para volver a atender. La primera comprobación lenta observada es compatible con esa limitación, aunque no identifica su causa por sí sola. Para prometer atención continua se necesita confirmar un plan sin esa suspensión.

Las fotos públicas usan `r2.dev`; [Cloudflare lo reserva a desarrollo y lo limita](https://developers.cloudflare.com/r2/buckets/public-buckets/). Hace falta el dominio de medios para un lanzamiento sostenido. La muestra revisada no presenta un problema general de fotografías excesivamente pesadas: las veinte imágenes comprobadas respondieron correctamente y no superaron 463 kB.

Los comprobantes permanecen privados. Dominio propio, autenticación del remitente, contactos y datos bancarios oficiales son decisiones del titular. Los cuatro campos bancarios siguen vacíos en la API: no se publicará una cuenta deducida de ejemplos antiguos.

### Respaldos y operación

La [última ejecución diaria](https://github.com/KevinML12/casadelrey/actions/runs/41322321286) y la anterior terminaron correctamente. La recuperación íntegra desde R2 ya comprobó ambas bases y 749 referencias de archivos. No falta implementar otro sistema de respaldos.

Falta asignar responsable de revisar antigüedad y fallos, custodiar una copia institucional de la clave y acordar retención. El esquema actual no elimina respaldos antiguos automáticamente; el almacenamiento puede crecer. [GitHub puede retrasar la programación y desactivarla tras 60 días de inactividad de un repositorio público](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

No se certificó en esta revisión una alerta externa de caída o de cola de correo atascada. Sentry tiene integración condicional en código, pero eso no prueba que sus credenciales, alertas y destinatarios estén configurados. También debe acordarse el acceso a peticiones privadas, comprobantes y fotografías y su conservación.

El retiro definitivo de Fly sigue sujeto al bloqueo de facturación documentado: su último estado comprobado dejó las dos máquinas detenidas, pero el proveedor impidió retirar el arranque automático. Los frontends actuales utilizan Render; no requieren Fly para funcionar.

## Mantenimiento posterior y límites no bloqueantes

- `npm audit` devuelve siete avisos moderados relacionados con un único aviso subyacente de minimatch; cinco aparecen incluso en el árbol `--omit=dev` porque Recharts arrastra una herramienta de lint. No se encontró esa herramienta en los bundles generados ni una ruta de patrones aportados por visitantes. La aplicabilidad exacta a minimatch 3.1.5 necesita contrastarse con el aviso, que describe el algoritmo de otra versión; no se presenta como un ataque público demostrado. No forzar una versión mayor indiscriminadamente. [Evidencia](dependencias-frontend.json), [aviso](https://github.com/advisories/GHSA-g3hv-75wg-m249).
- Ambos sitios carecen de CSP y protección explícita contra incrustación; Vercel también carece de `nosniff` y `Referrer-Policy` explícitos. Render sí entrega estos dos últimos. HSTS está presente en ambos. Introducir políticas probadas, primero observables cuando proceda, sin romper imágenes, correo o APIs. Evidencia: [cabeceras](consultas-publicas.json).
- Revisar los 18 avisos de lint y los fallos de carga del panel: por ejemplo, la galería administrativa sólo escribe el error de carga en consola. Un error no debe parecer una colección vacía.
- Las vistas previas al compartir eventos o artículos usan metadatos Open Graph generales del HTML inicial; cambiar el título con JavaScript no genera por sí solo una tarjeta social por registro. Es una mejora de difusión, no un bloqueo del flujo de transferencias.
- La galería carga todas las páginas de metadatos para agrupar álbumes. Hoy son tres páginas y 495 fotos; si crece mucho, conviene una API de álbumes y carga por álbum. No se descarga cada imagen por el mero hecho de cargar esos metadatos.
- Migraciones versionadas, tiempos de espera del servidor y del acceso a datos, escaneo de la imagen final y prueba con navegadores reales adicionales son endurecimientos recomendables. No están certificados por el resultado de Chromium ni por el escáner de dependencias de Go.

## Orden concreto para cerrar

1. Corregir dependencias y compilador; validar eventos, cupos y trazabilidad financiera; cerrar límites de escritura y última cuenta administrativa.
2. Añadir las regresiones de los casos encontrados, ejecutar la concurrencia sobre PostgreSQL aislado y establecer CI y procedimiento de publicación.
3. Terminar las etiquetas administrables de voluntariado y la subida directa a Galería; revisar errores visibles del panel.
4. Confirmar correos y responsables, cuenta bancaria y contactos; publicar sólo contenido institucional confirmado.
5. Decidir alojamiento continuo, dominio y volumen de correo; configurar medios, remitente y supervisión dentro del presupuesto aprobado.
6. Realizar capacitación y aceptación controlada: publicar/ocultar contenido, solicitud de célula, inscripción, revisión/rechazo/corrección de comprobante, recepción presencial y recuperación de acceso.

Cobros con tarjeta y devoluciones automáticas requieren una integración comercial adicional si forman parte del alcance acordado. El flujo actual es transferencia o entrega presencial con revisión administrativa. No son un requisito implícito para entregar esa modalidad.

**Criterio de cierre:** problemas de prioridad alta corregidos y verificados, configuración institucional confirmada, límites de alojamiento/correo aceptados y responsables capacitados. El proyecto está avanzado; su siguiente paso es este cierre acotado, sin añadir nuevos módulos ni otra remodelación visual general.
