# Auditoría de backend y verificación de contratos

Fecha: 3 de octubre de 2026. Base: `01d597d` con los cambios de trabajo existentes. P1: antes de ampliar funcionalidades; P2: siguiente ciclo; P3: mantenimiento. La severidad expresa impacto potencial; no certifica explotación en producción.

## Resultado y método

El backend sí valida JWT y restringe grupos por rol, pero hay brechas entre esos controles generales, los permisos por registro y las reglas de negocio. Los errores del frontend en recuperación de contraseña y reportes de voluntario tienen una causa comprobada en el contrato de API.

Se ejecutaron **31 casos** contra el router Echo y los handlers reales: JWT firmados de usuarios sintéticos, SQLite en memoria y almacenamiento falso. La red externa se bloqueó dentro del reproductor. Treinta casos hicieron peticiones HTTP locales al router; uno inspeccionó SQL generado con el dialecto PostgreSQL y sqlmock. No se cargó `.env`, no se usaron cuentas reales, no se llamó a producción ni se enviaron correos. Este arnés no ejecuta `main.go`: CORS, logging y configuración global del servidor se revisaron por lectura.

Los 31 casos reprodujeron el comportamiento esperado del código actual. **Esto no significa que los 31 controles sean seguros:** varias expectativas documentan precisamente comportamientos que deben cambiar. No hay PostgreSQL real en esta verificación, pruebas de concurrencia ni mediciones de carga. SQLite no sustituye esas validaciones.

Evidencia: [resultados](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/backend-verification.json), [reproductor](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/backend-verification.go), [suite fresca](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/backend-tests-fresh.txt), [vet](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/backend-vet.txt). Consultar [reproducción](/Users/kevv/Documents/proyectos/casadelreyhue/docs/auditoria-2026-10-03/README.md).

## Controles que funcionaron

- KPIs administrativos: anónimo 401; miembro, voluntario y líder 403; administrador 200.
- KPIs de líder: miembro y voluntario 403; líder y administrador 200.
- JWT con firma falsa: 401. Los JWT sin firma de las capturas frontend no superan la API real.
- Existen controles de rol, límites de frecuencia y contraseñas con hash. Se valida extensión y tamaño de uploads. Estas protecciones no reemplazan autorización por objeto ni validación del contenido.

## Hallazgos reproducidos y contratos

