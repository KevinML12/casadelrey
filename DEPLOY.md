# Guía Completa de Despliegue - Casa del Rey MVP

## Arquitectura Híbrida

- **Backend Go + API:** Fly.io
- **Frontend React (Build estático):** SiteGround
- **Base de Datos:** ElephantSQL (PostgreSQL)

---

## 📋 Pre-requisitos

### Cuentas Necesarias
- ✅ Cuenta en [ElephantSQL](https://www.elephantsql.com/) (PostgreSQL gratuito)
- ✅ Cuenta en [Fly.io](https://fly.io/) (Backend)
- ✅ Cuenta en [SiteGround](https://www.siteground.com/) (Frontend)
- ✅ Dominio configurado apuntando a SiteGround

### Herramientas Instaladas
- ✅ Go 1.23+
- ✅ Node.js 18+
- ✅ pnpm
- ✅ Fly CLI: `curl -L https://fly.io/install.sh | sh`

---

## 🗄️ PASO 1: Configurar Base de Datos (ElephantSQL)

### 1.1 Crear Instancia
1. Inicia sesión en https://www.elephantsql.com/
2. Click en "Create New Instance"
3. Selecciona el plan **Tiny Turtle** (Gratis)
4. Elige un nombre: `casadelrey-mvp`
5. Selecciona la región más cercana a Chile
6. Click en "Create Instance"

### 1.2 Obtener URL de Conexión
1. Click en la instancia creada
2. Copia la **URL** que se ve así:
   ```
   postgres://usuario:password@hostname.db.elephantsql.com/database_name
   ```
3. **Guarda esta URL** - la necesitarás para el backend

---

## 🚀 PASO 2: Desplegar Backend en Fly.io

### 2.1 Preparar el Proyecto
```bash
cd backend
```

### 2.2 Inicializar Fly.io
```bash
fly launch
```

Responde a las preguntas:
- **App name:** `casadelrey-mvp` (o el que prefieras)
- **Region:** Santiago (scl)
- **PostgreSQL database:** NO (ya tenemos ElephantSQL)
- **Redis:** NO

### 2.3 Configurar Variables de Entorno (Secrets)

```bash
# Variable de base de datos (reemplaza con tu URL de ElephantSQL)
fly secrets set DATABASE_URL="postgres://usuario:password@hostname.db.elephantsql.com/database_name"

# Modo de producción
fly secrets set ENV="production"

# URL del frontend (actualizar cuando tengas el dominio final)
fly secrets set VITE_API_BASE_URL="https://casadelrey.com"

# PayPal (opcional, para futura implementación)
fly secrets set PAYMENT_PAYPAL_CLIENT_ID="tu_paypal_client_id"
fly secrets set PAYMENT_PAYPAL_SECRET="tu_paypal_secret"
```

### 2.4 Verificar fly.toml

Asegúrate que `backend/fly.toml` tenga esta configuración:

```toml
app = "casadelrey-mvp"
primary_region = "scl"

[build]
  builder = "paketobuildpacks/builder-jammy-full"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[vm]]
  memory = '256mb'
  cpu_kind = 'shared'
  cpus = 1
```

### 2.5 Generar Build del Frontend

**IMPORTANTE:** El backend servirá el build estático del frontend.

```bash
# Desde la raíz del proyecto
cd frontend
pnpm run build
```

Esto generará la carpeta `frontend/dist/`

### 2.6 Desplegar a Fly.io

```bash
cd ../backend
fly deploy
```

### 2.7 Verificar el Despliegue

```bash
# Ver logs
fly logs

# Abrir en navegador
fly open

# Verificar health check
curl https://casadelrey-mvp.fly.dev/api/health
```

Deberías ver:
```json
{
  "status": "ok",
  "service": "CasaDelRey Backend API"
}
```

---

## 🌐 PASO 3: Desplegar Frontend en SiteGround

### 3.1 Preparar el Build

```bash
cd frontend
pnpm run build
```

### 3.2 Configurar Variable de Entorno para Producción

Crea `frontend/.env.production`:
```env
VITE_API_BASE_URL=https://casadelrey-mvp.fly.dev
```

### 3.3 Regenerar Build con URL de Producción

```bash
pnpm run build
```

### 3.4 Subir a SiteGround

**Opción A: Via FTP/SFTP**
1. Conecta via FileZilla o similar
2. Navega a `public_html/`
3. Sube TODOS los archivos de `frontend/dist/`:
   - `index.html`
   - `assets/` (carpeta completa)
   - Cualquier otro archivo generado

**Opción B: Via cPanel File Manager**
1. Inicia sesión en cPanel de SiteGround
2. Abre "File Manager"
3. Navega a `public_html/`
4. Sube los archivos de `frontend/dist/`
5. Extrae si subiste un ZIP

### 3.5 Configurar .htaccess para SPA

Crea/edita `public_html/.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Redirigir llamadas API al backend de Fly.io
  RewriteCond %{REQUEST_URI} ^/api/
  RewriteRule ^api/(.*)$ https://casadelrey-mvp.fly.dev/api/$1 [P,L]
  
  # Servir index.html para todas las rutas (SPA)
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 🔄 PASO 4: Configurar Proxy Inverso (Opcional pero Recomendado)

### Opción A: Via .htaccess (Ya configurado arriba)

El `.htaccess` ya redirige `/api/*` a Fly.io.

### Opción B: Via Cloudflare (Recomendado para HTTPS y Cache)

1. Agrega tu dominio a Cloudflare
2. Configura DNS:
   - **Tipo A:** `@` → IP de SiteGround (para el frontend)
   - **Tipo CNAME:** `api` → `casadelrey-mvp.fly.dev` (para el backend)

3. En tu aplicación, usa:
   - Frontend: `https://casadelrey.com`
   - API: `https://api.casadelrey.com`

4. Actualiza `frontend/.env.production`:
```env
VITE_API_BASE_URL=https://api.casadelrey.com
```

---

## ✅ PASO 5: Verificación Final

### 5.1 Verificar Frontend
```bash
curl https://casadelrey.com
```
Deberías ver el HTML de React.

### 5.2 Verificar API
```bash
curl https://casadelrey.com/api/health
```
o
```bash
curl https://api.casadelrey.com/api/health
```

Deberías ver:
```json
{
  "status": "ok",
  "service": "CasaDelRey Backend API"
}
```

### 5.3 Probar Formularios
1. Abre https://casadelrey.com en el navegador
2. Desplázate al formulario de peticiones
3. Llena y envía una petición de prueba
4. Verifica que se guarde en la base de datos

---

## 🔧 Comandos Útiles de Fly.io

```bash
# Ver logs en tiempo real
fly logs

# Ver estado de la app
fly status

# Conectarse por SSH
fly ssh console

# Reiniciar la app
fly restart

# Ver todas las apps
fly apps list

# Ver secretos configurados
fly secrets list

# Actualizar un secreto
fly secrets set NOMBRE_VARIABLE="nuevo_valor"

# Desplegar nueva versión
fly deploy
```

---

## 📊 Monitoreo

### Fly.io Dashboard
https://fly.io/dashboard

### ElephantSQL Dashboard
https://customer.elephantsql.com/

### Métricas Importantes
- **Uso de CPU/Memoria** en Fly.io
- **Conexiones a la BD** en ElephantSQL
- **Logs de errores** en Fly.io

---

## 🔒 Seguridad en Producción

### CORS
El backend ya está configurado para aceptar `*`. En producción, actualiza en `main.go`:

```go
e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
    AllowOrigins: []string{"https://casadelrey.com"},
    AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept},
    AllowMethods: []string{"GET", "POST"},
}))
```

### HTTPS
- Fly.io: HTTPS automático
- SiteGround: Activar SSL Let's Encrypt en cPanel

---

## 🆘 Troubleshooting

### Error: "DATABASE_URL no está configurada"
```bash
fly secrets set DATABASE_URL="tu_url_aqui"
fly restart
```

### Error: "fetch failed" en el frontend
- Verifica que `.env.production` tenga la URL correcta
- Regenera el build: `pnpm run build`
- Vuelve a subir a SiteGround

### Error 404 en rutas del frontend
- Verifica que `.htaccess` esté configurado
- SiteGround: Activa "mod_rewrite" en cPanel

### Base de datos no se conecta
- Verifica que la URL de ElephantSQL sea correcta
- Verifica que no haya firewall bloqueando Fly.io

---

## 📝 Checklist Final

- [ ] Base de datos creada en ElephantSQL
- [ ] Backend desplegado en Fly.io
- [ ] Secrets configurados en Fly.io
- [ ] Build del frontend generado
- [ ] Frontend subido a SiteGround
- [ ] .htaccess configurado
- [ ] Dominio apuntando a SiteGround
- [ ] SSL activo en ambos servicios
- [ ] Formularios funcionando
- [ ] API respondiendo correctamente

---

## 🎉 ¡Proyecto Desplegado!

Tu aplicación está ahora en producción:
- **Frontend:** https://casadelrey.com
- **API:** https://casadelrey-mvp.fly.dev/api (o https://api.casadelrey.com)
- **Base de Datos:** ElephantSQL

---

## 📚 Próximos Pasos

1. Configurar dominio personalizado en Fly.io
2. Implementar integración real con pasarela de pago
3. Configurar webhooks para confirmaciones
4. Implementar sistema de emails
5. Agregar Google Analytics
6. Configurar backups automáticos de la BD
