# Pruebas en Render

Decisión: 26 de octubre de 2026. Usar Render gratuito para pruebas; proponer el backend de pago para el lanzamiento. El frontend React/Vite puede alojarse como Static Site sin contratar un Web Service adicional.

`render.yaml` prepara dos servicios gratuitos. No crea otra base de datos, no contrata planes y no contiene secretos. Los despliegues automáticos están desactivados durante la preparación. La configuración usa el Dockerfile existente para Go y `npm ci && npm run build` para React.

## Configuración manual equivalente

| Campo | Backend | Frontend |
|---|---|---|
| Tipo | Web Service | Static Site |
| Root Directory | `backend` | `frontend` |
| Runtime | Docker | Static |
| Dockerfile/contexto | `./Dockerfile` / `.` | No aplica |
| Build Command | Lo define Dockerfile | `npm ci && npm run build` |
| Publish Directory | No aplica | `dist` |
| Health Check | `/health` | No aplica |
| Plan inicial | Free | Static gratuito |
| Región | Ohio, junto a la región de Supabase | CDN global |

Para React Router: añadir un rewrite de `/*` a `/index.html`.

## Variables

Render asigna `PORT`. Go ya lo lee y escucha en todas las interfaces. No hace falta cambiar el código del servidor.

Backend: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL` y las seis variables `CF_R2_*` enumeradas en el blueprint. `BASE_URL` se obtiene de `RENDER_EXTERNAL_URL`. Para la prueba sin correos reales, no configurar `BREVO_API_KEY`: el servicio de email ya omite envíos cuando falta esa clave. Configurar correo de prueba explícitamente si se necesita validar su entrega.

Frontend: `VITE_API_URL` debe ser la URL HTTPS real del backend Render (puede terminar en `/api/v1`); reconstruir el frontend después de cambiarla. En Static Sites no se ejecuta el middleware de Vercel ni se aplica `vercel.json`, por eso la API debe apuntar al backend directamente. La URL del frontend se configura en `CLIENT_URL` del backend para CORS.

Las pruebas con formularios deben usar usuarios y datos sintéticos, una conexión de base de pruebas y buckets de pruebas. El backend ejecuta AutoMigrate al arrancar: no usar la conexión de producción para ensayos destructivos. No reutilizar automáticamente secretos de Fly ni copiar un JWT de producción al blueprint de pruebas.

## Situación actual

El código local contiene correcciones que todavía no están en la rama remota. Render debe construir una rama que las incluya; conectar el `main` antiguo no publica los cambios de esta entrega. Antes de crear el servicio se debe revisar y publicar la rama de preparación.

La cuenta de Render está abierta por el usuario. La pantalla correcta para Go es **New Web Service**, no Worker. La publicación efectiva, permisos de repositorio y valores de configuración siguen pendientes.

## Límites y validación

Render Free suspende el backend tras 15 minutos sin tráfico; despertar puede tomar aproximadamente un minuto. Su disco es efímero: no usar el fallback local de uploads para conservar archivos. El frontend estático se entrega por CDN y no tiene ese ciclo de suspensión del backend.

Probar health, CORS, navegación directa a rutas, login y los formularios con fixtures. Medir carga en el nuevo despliegue antes de afirmar que soporta un pico de mil usuarios. La prueba local de doce donaciones concurrentes verifica consistencia de datos, no esa capacidad de tráfico.

Fuentes: [Blueprints](https://render.com/docs/blueprint-spec), [monorepos](https://render.com/docs/monorepo-support), [Static Sites](https://render.com/docs/static-sites), [limitaciones de Free](https://render.com/docs/free).