| ID | Prioridad / impacto | Prueba y consecuencia | Corrección y criterio de cierre |
|---|---|---|---|
| B01 / S1 | P1 / Alta | `First(&event, eventID)` recibe string público. El dialecto PostgreSQL genera `WHERE 1=1`, y las únicas variables son el LIMIT. La prueba previa de SQLite ejecuta esa condición. | Parsear todos los IDs como enteros positivos; consultas parametrizadas. IDs negativos, cero, texto y condiciones deben dar 400 sin acceder a otro registro. |
| B02 / S2 | P1 / Alta | DELETE de RSVP sin Authorization: 200 y registro ajeno eliminado usando su email. | Token de cancelación de un solo uso o sesión y propiedad; sin credencial válida, ningún registro cambia. |
| B03 / S7 | P1 / Alta | Tras reset, access y refresh anteriores siguen dando 200. Después de degradar admin a member, su JWT previo obtiene KPIs admin con 200. | Revocación/versionado de sesión al cambiar contraseña, rol o estado; refresh rotativo y almacenado como hash. Tokens anteriores deben fallar inmediatamente. |
| B04 / S4 | P1 / Alta | Blog público devuelve email, teléfono y dirección del autor; anuncio público también devuelve dirección. | DTO público mínimo. Pruebas deben excluir contacto privado y metadatos de cuenta en todas las respuestas públicas. No se observaron passwords ni tokens serializados. |
| B05 / S3 | P1 / Alta | Intención pública presencial en USD se guarda `is_successful=true` sin pago confirmado. | Estados explícitos y agregados solo verificados; GTQ validado o totales separados por moneda. Una intención no incrementa dinero recibido. |
| B06 | P1 / Alta | Comprobante verificado de Q1 asociado al correo/evento permite RSVP de 5 personas con precio Q100; HTTP 201 y `payment_status=verificado`. Se requieren Q500. | Validar total, moneda, evento, titular y asociación; definir uso parcial/reutilización. Insuficiencia nunca produce estado verificado ni sobreventa. |
| B07 | P1 / Alta | Un líder aprueba el reporte de otro usuario: 200 y estado aprobado. El listado limita a no-admin a sus propios reportes, pero aprobar no aplica esa restricción. | Matriz explícita de quién presenta/revisa/aprueba; alcance por área/equipo o aprobación solo admin. Probar acceso ajeno y autoaprobación según política. |
| B08 | P1 / alcance por definir | Un líder lista y modifica notas de una tarjeta asignada a otro: 200 y cambio persistido. No hay restricción por asignación. | Documentar si el seguimiento es global o asignado. La asignación por sí sola no prueba política de acceso. Si es asignado, filtrar listado y autorizar cada modificación en servidor; restringir reasignación. |
| B09 / Q1 | P1 / Flujo roto | Frontend envía `{token,password}`: 400; `{token,newPassword}`: 200. Además, email construye `/reset-password?token=…`, mientras UI usa `/reset-password/:token`. | Unificar URL y contrato; recorrer email → formulario → reset → login con la contraseña nueva. |
| B10 / Q2 | P1 / Flujo roto | Voluntario POST reporte y upload: 403. Líder/admin pueden crear reporte; líder puede upload. | Endpoint de autoservicio voluntario con owner del JWT; no abrir administración completa. Listar y editar propios; otro usuario 403/404 según política. |
| B11 / Q7 | P2 / Integración | GET anuncios con JWT líder no muestra anuncio leader: la ruta pública no pobla `user_role`. Respuesta con caché pública. | Separar feed público y autenticado; este último privado/no-store. No añadir auth opcional manteniendo la caché pública de contenido personalizado. |
| B12 / S6 | P2 / Media | Líder sube texto con nombre `.jpg`: 201. MIME depende de extensión. | Validar contenido real y límites antes de parsear; separar fotos públicas y comprobantes privados. No se demostró RCE ni XSS. |
| B13 / Q8 | P2 / Integración | Router responde 404 a `/api/v1/og`. Middleware frontend referencia OG y `/eventos`, UI usa `/events`. | Unificar slugs, contrato OG y fallback; probar crawler en staging. La efectividad del rewrite del hosting no fue comprobada. |

Referencias de código:
- B01–B02–B06: [rsvp.handler.go](/Users/kevv/Documents/proyectos/casadelreyhue/backend/handlers/rsvp.handler.go:25).
- B03: [auth.handler.go](/Users/kevv/Documents/proyectos/casadelreyhue/backend/auth/auth.handler.go:281), [auth.middleware.go](/Users/kevv/Documents/proyectos/casadelreyhue/backend/middleware/auth.middleware.go:20) y [admin.go](/Users/kevv/Documents/proyectos/casadelreyhue/backend/handlers/admin.go).
- B04: [blog.handler.go](/Users/kevv/Documents/proyectos/casadelreyhue/backend/handlers/blog.handler.go:27) y [announcement.handler.go](/Users/kevv/Documents/proyectos/casadelreyhue/backend/handlers/announcement.handler.go:24).
- B05: [donation.handler.go](/Users/kevv/Documents/proyectos/casadelreyhue/backend/handlers/donation.handler.go:24) y [donation.go](/Users/kevv/Documents/proyectos/casadelreyhue/backend/models/donation.go:20).
- B07: [volunteer_report.handler.go](/Users/kevv/Documents/proyectos/casadelreyhue/backend/handlers/volunteer_report.handler.go:70) y [routes.go](/Users/kevv/Documents/proyectos/casadelreyhue/backend/routes/routes.go:339).
- B08: [connect_card.handler.go](/Users/kevv/Documents/proyectos/casadelreyhue/backend/handlers/connect_card.handler.go:98).
- B09: [auth.handler.go](/Users/kevv/Documents/proyectos/casadelreyhue/backend/auth/auth.handler.go:281) y [email.templates.go](/Users/kevv/Documents/proyectos/casadelreyhue/backend/email/email.templates.go:154).
- B10–B11: [routes.go](/Users/kevv/Documents/proyectos/casadelreyhue/backend/routes/routes.go:111).
- B12: [upload.handler.go](/Users/kevv/Documents/proyectos/casadelreyhue/backend/handlers/upload.handler.go:41) y [storage.go](/Users/kevv/Documents/proyectos/casadelreyhue/backend/storage/storage.go:218).

