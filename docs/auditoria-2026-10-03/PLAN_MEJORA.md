# Plan de mejora y pulimiento — Casa del Rey

Fecha: 3 de octubre de 2026. Actualización: 7 de octubre de 2026. Estado: **implementación en curso; regresiones locales aprobadas para el primer bloque, idempotencia y comprobantes nuevos privados**. Basado en [informe conjunto](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/INFORME_CONJUNTO.md), [frontend](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/INFORME.md) y [backend](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/INFORME_BACKEND.md).

La reanudación, las pruebas y los límites pendientes están registrados en [AVANCE_CORRECCIONES.md](AVANCE_CORRECCIONES.md). Los resultados locales no cierran los criterios de PostgreSQL, migración de archivos históricos/configuración real de R2, correo real ni staging.

## Secuencia y reglas de entrega

Cada etapa termina con un cambio revisable, comprobaciones reproducibles y criterio de salida. P1 se atiende antes de ampliar funciones o pulir visualmente todo el sitio. Mantener los cambios locales existentes y usar datos sintéticos; nunca resetearlos para comenzar.

Las pruebas de seguridad deben pasar de caracterizar el comportamiento inseguro a exigir el comportamiento corregido. Los 31 casos actuales son evidencia de auditoría, no una suite que deba conservar respuestas vulnerables como contrato deseado. PostgreSQL de pruebas será necesario para concurrencia y sintaxis que SQLite no replica.

Tamaños relativos: S = cambio acotado; M = varios componentes/handlers; L = modelo o flujo transversal. Son complejidad relativa, no promesas de horas.

## Etapa 0 — Base fiable de QA

| Tarea | Tamaño | Criterio de aceptación |
|---|---|---|
| Corregir import sin usar y errores de lint, separando los avisos no bloqueantes | S/M | `go test -count=1 ./...`, vet de paquetes centrales, lint y build finalizan sin errores. Documentar cualquier warning restante. |
| Fixtures por rol y matriz de permisos por recurso | M | Admin/líder/voluntario/miembro/anónimo; propio/ajeno; área/asignación. Aprobación y tarjetas tienen política escrita. |
| Contratos de flujos críticos y respuestas de error | M | Especificación de reset, upload, reporte, donación, recibo y RSVP; validación y estados con ejemplos sintéticos. |
| QA frontend con datos poblados/error y backend aislado | M | Distinguir test con API interceptada de test integrado; las pruebas de células no dependen de producción ni de contenido incidental. |

Salida: baseline verde y contratos que permitan comprobar las correcciones. Los fixes P1 urgentes pueden desarrollarse junto con esta base sin esperar el catálogo visual.

## Etapa 1 — Seguridad, privacidad y autorización

| Tarea / hallazgos | Tamaño | Criterio de aceptación |
|---|---|---|
| Validador de IDs y revisión de todos los First/Delete con string — B01/S1 | M | IDs no positivos o expresiones se rechazan con 400; consultas vinculadas al ID esperado y pruebas con dialecto PostgreSQL. |
| Cancelación RSVP con credencial — B02/S2 | M | Sin token/propiedad no hay cambios; token caducado, usado o de otro evento falla; correo no actúa como contraseña. |
| Revocación de sesiones y refresh — B03/S7/Q6 | L | Reset/cambio de contraseña/rol/desactivación invalidan sesiones previas; refresh atómico y reutilización rechazada. UI sincroniza sesión y borra header Authorization al salir. |
| Autorización por registro — B07/B08 | M | Líder solo lista/modifica/aprueba según política acordada. La API impide operaciones fuera de alcance aunque se conozca ID. Restricción de reasignación y autoaprobación documentada. |
| DTO público y Replay — B04/S4/S5 | M | Respuestas editoriales sin datos privados; Replay protegido/excluido en rutas sensibles y verificado con DSN de pruebas. |
| Separación de archivos públicos/privados — B12/S6 | L | Comprobante privado no se descarga sin permiso; URLs temporales caducan; firma/formato y límites validados; archivos inválidos rechazados. |

Salida: regresiones negativas de cada P1 y verificación de permisos en router real. Guardar evidencia sin PII. Storage requiere una validación en staging con bucket de pruebas.

## Etapa 2 — Flujos y datos consistentes

| Tarea / hallazgos | Tamaño | Criterio de aceptación |
|---|---|---|
| Reset end-to-end — B09/Q1 | S/M | Email abre ruta correcta; payload compatible; token vencido/reusado rechazado; login nuevo funciona y sesiones viejas fallan. |
| Autoservicio de voluntario — B10/Q2/Q3 | M | Voluntario envía reporte propio y adjunto autorizado, lo ve y cierra modal; no elige arbitrariamente owner ni accede a panel admin. |
| Donación + boleta + verificación — B05/B14/Q4 | L | ID persistente, estados explícitos, transacción e idempotencia; duplicados/reintentos no duplican dinero ni registros; errores DB no responden éxito. |
| Importe y cupos RSVP — B06 | M/L | Q1 no confirma Q500; monto/currency correctos; receipt vinculado; validar reutilización y cupos concurrentes en PostgreSQL. |
| Moneda y datos históricos — B05 | M | Definir GTQ o agregados separados. Revisar registros existentes sin reclasificar masivamente como pagados/no pagados sin evidencia; backfill trazable y copia de seguridad. |
| Anuncios y caché por audiencia — B11/Q7 | M | Feed público sin contenido interno; autenticado privado/no-store; líder ve destinatarios correctos y cache no mezcla usuarios. |
| Error/vacío/carga y caché de cliente — Q5 | M | Fallo tiene mensaje/reintento; sin ficha tiene explicación/título; TTL refresca según contrato y no oculta fallos como listas vacías. |
| OG y rutas — B13/Q8 | M | Blog/evento se comparten con metadatos correctos; slug uniforme; crawler/staging y fallback comprobados. |

