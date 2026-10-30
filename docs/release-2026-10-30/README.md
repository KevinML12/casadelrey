# Correos, depósitos y comprobantes — 30 de octubre de 2026

El backend y los dos frontends tienen publicado el nuevo flujo. Brevo Gratis quedó conectado al servicio de Render con el remitente verificado `casadelreyhue@outlook.com`. La clave está limitada a correos transaccionales y se guardó en el entorno del backend; no está en Git ni en el frontend. No se contrató ningún plan ni se realizaron transferencias.

## Resultado

- Plantillas con fotografía administrable, logo existente, panel blanco, bisel fino y una acción principal. El espacio `email_fondo` aparece en Fotos del sitio; si no está configurado, se utiliza la fotografía administrada de comunidad. El HTML tiene colores sólidos y texto alternativo para clientes que bloquean imágenes o transparencias. Hay versión de texto.
- Cola durable en PostgreSQL, incorporada a la misma transacción del registro o cambio de estado. Contenido cifrado con AES-GCM y borrado después de aceptación o caducidad. La aceptación por Brevo se distingue de la entrega; los envíos inciertos requieren revisar el proveedor antes de reenviarlos.
- Inscripción pagada y comprobante se registran juntos. Reintentos iguales conservan su identificador; no duplican la operación. Un archivo privado no puede respaldar otro pago. Las decisiones de administración actualizan también la inscripción o donación vinculada.
- Un rechazo explica qué corregir y permite volver a enviar el mismo comprobante mediante un enlace de siete días. La credencial se guarda como hash y viaja en el fragmento del enlace; no se envía al alojamiento del frontend. Una corrección idéntica admite reintento seguro después de una respuesta de red ambigua.
- Las donaciones en persona comienzan pendientes. Administración confirma o revierte su recepción de forma explícita; sólo las recibidas cuentan como recaudadas.
- Correos de inscripción, cancelación, resultado de revisión, recuperación y verificación de cuenta. Cancelar una inscripción no ejecuta una devolución bancaria.
- Formularios de donación y comprobante, revisión privada y panel Correos adaptados a móvil. Se conservan los originales de los archivos hasta 10 MB; las vistas usan URLs locales de navegador después de una consulta autenticada.

## Verificación

| Comprobación | Resultado |
| --- | --- |
| Backend completo con detector de carreras | Aprobado; `backend-race.txt` |
| Cambios finales de correo y negocio | Aprobados; `backend-final.txt` |
| PostgreSQL local desechable | Doce solicitudes simultáneas generan una donación, un comprobante y un correo. Doce procesadores concurrentes realizan un solo envío; `postgres-concurrency.txt` |
| Regresiones de interfaz | 57 aprobadas: formularios, corrección, pago por evento, recepción presencial, permisos, foco, navegación y responsividad; `ui-regression.txt` |
| Módulos publicados | Tres pruebas de navegación, roles y módulos en Vercel y otras tres en Render, a 390 y 1440 px; `live-vercel.txt` y `live-render.txt` |
| Compilación y análisis | Build correcto; lint sin errores y 18 avisos; vet correcto |
| Plantillas | Seis variantes a 390 y 640 px, sin desbordamiento horizontal. Capturas de navegador en `email/`; no equivalen a certificar todos los clientes de correo |
| Panel de correo publicado | Configuración y correo aceptado visibles en ambos sitios con sesión controlada; `live-email-ui.json` |
| Nuevas pantallas | Donación, comprobante, revisión y correos a 320, 390, 768 y 1440 px; sin desbordamiento en las 16 mediciones (`ui/revision.json`) |

Las pruebas de estados financieros se ejecutaron con datos controlados en bases locales. La comprobación de correo en Render creó únicamente una notificación técnica para el buzón de la iglesia; no inventó pagos ni inscripciones. Los archivos de evidencia no incluyen claves, contraseñas, tokens de sesión ni fotografías privadas de comprobantes.

## Entrega real y límite gratuito

Se hicieron dos comprobaciones controladas: una desde el cliente del servicio y otra procesada por la cola del backend publicado en Render. La primera fue aceptada y entregada según Brevo y se encontró en **No deseado** de Outlook. La segunda fue aceptada una vez por el procesador de Render y también figura como entregada en el proveedor; su estado está en `render-mail-check.json`.

El titular confirmó que la iglesia todavía no tiene dominio propio. Se mantuvo el remitente gratuito verificado, sin compras. La clasificación en No deseado sigue siendo una limitación real; verificar una dirección de Outlook no autentica un dominio propio. No se garantiza la llegada a la bandeja principal.

El sitio aplica un límite preventivo de **250 envíos en 24 horas**, dentro del plan gratuito de Brevo de 300 diarios. Los excedentes esperan en cola y las notificaciones caducan según su finalidad; una gran afluencia de visitantes no equivale a poder enviar mil correos diarios. El panel permite distinguir En cola, Aceptado, Fallido, Incierto y Caducado. Los rechazos conocidos admiten reintento controlado; una respuesta incierta no se reenvía automáticamente.

## Publicación y operación

Los identificadores de los despliegues están en `deployment.json`. El backend se publicó primero; después se actualizaron Vercel y Render Static. Supabase conserva el schema autorizado y R2 permanece como almacenamiento de archivos. Los envíos usan enlaces hacia Vercel.

La clave vence el 30 de octubre de 2027 o tras 90 días de inactividad. Al rotar `JWT_SECRET`, hay que resolver previamente los mensajes pendientes: su contenido cifrado depende de esa clave. Antes de reintentar un mensaje incierto, consultar el historial en Brevo para evitar duplicados.

## Pendientes del cierre general

Este cambio no cierra los asuntos históricos registrados en la [preparación del 29 de octubre](../release-2026-10-29/PREPARACION_PRODUCCION.md): tres archivos antiguos potencialmente públicos necesitan clasificación y migración; el historial financiero original sigue pendiente de una decisión de conservación; faltan el cierre de alojamiento, restauración y capacidad operativa. Las mejoras del flujo nuevo no revocan URLs públicas antiguas.

Fuentes oficiales: [límites de Brevo Gratis](https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan), [remitentes y dominios](https://developers.brevo.com/docs/getting-started-with-senders-and-domains), [eventos de entrega](https://developers.brevo.com/reference/get-email-event-report).
