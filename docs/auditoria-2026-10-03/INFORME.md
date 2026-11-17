# Auditoría de frontend, identidad, QA y seguridad — Casa del Rey

Fecha: 3 de octubre de 2026. Base: commit `01d597d`, incluyendo el estado actual de trabajo. Prioridades: P1 = corregir antes de ampliar funcionalidades; P2 = siguiente ciclo de mejora; P3 = mantenimiento.

**Verificación posterior:** los contratos y controles de API se contrastaron con 31 casos locales del router real. Consultar el [informe conjunto](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/INFORME_CONJUNTO.md) y el [informe backend](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/INFORME_BACKEND.md). Allí se confirma SQL generado por el dialecto PostgreSQL, revocación ausente y controles por registro; no se ejecutaron ataques en PostgreSQL real.

## Dictamen

El proyecto tiene una identidad reconocible y componentes reutilizables, pero **todavía no está estandarizado ni pasa una validación completa de calidad**. La brecha más importante combina seguridad de la API, contratos de formularios, legibilidad y peso de fotografías. No recomiendo comenzar con un rediseño general: primero cerrar los fallos que afectan confianza y uso, después consolidar el lenguaje existente.

La dirección visual que realmente aparece en el código es: congregación y fotografías locales como protagonistas; navy profundo; blanco; cristal translúcido; titulares grandes; botones pill; navegación editorial sin iconos decorativos; paneles claros para trabajo administrativo. La documentación también describe un acento cálido, pero el token actual es blanco. Esa diferencia exige una decisión de marca, no cambiar colores automáticamente.

## Alcance y evidencia

- Lectura de rutas, páginas públicas, administración, líderes, voluntarios, componentes, estilos, formularios, sesiones y contratos de API; revisión del backend que sostiene los flujos sensibles.
- 110 navegaciones con Playwright: 55 escenarios de URL/rol en escritorio 1440×1000 y móvil 390×844, más 12 navegaciones suplementarias para perfil de miembro, artículo y muestras de imágenes. Se usaron respuestas controladas, principalmente estados vacíos y sin asignación.
- Revisión visual de 22 capturas completas representativas. Hay evidencia de Home, Nosotros, Células, Dar, Oración, Conéctate, Login y paneles.
- Pruebas locales de seguridad con SQLite **en memoria** y storage falso; ninguna operación contra producción o cuentas reales.
- Build, lint, suite Go, 14 pruebas existentes de diseño/smoke y auditoría npm con y sin dependencias de desarrollo.
- Los JWT ficticios se usaron exclusivamente para montar UI con APIs interceptadas. Esto **no prueba** que sea posible superar la validación de JWT del servidor.

La auditoría no certifica producción: no se verificaron secretos históricos, configuración efectiva de R2/Supabase, headers del hosting, políticas de conservación, proveedores de correo, compatibilidad real con Safari ni todas las combinaciones de registros poblados. No se midieron Core Web Vitals de campo. Las pruebas de listas vacías no equivalen a probar todos los CRUD completos.

Archivos de evidencia: [rutas](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/route-results.json), [interacciones](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/interaction-results.json), [muestras adicionales](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/extra-results.json), [seguridad](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/security-evidence.txt), [npm](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/npm-audit.json), [npm producción](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/npm-audit-production.json), [lint](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/lint-results.json), [Playwright existente](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/playwright-existing.txt).

## Seguridad

### S1 — P1 / Alta: condición SQL controlada por un ID público

**Ubicación:** `backend/handlers/rsvp.handler.go:26,58`; rutas públicas en `backend/routes/routes.go:136`. `eventID := c.Param("id")` llega como string a `First(&event, eventID)`. GORM puede interpretar ese argumento como una condición SQL en lugar de un ID.

**Evidencia:** el reproductor local genera `WHERE 1=1` sin parámetros. En el handler real sobre SQLite en memoria, un ID `1=1` produjo HTTP 201 y `1=0` produjo 404. Se confirmó una condición SQL inyectable; no se realizó extracción de datos ni se explotó PostgreSQL remoto. El impacto exacto en PostgreSQL requiere validar su dialecto y el comportamiento transaccional, pero el flujo de datos inseguro existe.