Salida: journeys integrados completos con usuarios sintéticos. Notificaciones salen después del commit; fallo de correo no revierte ni oculta estado real del pago.

## Etapa 3 — Sistema visual y accesibilidad

1. Documentar identidad real: navy, blanco, Arimo, fotografía de congregación y dos superficies. Resolver decisión de acento cálido/blanco antes de cambios globales.
2. Crear tokens semánticos, escala de texto/espacio/radios y sustituir tokens inexistentes. Corregir StatCard sobre fondo claro desde la estabilización.
3. Unificar componentes compartidos y modales; nombre/rol accesible, Escape, foco inicial, trap, retorno de foco y scroll de fondo. Reusar la implementación adecuada tras verificar comportamiento.
4. Etiquetas explícitas, IDs estables, teclado y estados de formulario comunes. Objetivo contraste AA: 4.5:1 texto normal, 3:1 texto grande y elementos gráficos relevantes.
5. Reducir overlays dobles, fondos excesivos y fondos con texto incrustado. Unificar fuente de configuración para fotos/fondos y hacer efectiva la personalización que ofrece el admin.
6. Revisar público → miembro → voluntario → líder → admin con datos poblados, vacío, error y sin permisos; escritorio y móvil.

Tamaño M/L. Salida: catálogo de componentes documentado, capturas comparables, checks de contraste/teclado y ausencia de scroll horizontal. No se considera completa solo porque coincide una captura de Home.

## Etapa 4 — Rendimiento y dependencias

- Optimizar imágenes a tamaños reales de uso, WebP/AVIF con fallback, `srcset`/`sizes`, recortes móviles y lazy loading salvo imagen principal. Conservar originales fuera del bundle servido.
- Medir bytes transferidos, LCP/CLS/INP en staging; establecer presupuesto a partir de esa línea base. Objetivo de referencia: LCP ≤2.5 s, CLS ≤0.1, INP ≤200 ms; pruebas de laboratorio no sustituyen percentil 75 de campo. Referencia: [Web Vitals, web.dev](https://web.dev/articles/vitals?hl=en).
- Separar cargas pesadas de editor, paneles y gráficos según medición. Evitar descargar módulos administrativos al abrir el sitio público.
- Actualizar dependencias con avisos por alcance y versión compatible; comprobar editor, sanitización, rutas y API. Analizar Go con scanner actualizado. No ejecutar actualizaciones mayores forzadas sin revisar migración.

Tamaño M. Salida: comparación medida antes/después y ausencia de regresiones visuales/funcionales; avisos restantes con justificación de alcance y seguimiento.

## Etapa 5 — Operación y cierre en staging

- Transacciones y errores coherentes; migraciones versionadas con plan de recuperación y verificación de datos, backups y restauración de prueba.
- Cola/outbox de correo, timeout y reintentos; digest deduplicado por periodo y zona `America/Guatemala`.
- Liveness y readiness diferenciados; body limits/timeouts/shutdown; logs sin tokens/correos sensibles. Verificar controles efectivos del proxy.
- Pool de conexiones calculado por réplicas; comprobar límite del pooler y carga esperada. Corregir error persistente del singleton si se mantiene esa arquitectura.
- Ensayar roles, caducidad/revocación, storage, caché, OG, pagos y concurrencia sobre PostgreSQL de pruebas. Revisar Chrome/Safari/Firefox y móvil representativo.

Tamaño M/L. Salida: checklist con evidencia de staging, limitaciones residuales y responsable de operación. No enviar pruebas a usuarios reales ni usar sus boletas.

## Primer bloque ejecutable

Orden recomendado para comenzar:

- [ ] Baseline Go/lint + pruebas aisladas de regresión para IDs, cancelación, reset y permisos.
- [ ] IDs parametrizados + DTO público; cerrar primero exposición y consultas públicas.
- [ ] Revocación de sesiones + cancelación con credencial.
- [ ] Matriz de aprobación/asignación y restricciones del servidor.
- [ ] Reset y autoservicio voluntario integrados; cierre modal y contraste StatCard.
- [ ] Modelo financiero transaccional e importe RSVP; preparar migración verificable.

No iniciar el pulimiento global mientras queden estas salidas P1 sin prueba. El catálogo visual y las decisiones de identidad pueden documentarse en paralelo al trabajo técnico, sin cambiar toda la aplicación de una vez.

## Registro de cierre por tarea

Cada entrega debe registrar: hallazgo, comportamiento anterior/nuevo, archivos afectados, prueba ejecutada, resultado, evidencia y riesgo pendiente. Actualizar el backlog con `pendiente`, `en curso`, `validado local` o `validado staging`; nunca usar `resuelto` solo por lectura de código.
