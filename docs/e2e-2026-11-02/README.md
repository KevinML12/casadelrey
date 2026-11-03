# Revisión integral de roles y flujos

Se ejecuta la aplicación completa en Chromium contra el backend Go y una base PostgreSQL local desechable. Los cinco perfiles iniciales son administrador, líder, otro líder, miembro y voluntario. Sus contraseñas se generan al azar; correos reservados `.invalid`, archivos y registros desaparecen al cerrar la suite. El proceso no hereda las claves de Supabase, R2 o Brevo y no realiza cobros ni envíos de correo reales.

## Resultado

154 escenarios de navegador aprobados y 7 escenarios antiguos de Render omitidos deliberadamente. Suite Go completa con detector de carreras y PostgreSQL desechable, `go vet` y compilación correctos. ESLint sin errores y 11 advertencias previas.

## Cobertura real de extremo a extremo

- Navegación autenticada de los 27 módulos administrativos y los 11 del líder; perfil de miembro, panel de voluntario y las rutas públicas, a 390 y 1440 px. Se detectan errores de JavaScript, respuestas fallidas de API y desbordamiento horizontal.
- Creación de cuentas desde ambos paneles, verificación, acceso, recuperación, cambio de contraseña e invalidación de sesiones antiguas. Los enlaces se leen de la base o de la cola cifrada local, como lo haría el destinatario; no se publica una ruta para obtenerlos.
- Crear, editar y eliminar/ocultar categorías de células, departamentos, destinos de aportes, preguntas frecuentes, fichas del directorio, anuncios y fotografías de galería. Publicar, actualizar y ocultar una célula; editar la reunión desde su líder.
- Solicitud pública de célula, asignación automática, aislamiento entre líderes y seguimiento hasta integrado. Boletas de nuevos miembros con permisos de lectura y edición.
- Inscripción de voluntario, asignación desde administración, creación de su cuenta por el líder asignado, verificación, reporte de servicio y aprobación administrativa visible para el voluntario.
- Reporte de célula y aprobación administrativa; metas personales; publicación/edición/eliminación de artículos; carga y activación del hero; redes administrables; solicitud pública de oración y lectura administrativa.
- Evento gratuito con foto, publicación e inscripción; bloqueo de cobro cuando faltan datos bancarios. Aporte en persona pendiente, confirmación, corrección y auditoría. Comprobante privado, rechazo razonado, enlace de corrección obtenido de la cola cifrada, reenvío y aprobación.
- Soporte con archivo real en almacenamiento privado local, conversación, resolución, reapertura y aislamiento entre usuarios. Anuncios según el rol y limpieza del contenido al cerrar sesión.
- Acceso a registros posteriores a la primera página, etiquetas de formularios, teclado, foco, diálogos superpuestos, movimientos reducidos y diseño público existente.

Se conserva además la suite de interfaces con API interceptada para fallos de red, reintentos, conflictos, pagos, errores de carga, responsividad de 320 a 1440 px y reglas visuales. Estos casos complementan los flujos reales; no se contabilizan como pruebas contra servicios externos.

## Correcciones encontradas

1. Subir comprobantes enviaba FormData con el encabezado JSON. El cliente ahora deja al navegador construir correctamente el formulario y su separador multipart.
2. La verificación de correo consumía dos veces el enlace de un solo uso al comprobar efectos en desarrollo. Reutiliza la misma petición y descarta respuestas de efectos ya cerrados.
3. Una actualización tardía del caso de soporte sobrescribía el estado elegido por el administrador. El borrador se conserva hasta guardar o recibir un conflicto explícito.
4. Las solicitudes de conexión no se filtraban por líder. La lectura y actualización ahora exigen su asignación; sólo administración cambia o retira responsables y comprueba que sean válidos.
5. Los anuncios no recibían la sesión validada en el servidor. Ahora respetan el rol vigente, rechazan sesiones revocadas y excluyen las respuestas autenticadas de la caché compartida. El frontend separa y retira su contenido al cambiar de sesión.
6. El navegador podía reutilizar contenido público anterior después de editarlo desde el panel. Las respuestas autenticadas son privadas, sin almacenamiento, y varían por autorización.
7. El panel no ofrecía crear cuentas de miembros, pese a que ese era el camino indicado al público. Se añadió el formulario compartido; un líder únicamente crea miembros y el servidor conserva la decisión de permisos.
8. Los reportes de voluntarios se guardaban sin una vista administrativa de revisión. Ahora administración puede aprobar/rechazar y cada voluntario consulta el estado de los suyos.
9. Varias listas sólo permitían ver la primera página. Se añadió navegación en usuarios con búsqueda desde el servidor, blog, boletas, solicitudes y voluntariado; las etiquetas ya no incorporan el texto de ayuda como nombre del campo.

## Repetir la comprobación

Requiere Go, Node, las dependencias del frontend, Chromium de Playwright y las herramientas locales de PostgreSQL (`initdb`, `pg_ctl`, `createdb`, `psql`). Desde la raíz:

```sh
python3 ops/test_fullstack.py --all
python3 ops/test_local_postgres.py
npm --prefix frontend run lint
npm --prefix frontend run build
```

Para repetir sólo los flujos reales: `python3 ops/test_fullstack.py`. El comando se limita a direcciones de bucle local y una base llamada `cdr_e2e`; termina servicios, elimina las cuentas y limpia sus archivos. Los diagnósticos pueden contener contraseñas y enlaces temporales ya caducados: permanecen locales y se excluyen de Git.

## Alcance de la entrega

Las pruebas mutables no se ejecutan contra los registros de la iglesia. Los siete escenarios antiguos que requieren habilitación expresa contra Render se omiten; sus operaciones principales se cubren con el nuevo entorno completo y desechable. La comprobación publicada es de disponibilidad, rutas y versión, sin crear personas ficticias en la base compartida.

La entrega real de correo, las transferencias bancarias y la aceptación con personas reales siguen requiriendo a sus titulares. La iglesia aún no tiene dominio propio y cargará sus datos bancarios desde Configuración. No se contrató ningún plan. Los respaldos cifrados y las comprobaciones de permisos de almacenamiento se mantienen en el procedimiento operativo existente.
