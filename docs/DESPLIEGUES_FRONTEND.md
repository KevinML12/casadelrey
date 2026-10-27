# Canales del frontend

Actualizado el 27 de octubre de 2026.

| Canal | Rama | Publicación | API y datos |
| --- | --- | --- | --- |
| Enlace que tiene la iglesia | `main` | Git → Vercel Production, `https://casadelreyhue.vercel.app` | Backend real de Fly; conservar sus datos/configuración |
| Revisión del frontend nuevo en Vercel | `codex/render-qa` | Git → Vercel Preview; alias estable `https://casadelreyhue-git-codex-render-qa-kevinml12s-projects.vercel.app` | `/api` a través del rewrite existente hacia Fly; permite revisar el contenido real sin cambiar la base de datos |
| Pruebas del propietario | `codex/render-qa` | Render Static, despliegue manual, `https://casadelrey-web-pruebas.onrender.com` | Backend QA de Render y schema QA aislado |

La variable `VITE_API_URL=/api` se configura exclusivamente para las vistas previas de la rama de revisión en Vercel. Evita depender de que Fly permita por CORS cada dominio temporal de Vercel. El enlace de la iglesia conserva su configuración y las protecciones de las vistas previas no se desactivan.

El repositorio vinculado a Vercel es `KevinML12/casadelrey`, raíz `frontend`, proyecto `casadelreyhue`, Vite, Node 24. Cada push a una rama de trabajo produce una vista previa; sólo `main` publica el enlace de la iglesia. No usar comandos de promoción como sustituto de integrar el cambio revisado por Git.

## Compatibilidad antes de publicar para la iglesia

El backend de Fly que sirve el enlace de la iglesia todavía no incluye las extensiones publicadas en el backend QA. La nueva configuración `about_*`, los espacios automáticos de fotos de nuevos departamentos, la descarga autenticada de comprobantes y la cancelación de RSVP con código requieren esa versión del backend. No mezclar credenciales, schema QA ni registros sintéticos con producción para resolverlo.

Las vistas previas sirven para revisar el frontend; el enlace estable de la iglesia permanece en su versión anterior hasta sincronizar el contrato del backend. La revisión visual y las pruebas locales con API interceptada no sustituyen las pruebas finales del backend real. Los pendientes de producción están en `docs/release-2026-10-26/ESTADO.md`.
