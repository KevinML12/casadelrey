# DOC_MAESTRO — Casa del Rey MVP

> Documento único de referencia técnica. Versión post-auditoría: Marzo 2026.

---

## Índice

1. [Stack y Arquitectura](#1-stack-y-arquitectura)
2. [Estructura del Proyecto](#2-estructura-del-proyecto)
3. [Backend (Go Fiber)](#3-backend-go-fiber)
4. [Frontend (React + Vite + Tailwind)](#4-frontend-react--vite--tailwind)
5. [Variables de Entorno](#5-variables-de-entorno)
6. [API Reference](#6-api-reference)
7. [Despliegue](#7-despliegue)
8. [Estado Actual y Roadmap](#8-estado-actual-y-roadmap)

---

## 1. Stack y Arquitectura

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite 7 + Tailwind CSS 3 |
| Backend | Go + Fiber v2 |
| Base de Datos | PostgreSQL via GORM |
| Auth | JWT (golang-jwt/jwt v5) |
| Email | SendGrid |
| Deploy Backend | Fly.io (región SCL) |
| Deploy Frontend | SiteGround (build estático) |

**Flujo general:**
```
Browser → React SPA → Axios (+ JWT interceptor) → Go Fiber API → PostgreSQL
```

---

## 2. Estructura del Proyecto

```
casadelreyhue/
├── .gitignore
├── DOC_MAESTRO.md          ← este archivo
├── frontend/               ← React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/    (Header, Footer, ProtectedRoute)
│   │   │   └── ui/        (Button, Card, Input)
│   │   ├── context/       (AuthContext, SiteConfigContext)
│   │   ├── hooks/         (useApiCall, useDarkMode)
│   │   ├── lib/           (apiClient.js, supabaseClient.js)
│   │   ├── pages/
│   │   │   ├── public/    (Home, Login, Register, Blog, Events, Prayer, Donate, About…)
│   │   │   └── admin/     (Dashboard, AdminBlog, AdminEvents, AdminPetitions, Profile)
│   │   ├── App.jsx
│   │   ├── router.jsx
│   │   └── index.css
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── backend/                ← Go Fiber
    ├── main.go
    ├── go.mod
    ├── Dockerfile
    ├── fly.toml
    ├── config/            (config.go → LoadConfig + InitDB)
    ├── models/            (models.go → User, Post, Petition, Donation)
    ├── auth/              (auth.handler.go, auth.model.go, auth.service.go)
    ├── handlers/          (blog.handler.go, petition.handler.go, donation.handler.go, events.go, admin.go)
    ├── middleware/        (supabase.middleware.go)
    ├── routes/            (routes.go)
    └── email/             (email.service.go, email.templates.go)
```

---

## 3. Backend (Go Fiber)

### Entrypoint (`main.go`)

1. `config.LoadConfig()` + `godotenv.Load()`
2. `config.InitDB()` → conecta PostgreSQL + AutoMigrate
3. Inicializa Fiber + CORS
4. Inyecta handlers: `auth`, `blog`, `petition`, `donation`
5. `routes.SetupRoutes()` → registra todas las rutas
6. Escucha en `PORT` (default `8080`)

### Modelos activos (`models/models.go`)

| Modelo | Campos clave |
|---|---|
| `User` | id, name, email, password (hash), role |
| `Post` | id, title, slug, content, author_id, status |
| `Petition` | id, name, email, phone, subject, message, is_answered |
| `Donation` | id, name, email, amount, currency, payment_method, transaction_id, is_successful |

> **Nota:** El modelo `auth.User` (en `auth/auth.model.go`) extiende `User` con campos `ResetToken` y `ResetTokenExpiry` para el flujo de recuperación de contraseña.

### Rutas activas (`routes/routes.go`)

| Método | Ruta | Handler | Auth |
|---|---|---|---|
| GET | `/health` | inline | — |
| POST | `/api/v1/auth/register` | auth.Register | — |
| POST | `/api/v1/auth/login` | auth.Login | — |
| POST | `/api/v1/auth/forgot-password` | auth.ForgotPassword | — |
| POST | `/api/v1/auth/reset-password` | auth.ResetPassword | — |
| GET | `/api/v1/blog/` | blog.GetPublishedPosts | — |
| GET | `/api/v1/blog/:slug` | blog.GetPostBySlug | — |
| POST | `/api/v1/contact/petition` | petition.CreatePetition | — |
| POST | `/api/v1/donations/simulate` | donation.SimulateDonation | — |
| GET | `/api/v1/events/` | placeholder 503 | — |
| GET | `/api/v1/admin/dashboard` | placeholder 503 | JWT |
| POST | `/api/v1/admin/blog/` | blog.CreatePost | JWT |
| PUT | `/api/v1/admin/blog/:id` | blog.UpdatePost | JWT |
| GET | `/api/v1/admin/petitions` | petition.GetAll | JWT |
| PUT | `/api/v1/admin/petitions/:id/read` | petition.MarkAsRead | JWT |

### Dependencias Go (`go.mod`)

```
github.com/gofiber/fiber/v2 v2.52.5
github.com/golang-jwt/jwt/v5 v5.3.0
gorm.io/driver/postgres v1.6.0
gorm.io/gorm v1.31.1
github.com/sendgrid/sendgrid-go
github.com/joho/godotenv
```

> `github.com/labstack/echo/v4` debe ser eliminado del `go.mod` ya que todos los handlers Echo fueron removidos en la limpieza.

---

## 4. Frontend (React + Vite + Tailwind)

### Paleta de colores (Tailwind config)

La paleta está definida en `frontend/tailwind.config.js`. Tonos eclesiales:

- **Primary** (`#0066FF`) → acciones principales
- **Accent / Dorado** (`#D4AF37`) → destacados y CTA premium
- **Fondo** (`#F5E6D3` crema) → background base
- **Dark mode** activado via clase `html.dark`

### Componentes UI (`src/components/ui/`)

| Componente | Descripción |
|---|---|
| `Button.jsx` | 6 variantes (primary, secondary, outline, ghost, accent, danger), 4 tamaños |
| `Card.jsx` | Floating card pattern con subcomponentes (CardHeader, CardContent, CardFooter) |
| `Input.jsx` | Input + Textarea con soft UI focus states |

### Contextos

- **`AuthContext.jsx`** — gestiona JWT en `localStorage`, provee `user`, `token`, `login`, `logout`, `isAuthenticated`, `isAdmin`
- **`SiteConfigContext.jsx`** — centraliza `VITE_*` env vars (`apiUrl`, `stripePublicKey`, etc.)

### Cliente HTTP (`src/lib/apiClient.js`)

Axios con interceptores:
- **Request:** inyecta `Authorization: Bearer <token>` desde localStorage
- **Response:** detecta 401 → limpia token → redirige a `/login`

### Rutas definidas (`router.jsx`)

**Públicas:** `/`, `/about`, `/blog`, `/blog/:slug`, `/events`, `/prayer`, `/donate`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/volunteering`, `/payment-success`

**Admin (requieren `ProtectedRoute adminOnly`):** `/admin`, `/admin/blog`, `/admin/events`, `/admin/petitions`, `/admin/profile`

### Dependencias Frontend (`package.json`)

```
react + react-dom
react-router-dom ^7
axios
@tanstack/react-query ^5
react-hook-form
framer-motion
lucide-react + @heroicons/react
@supabase/supabase-js
@stripe/react-stripe-js + @stripe/stripe-js
react-big-calendar
recharts
date-fns
react-hot-toast
jwt-decode
```

---

## 5. Variables de Entorno

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_APP_ID=casa-del-rey
VITE_APP_TITLE=Casa del Rey
```

### Backend (`backend/.env`)

```env
DATABASE_URL=postgres://user:pass@host/db
JWT_SECRET=secreto_muy_seguro
SENDGRID_API_KEY=SG.xxx
PORT=8080
ENV=development
```

> **IMPORTANTE:** Nunca commitear `.env` con secretos reales. El `.gitignore` raíz ya los excluye.

---

## 6. API Reference

### Auth

```
POST /api/v1/auth/register
Body: { name, email, password }
Response: { token, user: { id, name, email, role } }

POST /api/v1/auth/login
Body: { email, password }
Response: { token, user }

POST /api/v1/auth/forgot-password
Body: { email }
Response: { message }

POST /api/v1/auth/reset-password
Body: { token, password }
Response: { message }
```

### Blog

```
GET  /api/v1/blog/           → lista posts publicados
GET  /api/v1/blog/:slug      → post por slug
POST /api/v1/admin/blog/     → crear post (admin JWT)
PUT  /api/v1/admin/blog/:id  → actualizar post (admin JWT)
```

### Peticiones de Oración

```
POST /api/v1/contact/petition
Body: { name, email, phone, subject, message }
Response: { id, message }

GET /api/v1/admin/petitions              → listar todas (admin JWT)
PUT /api/v1/admin/petitions/:id/read     → marcar como leída (admin JWT)
```

### Donaciones

```
POST /api/v1/donations/simulate
Body: { name, email, amount, currency, payment_method }
Response: { id, status, message }
```

---

## 7. Despliegue

### Backend → Fly.io

```bash
cd backend
fly secrets set DATABASE_URL="postgres://..."
fly secrets set JWT_SECRET="..."
fly secrets set SENDGRID_API_KEY="..."
fly deploy
```

El `Dockerfile` usa build multi-stage (Go 1.24-alpine → alpine:3.18).
El `fly.toml` usa detección automática del Dockerfile (sin builder explícito).

### Frontend → SiteGround (build estático)

```bash
cd frontend
npm run build   # genera dist/
```

Subir contenido de `dist/` a `public_html/` de SiteGround.

Crear `public_html/.htaccess`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Scripts locales

```bash
# Frontend
cd frontend && npm run dev       # http://localhost:5173
cd frontend && npm run build

# Backend
cd backend && go run main.go     # http://localhost:8080
cd backend && go build -o main .
```

---

## 8. Estado Actual y Roadmap

### ✅ Funcional (post-limpieza Marzo 2026)

- Autenticación completa (register, login, forgot/reset password)
- Blog público (lectura) + admin (crear/editar)
- Peticiones de oración (envío público + admin)
- Donaciones simuladas
- Header, Footer, ProtectedRoute
- Dark mode
- Todas las páginas públicas y admin skeleton

### ⚠️ Pendiente / Deuda técnica

- `GET /api/v1/events/` → placeholder 503, necesita implementación real
- `GET /api/v1/admin/dashboard` → placeholder 503, necesita stats reales
- Auth inconsistente: `AuthContext` usa JWT propio pero `supabaseClient.js` existe sin uso. Decisión pendiente: migrar auth a Supabase Auth o mantener JWT propio
- `echo` y `jwt/v4` aún en `go.mod` → ejecutar `go mod tidy` para limpiar
- Stripe integración: el frontend tiene `@stripe/react-stripe-js` instalado pero la lógica es simulada

### Fase 2 — Nueva Arquitectura (próximo sprint)

- Migrar DB a **Supabase** (PostgreSQL managed)
- Decidir auth strategy: **Supabase Auth** vs JWT propio
- Nuevo `HeroSection` premium en `Home.jsx`
- `PrayerForm` componente dedicado
- `DonationCard` componente con UI real
- Conectar backend Go a Supabase via PostgreSQL directo (connection string de Supabase)
