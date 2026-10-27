# Canales del frontend

Actualizado el 27 de octubre de 2026, por decisión del propietario: publicar la revisión en `main`, retirar Fly de la conexión del frontend y utilizar el backend existente de Render conectado a Supabase.

| Canal | Rama | Publicación | API y datos |
| --- | --- | --- | --- |
| Enlace que tiene la iglesia | `main` | Git → Vercel Production, `https://casadelreyhue.vercel.app` | Rewrite `/api` → `https://casadelrey-api-pruebas.onrender.com/api`; PostgreSQL de Supabase |
| Revisión en Vercel | Ramas de trabajo | Git → Vercel Preview | El mismo rewrite hacia Render; conservar la protección de previews |
| Pruebas del propietario | Rama configurada en Render | Render Static, despliegue manual, `https://casadelrey-web-pruebas.onrender.com` | API de Render y schema QA de Supabase |

Vercel: repositorio `KevinML12/casadelrey`, raíz `frontend`, proyecto `casadelreyhue`, Vite, Node 24. `VITE_API_URL=/api` y `VITE_API_TIMEOUT_MS=90000` para Production/Preview. Los rewrites raíz y frontend coinciden. Sólo el backend guarda las credenciales de Supabase, JWT y R2; nunca se envían al navegador.

El backend de Render ya incluye los campos institucionales `about_*`, espacios administrables para nuevos departamentos, comprobantes privados y cancelación de RSVP con código. El servicio gratuito puede tardar en despertar; el tiempo de espera del cliente contempla ese arranque.

## Datos y alcance

El backend existente mantiene su conexión al proyecto Supabase en el schema aislado `cdr_render_qa`. Publicar el frontend **no migra los registros históricos** del schema de producción ni cambia sus permisos. Las colecciones vacías se muestran como vacías, sin inventar departamentos, álbumes o fotografías. La publicación de contenido real y la habilitación final del correo transaccional siguen siendo tareas separadas de esta revisión.

Fly deja de ser destino de los dos rewrites activos. No se elimina infraestructura ni datos históricos. Las pruebas de escritura de la revisión se limitan al backend Render QA y usan registros sintéticos con limpieza.

Evidencia de esta revisión en `docs/release-2026-10-27/`; las comprobaciones anteriores se conservan como historial en `docs/release-2026-10-26/`.
