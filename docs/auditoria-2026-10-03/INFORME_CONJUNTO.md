# Informe conjunto — frontend, backend, QA e identidad

**Casa del Rey · 3 de octubre de 2026 · Base `01d597d` y cambios locales existentes.**

## Dictamen

El proyecto tiene una identidad coherente en intención —fotografía de la congregación, navy profundo, blanco, cristal y paneles claros—, pero su ejecución y contratos no están suficientemente estandarizados. Hay fallos confirmados en autorización por registro, revocación de sesiones, privacidad y reglas de pagos, además de flujos de usuario rotos. La primera inversión debe proteger datos y recuperar esos flujos; después consolidar diseño y rendimiento.

Este informe reúne la [auditoría frontend](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/INFORME.md), la [auditoría backend](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/INFORME_BACKEND.md) y el [plan de mejora](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/PLAN_MEJORA.md). Los IDs S/Q/D del primer documento y B del segundo pueden representar el mismo problema; no se suman como vulnerabilidades independientes.

## Cobertura y límites

Frontend: 110 navegaciones en 55 escenarios URL/rol, escritorio y móvil; 12 visitas suplementarias; 22 capturas representativas; pruebas de interacción, build, lint y npm audit. API interceptada con datos sintéticos: se evaluó UI, no autenticación real ni cada CRUD poblado.

Backend: 31 verificaciones locales contra router/handlers y SQL generado; usuarios y JWT firmados sintéticos; SQLite en memoria, almacenamiento falso y bloqueo de red externa. Se comprobaron middleware real, respuestas y cambios persistidos. Un caso verifica dialecto PostgreSQL sin ejecutar en servidor real. Suite Go repetida sin caché y vet de paquetes centrales.

No se atacó producción, no se tocaron datos reales ni se enviaron correos. Quedan pendientes despliegue, PostgreSQL real/concurrencia, buckets y permisos efectivos, métricas de campo, navegadores adicionales y CVEs Go actuales. Es una auditoría del estado inspeccionado, no una certificación de seguridad.

## Concordancia frontend ↔ backend

| Flujo | Evidencia cruzada | Resultado |
|---|---|---|
| Recuperar contraseña | Email lleva query token, UI espera segmento; UI envía `password`, backend exige `newPassword` | Rotura confirmada: ruta inválida y 400. B09/Q1. |
| Reporte de voluntario | UI ofrece crear y adjuntar; API permite admin/leader | Voluntario obtiene 403 en ambos endpoints. B10/Q2. |
| Donar y enviar boleta | UI hace dos POST sin relación; API marca intención exitosa y verificar boleta no actualiza donación | Datos financieros y confirmación no reflejan verificación real. B05/B14/S3/Q4. |
| Pagar evento | UI representa estado de pago; API busca recibo por correo/evento sin validar total requerido | Q1 habilita cinco entradas de Q100 como verificadas. B06. |
| Gestión por líder | Rol limita acceso general, pero no siempre limita registros | Aprueba reporte ajeno; modifica tarjeta asignada a otro. B07/B08. Definir alcance de tarjetas antes de implementar. |
| Cuenta y cambio de rol | UI limpia sesión local; API confía en JWT vigente | JWT admin funciona tras degradación y tokens sobreviven reset. B03/S7; sincronización cliente pendiente Q6. |
| Anuncios segmentados | Handler espera rol; ruta pública no establece identidad | JWT líder no habilita sus anuncios. Si se personaliza, cambiar caché. B11/Q7. |
| Autor de contenido | UI necesita autor editorial; API devuelve User completo | Exposición pública de contacto/dirección. B04/S4. |
| Compartir contenido | Rewrite refiere `/eventos` y OG; UI usa `/events`; router no registra OG | API OG 404; comportamiento final de hosting pendiente. B13/Q8. |
| Personalizar fondo público | Admin configura valores, frontend calcula fondo sin renderizarlo | Configuración prometida sin efecto visual. Q/diseño del informe frontend. |

## Hallazgos prioritarios

**P1: seguridad y confianza.** Corregir IDs SQL, cancelación RSVP sin credencial, revocación de sesiones, DTO público de autores, contabilidad de intenciones y validación de importe del evento. Resolver permisos de aprobación por registro. Acordar si líderes trabajan globalmente o por asignación. Replay de Sentry requiere protección si el DSN está activo; esa activación no se verificó.