## Persistencia y operación: revisión estática

**B14 — P1: comprobantes y donaciones no forman una operación consistente.** El frontend hace dos POST sin vincular `donation_id`; aunque el modelo contempla esa relación, verificar un comprobante solo actualiza RSVP. En `Verify` y `Revert` hay escrituras sin comprobar error y sin transacción conjunta. Ante fallo de base, el handler puede responder éxito o dejar estados divergentes. No se inyectó una caída real de DB. Corregir con transacción, errores comprobados, idempotencia, relación persistente y notificación después del commit. Referencia: [payment_receipt.handler.go](/Users/kevv/Documents/proyectos/casadelreyhue/backend/handlers/payment_receipt.handler.go:103).

**B15 — P2: correo y digest sin garantía de entrega única.** `http.DefaultClient` no tiene timeout explícito en el envío; el trabajo asíncrono no es una cola durable. El digest se programa por instancia y usa zona horaria del servidor. Varias réplicas pueden duplicarlo; el horario no asegura Guatemala. No se activó ningún envío. Usar outbox/cola, timeout, reintentos acotados, deduplicación y `America/Guatemala`. Referencias: E[email.templates.go](/Users/kevv/Documents/proyectos/casadelreyhue/backend/email/email.templates.go:154) y [routes.go](/Users/kevv/Documents/proyectos/casadelreyhue/backend/routes/routes.go:389).

**B16 — P2: endurecimiento de arranque, recursos y logs.** `/health` devuelve estado estático; no confirma DB. No se ve body limit global previo al multipart, timeouts HTTP explícitos ni apagado gradual. Logger usa URI completa: query strings con correo/token pueden quedar en logs. Revisar configuración efectiva del proxy antes de declarar una exposición externa; sanitizar datos sensibles y separar liveness/readiness. Referencias: [main.go](/Users/kevv/Documents/proyectos/casadelreyhue/backend/main.go:70) y [routes.go](/Users/kevv/Documents/proyectos/casadelreyhue/backend/routes/routes.go:66).

**B17 — P2/P3: migraciones y pool.** El estado actual limita a **10 conexiones abiertas y 5 inactivas por proceso**; no se repite como vigente un valor mayor de informes antiguos. Dimensionar por total de réplicas y pooler efectivo. AutoMigrate corre al arrancar: pasar cambios sensibles a migraciones versionadas y verificadas. `Connect` guarda el error en una variable local dentro de `once.Do`: tras fallo inicial, otra llamada podría retornar nil sin conservar ese error; actualmente main termina ante el primer error. Referencia: [database.go](/Users/kevv/Documents/proyectos/casadelreyhue/backend/database/database.go:33).

## Estado de validación

`go test -count=1 ./...` se volvió a ejecutar: pasan auth, handlers, middleware, routes, storage y suites e2e/security. **El comando global falla** porque `scripts/seed_users/main.go:7` importa `strings` sin usar. No atribuir a una regresión nueva: ya existía antes de la auditoría. `go vet ./auth ./handlers ./middleware ./routes ./storage` terminó exitosamente.

No se ejecutó escáner actualizado de CVEs Go ni pentest de infraestructura. Los reportes npm pertenecen al frontend y sus avisos deben evaluarse según alcance. Pendiente en staging: PostgreSQL y locks/concurrencia, bucket privado/URLs firmadas, proxy y TLS, revocación desplegada, backups/restauración, correo con cuenta de pruebas, OG y feeds con datos poblados.

Guías primarias para las correcciones: [GORM Security](https://gorm.io/docs/security.html), [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), [OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html). No se asignaron CVEs ni puntuaciones CVSS a fallos propios sin evaluación formal.
