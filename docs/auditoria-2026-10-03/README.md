# Reproducción local de la auditoría

Desde `frontend`, iniciar Vite con `VITE_API_URL=http://127.0.0.1:18080 VITE_SENTRY_DSN= npm run dev -- --host 127.0.0.1 --port 5173`.

Desde la raíz, ejecutar `node docs/auditoria-2026-10-03/audit-ui.cjs` y `node docs/auditoria-2026-10-03/audit-interactions.cjs`. Estos scripts interceptan API y bloquean hosts externos; las sesiones son fixtures sintéticos sin firma real. Regeneran evidencia en esta carpeta.

Desde `backend`, ejecutar `go run ../docs/auditoria-2026-10-03/security-repro.go`. El reproductor crea SQLite en memoria y un storage falso; no utiliza configuración ni bases reales.

`npm audit --json` y `npm audit --omit=dev --json` generan los reportes de dependencias. Sus resultados cambian con el registro; los archivos conservan el resultado obtenido en esta auditoría.

Las capturas son escenarios controlados y no demuestran el estado del despliegue público. Las cifras de imágenes son sumas de archivos locales, no Core Web Vitals.

## Verificación del router backend

Desde `backend`, ejecutar:

```sh
go run ../docs/auditoria-2026-10-03/backend-verification.go > ../docs/auditoria-2026-10-03/backend-verification.json 2> ../docs/auditoria-2026-10-03/backend-verification-stderr.txt
go test -count=1 ./...
go vet ./auth ./handlers ./middleware ./routes ./storage
```

El reproductor firma JWT de fixtures con secreto sintético, usa SQLite en memoria/storage falso y bloquea red externa. No carga configuración real ni `.env`. El caso PostgreSQL inspecciona SQL con sqlmock, sin conectar a una DB real. No ejecuta middlewares de `main.go` ni todas las rutas registradas. Las 31 expectativas describen comportamiento actual, incluyendo fallos; `matches_current_behavior=true` no certifica seguridad. Después de corregir el código se deben cambiar los criterios de regresión.

El comando global de tests actualmente falla por import `strings` sin usar en `scripts/seed_users`; los paquetes con pruebas pasaron en la ejecución fresca.