**P1: uso cotidiano.** Unificar recuperación de contraseña y habilitar autoservicio de voluntario con permisos mínimos. Dar atomicidad, relación e idempotencia al flujo donación/boleta. El botón de cierre de modal en voluntarios y el texto blanco sobre tarjetas claras son fallos visibles que conviene corregir en la misma estabilización.

**P2: consistencia y escala.** Validación real de archivos, privacidad de comprobantes, feedback de errores, sincronización de sesión, feeds segmentados, OG, accesibilidad modal, etiquetas, tokens, actualización selectiva de dependencias y entrega de correo fiable.

## Identidad y estándar recomendado

Conservar el lenguaje fotográfico y el navy actual; no emprender un cambio de marca para corregir inconsistencias de componentes. Documentar dos superficies: público editorial oscuro/cristal y herramientas de trabajo claras, con la misma tipografía, escala y estados.

| Área | Estándar propuesto | Brecha actual |
|---|---|---|
| Color | Tokens semánticos `surface`, `text`, `border`, `brand`, `success`, `warning`, `danger`, con variantes para fondo oscuro/claro | Acento blanco usado como texto en superficies casi blancas; tokens `primary` inexistentes en Células. |
| Acento | Decisión explícita: mantener blanco para marca y CTA, o aprobar acento cálido documentado | Documentación y CSS difieren. Evitar sustituir globalmente sin revisar contraste. |
| Tipografía y espacio | Arimo, jerarquía definida, escala de espacios y anchos de lectura compartidos | Variaciones por página y títulos ausentes en estados sin asignación. |
| Fotografías | Personas y actividades reales; hero con overlay único; fondos limitados; recortes móviles | Doble oscurecimiento, exceso de fondo e imagen de panel con texto incrustado. |
| Componentes | Button/Input/Select/Modal/StatCard/PageHeader/Table y estados documentados | ModalWrapper y WindowStack tienen conductas distintas; cierres y etiquetas incompletos. |
| Estados | Cargando, vacío, error con reintento, éxito y sin permisos diferenciados | Errores de feed se convierten en vacío; perfil sin ficha puede quedar sin contexto. |
| Accesibilidad | Contraste AA, teclado, nombre accesible, foco visible y retorno de foco | Modales sin semántica/focus trap/Escape; inputs sin etiqueta; IDs variables. |

Usar la guía existente como punto de partida y actualizarla contra los componentes reales. La página de componentes debe mostrar escritorio/móvil, claro/oscuro, validaciones y estados; no basta un catálogo de colores.

## Calidad y rendimiento

- Build frontend: pasó. Lint: 10 errores y 21 avisos en la auditoría inicial.
- Suite visual existente: 12/14; dos pruebas esperaban células pobladas con API no disponible. No prueban una regresión funcional por sí mismas.
- Pruebas Go frescas: paquetes con pruebas pasan; `go test -count=1 ./...` falla por `strings` sin usar en `scripts/seed_users`. Vet de auth/handlers/middleware/routes/storage pasa.
- npm: 20 entradas de paquetes afectadas, 10 excluyendo dev; los avisos no equivalen a exploits probados. Actualizar con verificación de editor/sanitización/router; evitar `audit fix --force` por cambios mayores.
- Fotografías locales únicas referenciadas: Home 18.08 MiB, Nosotros 65.55 MiB. Son tamaños de archivos fuente, no bytes transferidos ni LCP medido. Generar tamaños adecuados, formatos modernos y `srcset`; medir red real después.
- Bundle principal: 792.68 kB / 247.59 kB gzip. Revisar carga diferida de pantallas y librerías costosas después de estabilizar flujos.

## Cómo cerrar la auditoría

El [plan](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/PLAN_MEJORA.md) convierte estos hallazgos en seis etapas con dependencias y pruebas de aceptación. Cada corrección debe aportar evidencia del comportamiento nuevo y una prueba negativa del fallo anterior, cuando tenga riesgo de seguridad o integridad. Capturas nuevas deben usar datos sintéticos poblados y estados de error, además de vacíos.

Prioridad inicial: base de QA → seguridad/API → flujos completos → sistema visual → rendimiento → operación y validación en staging. No dar por cerrados PostgreSQL, privacidad de storage o configuración de hosting solo con pruebas locales.

Los cambios de esta auditoría son informes y reproductores locales. Se conservaron los cambios preexistentes del usuario; no se aplicaron fixes a la aplicación.
