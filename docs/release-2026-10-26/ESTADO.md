# Estado de la entrega — 26 de octubre de 2026

## Diseño aplicado

Inicio usado como referencia e importado mediante el MCP de Pen al archivo `Casa-del-Rey-Liquid-Glass.pen`. El documento contiene la referencia, los tokens, un componente reutilizable de cristal y una composición de Nosotros. Las comprobaciones estructurales del canvas no reportaron recortes.

El frontend conserva el tono del blanco escarchado. El material oscuro usa un gradiente de blanco al 5%, 1.4% y 0.8%, con desenfoque de 8 px, borde fino y bisel estático. Se eliminaron las capas especulares de hover y el seguimiento del cursor/tacto, así como el hook de listeners que las alimentaba. Se conservan el movimiento de presión y la profundidad de las tarjetas.

PageHero unifica foto, scrim, ancho y espaciado; Eventos ya utiliza el mismo componente. Se eliminó el overlay duplicado que apagaba las fotos de los encabezados. Admin/líder/voluntario comparten material claro y fondo fotográfico tenue. Las imágenes de sección ahora permiten carga diferida y decodificación asíncrona.

Se normalizó la configuración de API para admitir base de dominio, `/api` y `/api/v1`, se corrigió el proxy del `vercel.json` raíz y se rechazan respuestas HTML antes de que un feed las interprete como listas. `.vercelignore` excluye fotos originales, documentos, diseños, secretos locales y artefactos de pruebas del upload.

## Validación

- Go: suite completa y `go vet ./...` aprobados.
- PostgreSQL 18 local desechable: doce peticiones concurrentes, una donación y un comprobante; prueba con detector de carreras aprobada. La prueba exige un host local y crea su propio schema.
- UI Chromium: diez pruebas aprobadas. Incluyen 12 rutas públicas a 390 y 1440 px sin desbordamiento horizontal, materiales estáticos, reset, modales, voluntario, donaciones y comprobantes privados. API interceptada; no se envían formularios de pruebas a producción.
- Build aprobado; lint sin errores, con 20 advertencias existentes. Persiste aviso por tamaño del bundle.
- Capturas locales de Home, Nosotros y Donar en ambas resoluciones en esta carpeta.

## Infraestructura observada

Supabase fue restaurado por el usuario. La API anterior de Fly vuelve a responder HTTP 200 en health, eventos y settings.

Se generó y verificó un backup completo en formato pg_dump: `~/.codex/backups/casadelrey/pre-release-2026-10-26.dump`, protegido con permisos 0600 y carpeta 0700. El índice del archivo contiene 669 entradas. No está dentro del repositorio ni se subió al hosting.

Inventario de los datos reales: tres registros de comprobantes con referencias antiguas y tres objetos en el prefijo público `comprobantes/`. Después se comprobó desde Brave que el bucket privado faltaba y se creó `casadelreyhue-receipts-private`, con acceso público desactivado. La credencial existente autentica al bucket de medios, pero todavía devuelve `AccessDenied` en el privado; falta ampliar su alcance y comprobar PUT/GET. No se cambiaron las referencias reales ni se eliminaron objetos históricos.

## Despliegue

Vista previa Vercel construida y estado Ready:

https://casadelreyhue-flo7e0ux1-kevinml12s-projects.vercel.app

Se comprobó HTTP 200 en `/` y `/api/v1/events/` usando el acceso autorizado de Vercel. La vista previa puede requerir sesión de Vercel. No fue promovida a producción.

Fly rechazó la construcción de imagen con HTTP 403 por facturas vencidas. No se actualizó el backend ni se intentó cobrar. El usuario decidió usar Render gratuito para pruebas. La rama `codex/render-qa` está publicada e incluye el blueprint de backend y frontend estático.

Con autorización del usuario se crearon un schema y un usuario exclusivos de pruebas en Supabase. La comprobación de permisos confirmó que el usuario no puede leer ni modificar las tablas de `public`, `auth` o `storage`. Se prepararon un JWT independiente y un pool de tres conexiones, con una cuarta reservada para mantenimiento; no se copiaron registros ni claves de correo reales. Se crearon fixtures sintéticos, identificados como pruebas, y se dejó vacía la cuenta bancaria.

Backend y frontend están **Live** en Render desde `9b89545`:

- https://casadelrey-api-pruebas.onrender.com
- https://casadelrey-web-pruebas.onrender.com

Se verificaron CORS, rutas internas, Home con datos sintéticos y 16 comprobaciones funcionales del backend publicado: login, donación sin duplicados y lectura privada exclusiva de admin, entre otras. Los archivos de esa prueba fueron desechables en disco efímero. Por instrucción posterior del usuario se guardaron las variables R2 de Fly mediante **Save only** en Render; no se reinició el backend con esa configuración pendiente del permiso al bucket privado. Los despliegues automáticos quedaron desactivados en ambos servicios. La espera del cliente se está ajustando para el despertar de Render Free; el plazo de producción se conserva.

## Pasos restantes para publicar

1. Permitir acceso al bucket privado con la credencial R2 autorizada y validar PUT/GET antes de reiniciar el backend de Render con esa configuración.
2. Preparar la configuración definitiva de producción y migrar las tres boletas mediante copia verificada y backup de referencias. Retirar los originales públicos después de verificar la migración y su posible caché.
3. Publicar el backend con la base de producción y comprobar migraciones aditivas, health, correo y permisos. Las credenciales actuales de Render son de pruebas.
4. Construir la entrega definitiva del frontend y conectar el dominio de producción. La publicación actual bajo `*-pruebas.onrender.com` no sustituye este paso.

La auditoría global conserva tareas de autorización por registro, correos reales, metadatos y rendimiento detalladas en el plan de mejora. Esta entrega no certifica que todos esos pendientes estén cerrados.
