# Canales del frontend

Actualizado el 28 de octubre de 2026, por decisión del propietario: publicar la revisión en `main`, retirar Fly de la conexión del frontend y utilizar el backend existente de Render conectado a Supabase.

| Canal | Rama | Publicación | API y datos |
| --- | --- | --- | --- |
| Enlace que tiene la iglesia | `main` | Git → Vercel Production, `https://casadelreyhue.vercel.app` | Rewrite `/api` → `https://casadelrey-api-pruebas.onrender.com/api`; PostgreSQL de Supabase |
| Revisión en Vercel | Ramas de trabajo | Git → Vercel Preview | El mismo rewrite hacia Render; conservar la protección de previews |
| Pruebas del propietario | Rama configurada en Render | Render Static, despliegue manual, `https://casadelrey-web-pruebas.onrender.com` | API de Render y schema QA de Supabase |

Vercel: repositorio `KevinML12/casadelrey`, raíz `frontend`, proyecto `casadelreyhue`, Vite, Node 24. `VITE_API_URL=/api` y `VITE_API_TIMEOUT_MS=90000` para Production/Preview. Los rewrites raíz y frontend coinciden. Sólo el backend guarda las credenciales de Supabase, JWT y R2; nunca se envían al navegador.

El backend de Render ya incluye los campos institucionales `about_*`, espacios administrables para nuevos departamentos, comprobantes privados y cancelación de RSVP con código. El servicio gratuito puede tardar en despertar; el tiempo de espera del cliente contempla ese arranque.

## Datos y alcance

El backend mantiene su conexión al schema `cdr_render_qa`, ahora con una importación autorizada del contenido activo histórico y las cuentas no eliminadas. El origen `public` se conserva. Las relaciones usan un mapa de IDs; las sesiones y tokens no se copian. Los administradores pueden editar el contenido importado desde los mismos recursos. La importación no traslada el historial financiero, comprobantes, solicitudes ni reportes del origen.

La galería conserva todos sus registros importados, con duplicados exactos del mismo álbum e imágenes externas de ejemplo archivados en destino. Inicio y los módulos públicos comparten escenas fotográficas administrables y cristal fijo. Ver `release-2026-10-28/CONTENIDO_ACTIVO.md`. Las pruebas de escritura deben identificar y limpiar sus propios registros, sin tratar las colecciones importadas como datos desechables.

Fly deja de ser destino de los dos rewrites activos. No se elimina infraestructura ni datos históricos. Las pruebas de escritura de la revisión se limitan al backend Render QA y usan registros sintéticos con limpieza.

Evidencia de esta revisión en `docs/release-2026-10-27/`; las comprobaciones anteriores se conservan como historial en `docs/release-2026-10-26/`.