**Corrección:** parsear cada ID a entero positivo antes de consultar; usar condiciones parametrizadas. Revisar también `First/Delete` con IDs string en galería, FAQs, anuncios, social, boletas, reportes y voluntarios. Algunos handlers, como eventos y comprobantes, ya convierten a entero: no todos los usos encontrados son vulnerables. Añadir pruebas negativas a la ruta pública y a rutas con roles inferiores.

La documentación de [seguridad de GORM](https://gorm.io/docs/security.html) advierte expresamente sobre este patrón de ID string.

### S2 — P1 / Alta: cancelar una inscripción ajena con solo un correo

**Ubicación:** `backend/handlers/rsvp.handler.go:213`; `backend/routes/routes.go:137`. El DELETE público busca por evento y correo, y elimina sin token de cancelación ni prueba de posesión del correo.

**Evidencia:** una petición sin Authorization canceló el registro sintético de otra persona: HTTP 200 y cero registros restantes. El correo es un identificador, no una credencial. Además viaja en el query string y puede acabar en logs.

**Corrección:** enlace de cancelación con token aleatorio de un solo uso, almacenado como hash; o sesión autenticada y comprobación de propietario. Añadir límites específicos y respuestas que reduzcan enumeración. El control de acceso debe verificarse por objeto, como recomienda [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

### S3 — P1 / Alta: intenciones de donación cuentan como dinero confirmado

**Ubicación:** `backend/handlers/donation.handler.go:63–72`; `backend/handlers/admin.go:40–53`. El endpoint público establece `IsSuccessful: true` aunque el registro sea una intención presencial o una transferencia sin verificar. Los KPIs suman las donaciones con ese flag.

**Evidencia:** HTTP 201 para una intención sintética sin pago ni comprobante; el registro quedó exitoso con importe 999999 y moneda USD. La API acepta moneda libre, mientras el dashboard trata el agregado como quetzales.

**Corrección:** estados explícitos `intencion`, `pendiente`, `verificado`, `rechazado`; sumar solo dinero verificado. Fijar GTQ o separar agregados por moneda, validar límites y propósito, y vincular donación/comprobante mediante ID. La aprobación del comprobante debe actualizar la donación en una transacción.

### S4 — P1 / Alta: datos privados del autor expuestos en el blog público

**Ubicación:** `backend/handlers/blog.handler.go:31,54`; `backend/models/user.go`. Se precarga y serializa el modelo completo `User` como `author`.

**Evidencia:** el GET público devolvió correo, teléfono, dirección, rol y metadatos del autor sintético. Las contraseñas y tokens llevan `json:"-"` y no aparecieron: el problema confirmado es exposición de contacto y datos de cuenta.

**Corrección:** DTO público con los campos editoriales necesarios, por ejemplo nombre y foto. Aplicarlo también a anuncios que precargan Author. Separar perfil privado de ficha pública con una política explícita de publicación.

### S5 — P1 / Alta, condicionada al DSN: Replay sin protección de texto y medios

**Ubicación:** `frontend/src/main.jsx:16–29`. Cuando existe `VITE_SENTRY_DSN`, se activa Session Replay con `maskAllText: false`, `blockAllMedia: false`, muestreo normal del 10% y del 100% de sesiones con error. No hay exclusión por ruta sensible.

**Riesgo:** el contenido visible de paneles, peticiones y comprobantes puede entrar en replays de terceros. No se comprobó si el DSN está activo en producción ni se afirmó que los inputs de contraseña estén sin máscara; las opciones de inputs son independientes.

**Corrección:** máscara de texto y medios por defecto; excluir Replay de administración, oración, conexión, donaciones y comprobantes, o bloquear sus contenedores con los selectores del SDK. Documentar qué telemetría se conserva y quién puede verla. Confirmar con una sesión sintética en el proyecto Sentry de pruebas.

### S6 — P2 / Media: validación insuficiente y privacidad de uploads

**Ubicación:** `backend/handlers/upload.handler.go:41–67`; `backend/storage/storage.go:218`. **Sí se validan extensión y tamaño de 10 MB.** Falta validar firma/contenido: el MIME se calcula por extensión y se pasa `nil` como contenido para su detección.

**Evidencia:** texto plano con nombre `audit.jpg` fue aceptado con HTTP 201 y MIME `image/jpeg`. Esto prueba aceptación de una imagen inválida, **no ejecución remota ni XSS**.

El almacenamiento devuelve URLs públicas, y en modo local `/uploads` se sirve sin autorización. Los comprobantes requieren una clasificación distinta de las fotos de contenido. Nombres difíciles de adivinar no son control de acceso.

**Corrección:** verificar formato y decodificar/reencodificar imágenes en servidor; normalizar extensión; validar PDFs; limitar el body antes del parseo multipart y aplicar cuotas. Bucket privado para comprobantes con descarga autorizada o URL firmada de corta duración. Revisar configuración efectiva de R2. Referencia: [OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

### S7 — P1 / Alta: sesiones no revocadas tras cambiar contraseña o rol

**Ubicación:** `backend/auth/auth.service.go:49` — JWT de 24 horas; `backend/middleware/auth.middleware.go`; `backend/auth/auth.handler.go:ResetPassword`; `backend/handlers/profile.handler.go:80`; `backend/handlers/admin.go:UpdateUserRole`.

**Confirmado por lectura:** el middleware confía en el rol del JWT y no comprueba versión de sesión/estado actual del usuario. El cambio y reset de contraseña no limpian el refresh token. Por ello un token anterior conserva privilegios hasta expirar, y un refresh robado puede seguir renovándose después del cambio de contraseña. Logout en el frontend solo limpia storage local.

**Corrección:** revocar sesiones y refresh tokens al cambiar contraseña, rol o desactivar cuenta; access token corto y sesión revocable/versionada. Rotation de refresh atómica, hash en almacenamiento y detección de reutilización. Considerar cookie HttpOnly con medidas CSRF correspondientes; localStorage aumenta el impacto de cualquier XSS.

### S8 — P2 / Media: dependencias con avisos que requieren análisis de alcance

`npm audit` reportó **20 paquetes afectados**: 14 high, 5 moderate y 1 low. Con `--omit=dev`: **10 paquetes**, 6 high y 4 moderate. Son entradas de paquetes, no 20 ataques independientes ni 20 vulnerabilidades explotadas en este sitio.

Versiones instaladas relevantes: Axios 1.18.1, TipTap core 3.20.2, DOMPurify 3.4.12, React Router 7.18.1, PostCSS 8.5.6. Separar riesgos del bundle de los del tooling y actualizar en una rama con pruebas del editor, sanitización y contratos HTTP.

- [DOMPurify](https://github.com/cure53/DOMPurify/security/advisories/GHSA-55q2-fjhq-7xh7): el aviso exige `IN_PLACE` y un hook específico; esos usos no aparecen en este proyecto. No se confirmó XSS del blog por este aviso.
- [React Router](https://github.com/remix-run/react-router/security/advisories/GHSA-qwww-vcr4-c8h2): el aviso revisado afecta al modo RSC; aquí hay una SPA Vite con `createBrowserRouter`. No se confirmó ese vector.
- [TipTap](https://github.com/ueberdosis/tiptap/security/advisories/GHSA-cp6q-959q-f8rh): revisar la procedencia de atributos y cualquier importación de JSON/editor antes de atribuir explotabilidad al sitio.

No ejecutar `npm audit fix --force` indiscriminadamente: la propuesta para Tailwind puede migrar a v4 y cambiar el CSS.

## QA e integración

| ID | Prioridad | Fallo / evidencia | Acción |
|---|---|---|---|
| Q1 | P1 | Recuperación de contraseña rota en dos puntos: el correo crea `/reset-password?token=…`, pero la ruta es `/reset-password/:token`; el cliente manda `password`, la API espera `newPassword`. El enlace mostró “Página no encontrada” y se capturó el payload incorrecto. | Un contrato único y un E2E de correo→enlace→reset→login. Referencias: `backend/email/email.templates.go:154`, `frontend/src/router.jsx:187`, `frontend/src/context/AuthContext.jsx:65`, `backend/auth/auth.handler.go:284`. |
| Q2 | P1 | “Nuevo Reporte” aparece al voluntario, pero POST `/admin/volunteer-reports` y `/upload` requieren admin/líder. Un voluntario real obtiene 403. | Ruta para crear su propio reporte y subir su propia evidencia; derivar identidad en servidor. No abrir todo `/admin` a voluntarios. `VolunteerReportForm.jsx:49,64`; `backend/routes/routes.go:176,339`. |
| Q3 | P2 | `VolunteerDashboard.jsx:236` usa `<ModalWrapper>` sin `onClose`. El botón compartido “Cerrar” deja el modal abierto; además hay un segundo cierre interno. | Pasar callback y eliminar la duplicación; probar botón, Escape y restauración de foco. |
| Q4 | P1 | Donación y comprobante se crean en dos POST sin vínculo por `donation_id`. Si el segundo falla, reintentar crea otra donación; el rechazo del comprobante no corrige el dinero ya contado. | Operación de dominio vinculada, transacción/idempotencia, estado recuperable y confirmación posterior. `DonationCard.jsx:80–103`, `payment_receipt.handler.go:Verify`. |
| Q5 | P2 | `fetchOnce` convierte cualquier error en `null`; `useApi` no distingue cargar, vacío y fallo. TTL del Map no refresca componentes ya montados, pues el efecto solo depende de `path`. `/leader/my-directory` sin ficha termina sin un h1 o explicación persistente. | Hook con `data/loading/error`, retry explícito, estado vacío real, invalidación al guardar y revalidación. `feed.js:29,37`, `LeaderMyProfile.jsx:24`. |
| Q6 | P2 | Refresh escribe localStorage pero no actualiza AuthContext; además fija Authorization en defaults de Axios, que logout no borra. Una solicitud posterior puede conservar un token anterior aunque storage esté vacío. | Una única fuente de sesión; notificar refresh a React y limpiar defaults al salir. `apiClient.js:61–65`, `AuthContext.jsx:24–28`. Hallazgo por lectura, sin afirmar bypass de la API. |
| Q7 | P2 | Anuncios dirigidos a líderes no llegan por `/announcements`: el handler lee `user_role`, pero la ruta no instala autenticación opcional y siempre opera como anónima. | Endpoint por audiencia autenticada con caché privada; evitar cachear respuestas personales como públicas. `routes.go:149`, `announcement.handler.go:28`. |
| Q8 | P2 | Middleware de bots dirige `/blog/*` o `/eventos/*` a `/api/og`; no existe ese endpoint en las rutas del backend revisado, y la aplicación usa `/events/*`. | Implementar OG real o retirar rewrite; probar URL compartida con agentes de bots y rutas actuales. `frontend/middleware.js:21–26`. Despliegue efectivo no validado. |

RSVP también asocia comprobantes por correo/evento, acepta los pendientes y no compara el importe con precio×asistentes. Revisar la regla de reserva y validación de pago por cantidad antes de llamar “confirmado” a un grupo; no se ejecutó un flujo financiero real.

## Diseño y accesibilidad: concordancia actual

### D1 — P1: números blancos sobre blanco

`StatCard.jsx:12` usa `text-acento` para tint `ter`, pero `index.css:46` define `--acento: #FFFFFF`. En el panel del líder, “Conversiones” y “Boletas” tienen números blancos sobre cristal casi blanco. La captura [panel líder](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/desktop-leader.jpg) lo muestra con datos sintéticos en cero; el problema es el color, no el valor.

El mismo token blanco alimenta trazos de gráficos y bordes de carga en paneles claros. Crear colores semánticos por tema y usar tinta navy para cifras; reservar estados para información que de verdad sea éxito/advertencia/error. Medir contraste sobre la superficie compuesta, no solo contra el canvas.

### D2 — P2: identidad documentada y tokens reales no coinciden

- DOC_MAESTRO habla de crema, azul y dorado, y de un backend Fiber; el proyecto actual usa navy/cristal y Echo.
- La guía Liquid Glass habla de `#E8823C`; el token real es blanco y conserva comentarios del naranja.
- Tailwind conserva sombras azules y alias legacy, aunque el criterio público pide monocromía.
- `.display-mega`, `.display-tight`, `.font-display` y `.prose h2` conservan peso 800; la documentación cierra Arimo en 700.

No hay una fuente normativa única. Declarar los documentos antiguos como históricos y mantener una sola guía vigente con colores efectivos, temas y componentes aprobados. Confirmar si el acento será blanco o cálido y ajustar usos según su función.

### D3 — P2: fotografías apagadas y demasiados fondos

`SectionBg.jsx:12` aplica por defecto `opacity-25` y agrega otro overlay `bg-bg/60`: aproximadamente solo el 10% de la imagen contribuye al resultado sobre el canvas. `PageHero` agrega `ParallaxImg overlay=true` más otro scrim. Esta acumulación contradice la regla documentada de fotos a color y scrims únicos.

Nosotros contiene seis `SectionBg` más el hero; Home también encadena numerosos fondos. La guía vigente recomienda máximo dos fotos ambientales por página. La repetición reduce el ritmo editorial y amplifica el peso descargado.

Unificar un scrim por composición; dejar fotos de contenido a color y usar navy limpio para secciones que no necesitan fotografía. Mantener composición izquierda/centrada según propósito, no imponer que todos los heroes sean iguales.

### D4 — P2: clases sin token y variaciones de componentes

`CelulasPage.jsx:338,436,548` usa `text-primary`, `border-primary`, `bg-primary/10`, que no existen en el tema Tailwind actual. En el estado de selección se pierde parte de la señal visual prevista. Migrar a tokens definidos y comprobar el CSS compilado.

El proyecto mezcla `Button`, `GlassButton`, botones escritos a mano y `FieldLight/Input/GlassField`; dos contextos son válidos, pero los estados y dimensiones deben compartir reglas. Hay radios 12/14/16/20/24/28/32 y tipos numéricos extensos sin una función clara para todos ellos. La variante `outlined` de Button convive con `border-none` en base: verificar que el CSS final exprese la intención de borde.

### D5 — P1: modal compartido sin contrato accesible

`ModalWrapper.jsx` no define dialog, aria-modal, nombre, foco inicial, trap, restauración de foco, Escape ni bloqueo del fondo. El quiz de Células permaneció abierto tras Escape; `body.style.overflow` estaba vacío. Hay un contraste con WindowStack, que sí implementa varias de estas garantías.

Unificar ambos sobre una base accesible y permitir diferentes presentaciones. Seguir el patrón de [dialog modal de W3C](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), incluyendo fondo inerte y retorno del foco; añadir `aria-modal` sin comportamiento no basta.

### D6 — P2: formularios y mensajes no uniformes

Se detectaron campos sin nombre accesible en el monto libre de Dar, búsquedas de Usuarios/Donaciones y “Nueva meta” en perfiles. Los componentes de Input generan IDs mediante un contador incrementado durante cada render; usar `useId` para estabilidad. Los errores visibles no comparten un contrato de `aria-invalid`/`aria-describedby`.

Mantener labels visibles, ayuda y error asociados, feedback de submit en la misma posición y mensajes que preserven el dato ingresado. Revisar texto tenue de 11–13 px y el contraste de `text-bg/40` sobre superficies claras. Los contrastes de todo el sitio no se midieron píxel por píxel.

### D7 — P2: fondos de panel contienen interfaz incrustada

La foto fallback del panel líder contiene texto de agenda impreso en el bitmap: fechas y títulos aparecen como información fantasma detrás de las tarjetas. Se ve en [desktop-leader.jpg](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/desktop-leader.jpg). Un fondo para panel debe ser foto/textura sin interfaz ni texto editorial, con tratamiento tenue y estable.

En el Home con feed vacío, varias secciones conservan extensiones grandes de foto y espacios sin contenido. [mobile-home.jpg](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/mobile-home.jpg) muestra el estado. Colapsar módulos realmente vacíos o mostrar un estado con acción útil; validar de nuevo con contenido real antes de fijar alturas.

### D8 — P2: accesos y configuraciones redundantes

El contenido se administra mediante `/settings` y `/site-photos`, pero App calcula `bgImage` sin renderizarlo. Varias llaves `public_bg_*` parecen ofrecer cambios que no llegan a la UI por ese camino. Auditar cada setting contra un consumidor efectivo y unificar edición de fotos por slot.

La navegación pública mezcla URLs inglesas con españolas; la interfaz es española. Mantener aliases o redirects explícitos y un registro compartido de rutas para Header, Footer, SEO, correos y OG. `/payment-success` muestra éxito solo por abrir la URL, sin verificar una operación; sustituirlo por confirmación vinculada si se utiliza como comprobante.

## Rendimiento

Build correcto, con advertencia de chunk grande: bundle principal **792.68 kB / 247.59 kB gzip**; AdminBlog 388.50 kB / 123.00 kB gzip; AdminIndex 355.15 kB / 105.16 kB gzip. El lazy loading del panel ayuda, pero la mayoría de páginas públicas se importa eagerly en router.

La carpeta local de imágenes ocupa unos **192 MB**. Hay originales de 6000 px; `about_podcast.jpg` pesa aproximadamente 6.43 MiB y `about_vision.jpg` 5.91 MiB. La afirmación previa de 3.6 MB totales ya no representa este checkout.

| Muestra local | Archivos de imágenes cargadas | Suma de sus tamaños originales |
|---|---:|---:|
| Home | 16 | 18.08 MiB |
| Nosotros | 26 | 65.55 MiB |
| Oración | 3 | 5.83 MiB |
| Login | 2 | 0.28 MiB |

Estas sumas son de archivos locales únicos presentes en el DOM y cargados en la prueba; **no son mediciones de transferencia con CDN ni LCP**. Sí identifican un costo importante y evitable, especialmente en móvil.

**Orden de mejora:** exportar AVIF/WebP y tamaños responsivos; `srcset/sizes`; lazy loading bajo el primer viewport; una imagen prioritaria de hero; compresión/derivados en servidor; separar páginas públicas pesadas con lazy loading; retirar imports/configuración muertos. `AdminSettings` sube fondos sin utilizar el helper de compresión que ya usa AdminSitePhotos. Evitar almacenar capturas de interfaz como fondos.

Metas iniciales de aceptación: hero móvil por debajo de 250–350 kB cuando la calidad lo permita; variante desktop por debajo de 500–700 kB; carga inicial de imágenes de Home por debajo de 1–1.5 MB; medir LCP/INP/CLS con red móvil antes de fijar objetivos finales. Son presupuestos propuestos, no resultados actuales.

## Sistema de diseño propuesto

Conservar una marca y dos temas. La siguiente tabla es una propuesta para reemplazar decisiones dispersas, no cambios ya aplicados.

| Elemento | Público | Paneles | Regla común |
|---|---|---|---|
| Canvas | Navy `#0A1526` | Paper `#F2F5FA` | Tokens `canvas/surface/text` por tema |
| Texto principal | Blanco | Navy | Nunca usar acento decorativo como cifra sin contraste |
| CTA primario | Blanco con texto navy | Navy con texto blanco | Una jerarquía primaria/secundaria/texto/destructiva |
| Acento | Blanco actual; cálido si se confirma | Variante con contraste suficiente | Marca y estados separados |
| Tipografía | Arimo, d1/d2/d3 | Arimo, encabezado/tabla/formulario | Pesos reales 400/500/600/700; escala semántica |
| Radios | Pill, field 12, card 24, modal 32 | Misma escala | Excepciones documentadas por composición |
| Fotografías | Personas y vida comunitaria | Foto neutral opcional | Contenido vs ambiente; un tratamiento por foto |
| Movimiento | Respuesta breve a interacción | Discreto | `prefers-reduced-motion`, foco y estados consistentes |
| Modales | Cristal oscuro/claro | Superficie clara | Una base dialog accesible |
| Formularios | Field por superficie | Field por superficie | Mismo label, ayuda, error, loading y confirmación |

Crear un catálogo interno con Button, Field, Dialog, Card, Stat, PageHeader, EmptyState, ErrorState y Table/Paginator. Mostrar cada uno en ambos temas con estados normal, hover, focus, disabled, loading y error. Cambiar estilos mediante tokens semánticos (`--text-primary`, `--action-bg`, `--focus-ring`, `--status-error`), no mediante alias de una marca que cambian de significado.

Establecer un único shell de página pública y uno de panel, con márgenes y ancho de contenido comunes. La variación editorial debe estar en composición y contenido; los controles, errores y navegación mantienen comportamiento estable.

## Matriz de estandarización por familia

| Familia | Cobertura / revisión | Prioridad de normalización |
|---|---|---|
| Home / Nosotros | Código y capturas desktop/mobile | Fotos, scrims, imágenes, ritmo, vacío del feed |
| Células / Voluntariado | Código, vacío, quiz compartido | Selección, modales, carga/error, coherencia de catálogo |
| Eventos | Código y listado vacío | RSVP, autorización de cancelación, estados de pago, modal |
| Blog / Galería | Código, vacío y artículo sintético | DTO público, editor, imágenes, OG/SEO |
| Oración / Conéctate | Código y formularios visibles | Labels, privacidad de Replay, feedback, superficie clara |
| Dar / Comprobante | Código y formulario inicial | Estados financieros, atomicidad, archivos privados, accesibilidad |
| Auth / Perfil miembro | Código, pantallas y reset controlado | Contrato reset, sesiones y errores vinculados |
| 25 rutas admin | Navegación local con fixture de rol | KPIs, formulación de estados, tabla/form/modal comunes |
| 10 rutas líder | Navegación local con fixture de rol | Contraste, ausencia de ficha, permisos por propietario |
| Voluntario | Dashboard y modal local | Capacidad real de enviar reporte y cerrar dialog |

## Resultado de verificaciones

| Verificación | Resultado | Interpretación |
|---|---|---|
| `npm run build` | Pasa | Compilar no valida contratos ni seguridad |
| `npm run lint` | 10 errores, 21 warnings | Gate de calidad rojo |
| `go test ./...` | Falla | `scripts/seed_users/main.go:7`: import `strings` sin uso. Auth, handlers, middleware, rutas, storage y suites e2e/security pasan; varios resultados son cacheados |
| Diseño/smoke Playwright existente | 12 pasan, 2 fallan | Los dos fallos esperan células reales; API local intencionalmente no disponible. No se atribuyen a regresión visual |
| Navegaciones controladas | 110; sin overflow horizontal o crash visible en las respuestas válidas utilizadas | Cobertura de montaje y vacío, no CRUD completo ni red móvil |
| Modales/reset | Fallos reproducidos | Evidencia en interaction-results.json |
| Seguridad local | SQL/RSVP/uploads/autor/donación reproducidos | Sin escrituras ni ataques contra producción |

Las pruebas actuales de seguridad no cubren el ID público inyectable: el test de SQL revisa el email de login. El test llamado XSS comprueba que la petición se guarda literalmente, no que sea imposible ejecutar HTML en todas sus salidas. Ampliar pruebas sobre frontera de confianza y permisos por objeto.

Controles positivos: bcrypt; JWT firmado y rol validado en servidor; queries de login parametrizadas; DTOs de entrada en varios handlers; rutas admin protegidas; scopes de propietario en varias operaciones de células/boletas; rate limiting; DOMPurify en las salidas HTML del blog; escape en impresión de peticiones; sanitización de nombres; cupo RSVP dentro de transacción; dark/light explícitos y componentes compartidos. Estos controles ayudan, pero no eliminan los hallazgos anteriores.

## Plan de ejecución y criterios para cerrar la auditoría

1. **Seguridad y confianza:** IDs numéricos, cancelación autorizada, DTO público, sesiones revocables, privacidad de Replay y comprobantes. Cerrar con pruebas negativas que fallen en la versión anterior.
2. **Flujos esenciales:** reset completo; reporte de voluntario autorizado; transacción/idempotencia donación–comprobante; pagos por cantidad. Probar con al menos dos cuentas por rol y fallos de red intermedios.
3. **Legibilidad y controles:** StatCard, estados semánticos, base modal accesible, labels, errores, foco, capas y vacíos. Revisar 390/768/1440 px, zoom 200%, teclado y movimiento reducido.
4. **Fotografías y rendimiento:** exportar variantes, reducir fondos, eliminar overlays redundantes y medir la carga en red móvil. Preservar la fotografía real como identidad.
5. **Gobierno del diseño:** una guía vigente, catálogo de componentes, mapa de rutas/settings y contratos de API. Lint y suite completa verdes; smoke determinista con fixtures y E2E de integración aparte.

No se modificó la aplicación ni los cuatro archivos que ya tenían cambios locales. Los entregables de esta tarea son el informe, evidencias y reproductores bajo esta carpeta.
