# CONTEXTO_RECONSTRUCCION_FRONTEND

## Descripción General

Blueprint técnico completo para la reconstrucción total del frontend de React de **Casa del Rey**. Este documento especifica la arquitectura, las dependencias, la estética visual, la configuración técnica y el mapeo exacto de endpoints que debe consumir el cliente.

---

## 1. REQUISITOS DE ESTILO (Estética Shopify/Apple)

### 1.1 Filosofía Visual

El frontend debe implementar **Soft UI** con uniformidad absoluta en todas las páginas:

- **Estilo Base**: Diseño minimalista, limpio, con énfasis en la legibilidad y espaciado generoso.
- **Componentes**: Tarjetas blancas flotantes sobre fondos base (efecto de elevación sutil).
- **Transiciones**: Animaciones suaves con Framer Motion (300-500ms por defecto).
- **Consistencia**: Un único system design sin excepciones.

### 1.2 Tipografía

- **Familia Única**: `Inter` para todos los textos (headings, body, labels).
- **Versión**: `@import url('https://rsms.me/inter/inter.css')` en CSS global.
- **Pesos Utilizados**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold).
- **Tamaños Base**:
  - `h1`: 32px (600)
  - `h2`: 24px (600)
  - `h3`: 20px (600)
  - `body`: 16px (400)
  - `small`: 14px (400)
  - `caption`: 12px (500)

### 1.3 Paleta de Colores (Estética Eclesial)

Diseñada para reflejar elegancia espiritual con calidez litúrgica, manteniendo la claridad de Shopify y la minimalismo de Apple.

```css
/* Fondos Base (Crema Cálida) */
--bg-light: #F5E6D3;      /* Fondo base todas las páginas (crema suave) */
--bg-light-alt: #FAFAF8;  /* Alternativo más claro */
--bg-dark: #2C1810;       /* Modo oscuro (marrón oscuro eclesial) */

/* Tarjetas y Componentes */
--card-bg: #FFFBF7;       /* Tarjetas blancas cálidas (con tono crema) */
--card-shadow: rgba(44, 24, 16, 0.06);  /* Sombra sutil marrón */

/* Colores Primarios (Litúrgico) */
--primary: #6B4423;       /* Caoba (acción, botones, CTA) */
--primary-dark: #5A3A1A;  /* Caoba oscura (hover) */
--primary-light: #8B7355; /* Taupe (estados alternativos) */

/* Acento Dorado (Aspecto Sagrado) */
--accent: #D4AF37;        /* Dorado litúrgico (destacados, títulos premium) */
--accent-dark: #B8940C;   /* Dorado oscuro (hover) */
--accent-light: #E8C547;  /* Dorado claro (overlays) */

/* Estados (Mantener Estándar) */
--success: #10B981;       /* Verde (confirmaciones) */
--warning: #F59E0B;       /* Ámbar (advertencias) */
--error: #DC2626;         /* Rojo cálido (errores) */
--info: #06B6D4;          /* Cian (información) */

/* Textos */
--text-primary: #2C1810;     /* Marrón oscuro (texto principal) */
--text-secondary: #6B7280;   /* Gris (texto secundario) */
--text-muted: #A6988F;       /* Beige gris (texto tenue) */
--text-light: #FFFBF7;       /* Crema (texto en fondos oscuros) */

/* Bordes */
--border: #E5D9CA;        /* Borde marrón muy suave */
--border-dark: #D4C4B3;   /* Borde marrón medio */
```

**Guía de Aplicación**:
- **Fondos**: Usar `#F5E6D3` en todas las páginas (uniformidad).
- **Componentes**: Tarjetas blancas flotantes con sombra marrón.
- **Botones CTA**: Caoba `#6B4423` para acción primaria.
- **Acentos Especiales**: Dorado `#D4AF37` para títulos de secciones importantes.
- **Modo Oscuro**: Marrón `#2C1810` con texto claro `#FFFBF7`.

### 1.4 Estructura de Componentes

**Patrón de Tarjeta Base** (aplicar a todo contenido):

```jsx
/* Cada sección de contenido debe ser una tarjeta flotante */
.card {
  background: var(--card-bg);        /* #FFFBF7 */
  border-radius: 12px;
  box-shadow: 0 2px 8px var(--card-shadow);  /* Marrón sutil */
  padding: 24px;
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 16px rgba(44, 24, 16, 0.1);  /* Sombra marrón en hover */
}

/* Botón Primario (Caoba) */
.btn-primary {
  background: var(--primary);        /* #6B4423 */
  color: var(--text-light);          /* #FFFBF7 */
  border-radius: 12px;
  font-weight: 600;
  padding: 12px 24px;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.btn-primary:hover {
  background: var(--primary-dark);   /* #5A3A1A */
  box-shadow: 0 4px 12px rgba(44, 24, 16, 0.3);
}

/* Acento Dorado (Títulos Premium) */
.accent-text {
  color: var(--accent);              /* #D4AF37 */
  font-weight: 700;
}

.accent-border-top {
  border-top: 3px solid var(--accent);
}
```

**Estructura de Página Base**:

```jsx
<main bg=#F5E6D3>
  <div className="min-h-screen bg-light p-6">
    <div className="max-w-6xl mx-auto">
      {/* Contenido en tarjetas blancas flotantes */}
      <div className="card">
        {children}
      </div>
    </div>
  </div>
</main>
```

---

## 4. AUDITORÍA Y DEPURACIÓN DE ARCHIVOS

### 4.1 Componentes UI a Depurar

**Estado de componentes shadcn/ui**:

| Archivo | Usado | Estado | Observación |
|---------|-------|--------|-------------|
| `Button-shadcn.tsx` | ❌ No | ⚠️ REMOVER | Usar `Button.jsx` personalizado en su lugar |
| `Card-shadcn.tsx` | ✅ Sí | ⚠️ MANTENER | Usado por `YouTubeFeatured.jsx` (ver abajo) |
| `Input-shadcn.tsx` | ❌ No | ⚠️ REMOVER | Usar `Input.jsx` personalizado |
| `Select-shadcn.tsx` | ❌ No | ⚠️ REMOVER | Usar radix-ui directamente o simplificar |
| `Table-shadcn.tsx` | ❌ No | ⚠️ REMOVER | No usado en admin pages |
| `Tabs-shadcn.tsx` | ❌ No | ⚠️ REMOVER | No usado actualmente |

**Acción**: Eliminar los componentes no utilizados. Mantener solo `Card-shadcn.tsx` por ahora.

### 4.2 Páginas Admin Duplicadas/Innecesarias

| Archivo | Descripción | Acción |
|---------|-------------|--------|
| `MyGroupsPage.jsx` | Listado de grupos (mock data) | ⚠️ REMOVER - Backend no tiene `/api/groups` |
| `GroupsPage.jsx` | Listado de ministerios (mock data) | ⚠️ REMOVER - Backend no tiene `/api/groups` |

**Nota**: El backend no tiene endpoints para gestionar grupos. Estas páginas son especulativas. **Acción**: Eliminarlas del router y mantener solo si se agregan endpoints backend.

### 4.3 Componentes de Home que Requieren Endpoints

| Componente | Usa Endpoint | Endpoint | Acción |
|-----------|--------------|----------|--------|
| `HeroBanner.jsx` | ❌ No | N/A | ✅ MANTENER (static) |
| `HistorySection.jsx` | ❌ No | N/A | ✅ MANTENER (static) |
| `FaithDeclaration.jsx` | ❌ No | N/A | ✅ MANTENER (static) |
| `EventosNoticias.jsx` | ✅ Sí | `/api/events` + `/api/blog/posts` | ✅ MANTENER |
| `GalleryGrid.jsx` | ❌ No | N/A | ✅ MANTENER (puede ser rellenado después) |
| `Multimedia.jsx` | ❌ No | N/A | ✅ MANTENER (puede ser rellenado después) |
| `YouTubeFeatured.jsx` | ✅ Sí | `/api/youtube/latest` ❌ NO EXISTE | ⚠️ REMOVER - Endpoint inexistente |
| `SocialMediaFeed.jsx` | ❌ No | N/A | ✅ MANTENER (puede ser rellenado después) |

**Acción**: Remover `YouTubeFeatured.jsx` del Home porque llama a `/api/youtube/latest` que no existe en backend.

### 4.4 Contextos (State Management)

| Contexto | Propósito | Uso | Acción |
|----------|-----------|-----|--------|
| `AuthContext.jsx` | Autenticación (user, token) | ✅ Alto (usado en ProtectedRoute, Headers) | ✅ MANTENER |
| `SiteConfigContext.jsx` | Configuración global del sitio | ⚠️ Bajo (usado en Header) | ✅ MANTENER pero simplificar |
| `ThemeProvider.jsx` | Dark Mode toggle | ⚠️ Bajo (opcional) | ⚠️ OPCIONAL - No es crítico |

**Recomendación**: Mantener `AuthContext` y `SiteConfigContext`. El `ThemeProvider` es opcional pero útil para dark mode.

---

## 5. ARQUITECTURA TÉCNICA Y DEPENDENCIAS

### 5.1 Stack Tecnológico

| Categoría | Librería | Versión | Propósito |
|-----------|----------|---------|----------|
| **Enrutamiento** | `react-router-dom` | 6.x | Navegación SPA y rutas protegidas |
| **HTTP Client** | `axios` | 1.x | Peticiones HTTP con interceptores |
| **State Management (Queries)** | `@tanstack/react-query` | 5.x | Sincronización de datos servidor/cliente |
| **Formularios** | `react-hook-form` | 7.x | Validación y gestión de formularios |
| **Animaciones** | `framer-motion` | 12.x | Transiciones y animaciones suaves |
| **Notificaciones** | `react-hot-toast` | 2.x | Toasts para feedback del usuario |
| **Estilos** | `tailwindcss` | 3.4.x | Utilidades CSS, sistema de diseño |
| **Calendario** | `react-big-calendar` | 1.19.x | Visualización de eventos |
| **Editor Rich Text** | `react-quill` | 2.x | Edición de posts/contenido |
| **Gráficos** | `recharts` | 3.4.x | Visualización de estadísticas (admin) |
| **Pagos** | `@stripe/react-stripe-js` | 5.x | Integración Stripe (donaciones) |
| **State (Local)** | `zustand` | 5.x | Alternativa a Redux para estado simple |
| **Íconos** | `lucide-react`, `@heroicons/react` | Latest | Íconos consistentes |
| **Tipado** | `typescript` | 5.x | Type-safety en componentes |

### 5.2 Dependencias Instaladas (package.json)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.x.x",
    "axios": "^1.x.x",
    "@tanstack/react-query": "^5.90.10",
    "react-hook-form": "^7.66.0",
    "framer-motion": "^12.23.24",
    "react-hot-toast": "^2.6.0",
    "tailwindcss": "^3.4.1",
    "@stripe/react-stripe-js": "^5.3.0",
    "@stripe/stripe-js": "^8.4.0",
    "zustand": "^5.0.8",
    "recharts": "^3.4.1",
    "react-big-calendar": "^1.19.4",
    "react-quill": "^2.0.0",
    "@heroicons/react": "^2.2.0",
    "lucide-react": "^0.553.0",
    "react-icons": "^5.5.0",
    "date-fns": "^4.1.0",
    "clsx": "^2.1.1",
    "class-variance-authority": "^0.7.1",
    "tailwind-merge": "^3.4.0"
  }
}
```

### 5.3 Configuración de Axios (HTTP Client)

**Ubicación**: `src/lib/api.js`

```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar JWT en headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejo de errores 401/403
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Limpiar auth y redirigir a login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

### 5.4 AuthContext (Gestión de Autenticación)

**Ubicación**: `src/context/AuthContext.jsx`

**Responsabilidades**:
- Mantener estado del usuario autenticado (`user`, `token`, `isAuthenticated`).
- Métodos: `login()`, `logout()`, `register()`.
- Persistencia en localStorage.
- Sincronización entre pestañas (opcional: storage events).

**Interfaz Exportada**:

```javascript
export const useAuth = () => {
  const { user, token, isLoading, login, logout, register, isAuthenticated } = useContext(AuthContext);
  // ...
};
```

**Estructura de `user`**:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  role: 'member' | 'admin';
}
```

### 5.5 SiteConfigContext (Configuración Global)

**Ubicación**: `src/context/SiteConfigContext.jsx`

**Responsabilidades**:
- Parámetros globales: URLs de API, colores, idioma.
- Métodos: `getConfigValue()`, `updateConfig()`.
- Inyectar datos desde backend (KPIs, configuración dinámica).

**Interfaz Exportada**:

```javascript
export const useSiteConfig = () => {
  const { apiUrl, appTitle, theme, isDarkMode, toggleDarkMode } = useContext(SiteConfigContext);
  // ...
};
```

---

## 6. FUNCIONALIDAD TRANSACCIONAL Y ENDPOINTS

### 6.1 Base URL del Backend

```
Desarrollo: http://localhost:8080
Producción: https://api.casadelrey.com (configurar en .env)
```

### 6.2 Mapeo de Endpoints: Públicos

#### 6.2.1 Autenticación

| Método | Ruta | Consumido Por | Parámetros | Respuesta |
|--------|------|---------------|-----------|-----------|
| `POST` | `/api/auth/register` | LoginPage, RegisterPage | `{ email, password, name }` | `{ user: User, token: string }` |
| `POST` | `/api/auth/login` | LoginPage | `{ email, password }` | `{ user: User, token: string }` |
| `POST` | `/api/auth/forgot-password` | LoginPage | `{ email }` | `{ message: string }` |
| `POST` | `/api/auth/reset-password` | ResetPasswordPage | `{ token, password }` | `{ success: boolean }` |
| `GET` | `/api/health` | App (health check) | - | `{ status: ok, service: string }` |

#### 6.2.2 Blog (Posts)

| Método | Ruta | Consumido Por | Parámetros | Respuesta |
|--------|------|---------------|-----------|----------|
| `GET` | `/api/blog/posts` | Home, Blog Page | `?page=1&limit=10` | `{ posts: Post[], total: number }` |
| `GET` | `/api/blog/posts/:slug` | PostDetailPage | - | `{ post: Post }` |

#### 6.2.3 Eventos

| Método | Ruta | Consumido Por | Parámetros | Respuesta |
|--------|------|---------------|-----------|-----------|
| `GET` | `/api/events` | Home, EventsPage | `?month=YYYY-MM` | `{ events: Event[] }` |
| `GET` | `/api/events/:id` | EventDetailPage | - | `{ event: Event }` |

#### 6.2.4 Peticiones (Oración Confidencial)

| Método | Ruta | Consumido Por | Parámetros | Respuesta |
|--------|------|---------------|-----------|----------|
| `POST` | `/api/contact/petition` | PrayerFormPage | `{ name, email, phone?, petition: string }` | `{ id: number, success: boolean }` |

#### 6.2.5 Donaciones (Stripe)

| Método | Ruta | Consumido Por | Parámetros | Respuesta |
|--------|------|---------------|-----------|-----------|
| `POST` | `/api/donate/stripe` | StripeFormPage | `{ amount: number, email, name, currency: "USD" \| "COP" }` | `{ clientSecret: string, stripeKey: string }` |

---

### 6.3 Mapeo de Endpoints: Protegidos (Require JWT)

#### 6.3.1 Perfil (Usuario Autenticado)

| Método | Ruta | Consumido Por | Parámetros | Respuesta |
|--------|------|---------------|-----------|-----------|
| `GET` | `/api/protected/profile` | ProfilePage | Header: `Authorization: Bearer {token}` | `{ user_id: number, role: string, ...userData }` |

---

### 6.4 Mapeo de Endpoints: Admin (Require JWT + Admin Role)

#### 6.4.1 Dashboard (KPIs)

| Método | Ruta | Consumido Por | Parámetros | Respuesta |
|--------|------|---------------|-----------|-----------|
| `GET` | `/api/admin/dashboard` | DashboardPage | Header: `Authorization: Bearer {token}` | `{ message: string, user_id: number, role: string }` |
| `GET` | `/api/admin/kpis` | DashboardPage | - | `{ totalDonations: number, totalPetitions: number, totalEvents: number, totalPosts: number }` |

#### 6.4.2 Donaciones (Admin)

| Método | Ruta | Consumido Por | Parámetros | Respuesta |
|--------|------|---------------|-----------|-----------|
| `GET` | `/api/admin/donations` | DonationHistoryPage | `?page=1&limit=20` | `{ donations: Donation[], total: number }` |

**Estructura Donation**:
```typescript
interface Donation {
  id: number;
  user_id: number;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  stripe_payment_id: string;
  created_at: string;
}
```

#### 6.4.3 Peticiones (Admin)

| Método | Ruta | Consumido Por | Parámetros | Respuesta |
|--------|------|---------------|-----------|-----------|
| `GET` | `/api/admin/petitions` | AdminPetitionsPage | `?page=1&limit=20` | `{ petitions: Petition[], total: number }` |
| `PUT` | `/api/admin/petitions/:id/read` | AdminPetitionsPage | - | `{ success: boolean, message: string }` |

**Estructura Petition**:
```typescript
interface Petition {
  id: number;
  name: string;
  email: string;
  phone?: string;
  petition: string;
  is_read: boolean;
  created_at: string;
}
```

#### 6.4.4 Blog (Admin CRUD)

| Método | Ruta | Consumido Por | Parámetros | Respuesta |
|--------|------|---------------|-----------|-----------|
| `POST` | `/api/admin/blog` | AdminBlogEditor | `{ title, slug, content, excerpt, featured_image_url, author_id }` | `{ id: number, post: Post }` |
| `PUT` | `/api/admin/blog/:id` | AdminBlogEditor | `{ title, slug, content, excerpt, featured_image_url }` | `{ post: Post }` |

**Estructura Post**:
```typescript
interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image_url?: string;
  author_id: number;
  views: number;
  created_at: string;
  updated_at: string;
}
```

#### 6.4.5 Eventos (Admin CRUD)

| Método | Ruta | Consumido Por | Parámetros | Respuesta |
|--------|------|---------------|-----------|-----------|
| `POST` | `/api/admin/events` | AdminEventsPage | `{ title, description, start_time, end_time, location }` | `{ id: number, event: Event }` |

**Estructura Event**:
```typescript
interface Event {
  id: number;
  title: string;
  description: string;
  start_time: string; // ISO 8601
  end_time: string;
  location: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}
```

---

## 7. ESTRUCTURA DE ARCHIVOS DEL FRONTEND

### 7.1 Raíz del Proyecto

```
frontend/
├── package.json
├── vite.config.js
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── index.html
└── src/
```

### 7.2 Directorio `src/`

```
src/
├── main.jsx                       # Entry point
├── App.jsx                        # Root component
├── index.css                      # Estilos globales
├── router.jsx                     # Configuración de rutas
│
├── context/
│   ├── AuthContext.jsx            # Autenticación global
│   └── SiteConfigContext.jsx      # Configuración global
│
├── contexts/
│   └── ThemeProvider.jsx          # Proveedor de tema (Dark Mode)
│
├── layouts/
│   ├── PublicLayout.jsx           # Layout para rutas públicas
│   └── AdminLayout.jsx            # Layout para rutas admin
│
├── pages/
│   ├── Home.jsx                   # Página principal
│   ├── HistoryPage.jsx            # Historia de la iglesia
│   ├── EventsPage.jsx             # Listado de eventos
│   ├── EventDetailPage.jsx        # Detalle de evento
│   ├── PostDetailPage.jsx         # Detalle de blog post
│   ├── DonationPage.jsx           # Opciones de donación
│   ├── StripeFormPage.jsx         # Formulario Stripe
│   ├── PrayerOptionsPage.jsx      # Opciones de oración
│   ├── PrayerFormPage.jsx         # Formulario oración confidencial
│   ├── auth/
│   │   ├── LoginPage.jsx          # Inicio de sesión
│   │   └── RegisterPage.jsx       # Registro de usuario
│   └── admin/
│       ├── DashboardPage.jsx      # Dashboard con KPIs
│       ├── ProfilePage.jsx        # Perfil de usuario
│       ├── DonationHistoryPage.jsx # Historial de donaciones
│       ├── GroupsPage.jsx         # Gestión de grupos
│       ├── MyGroupsPage.jsx       # Mis grupos
│       ├── AdminBlogPage.jsx      # Listado de posts
│       ├── AdminBlogEditor.jsx    # Crear/editar posts
│       ├── AdminEventsPage.jsx    # Gestión de eventos
│       └── AdminPetitionsPage.jsx # Gestión de peticiones
│
├── components/
│   ├── NewsletterSignup.jsx       # Suscripción newsletter
│   ├── layout/
│   │   ├── Header.jsx             # Encabezado navegación
│   │   ├── Footer.jsx             # Pie de página
│   │   └── Sidebar.jsx            # Barra lateral admin
│   ├── auth/
│   │   └── ProtectedRoute.jsx     # Wrapper para rutas protegidas
│   ├── Home/
│   │   ├── HeroBanner.jsx         # Banner principal
│   │   ├── HistorySection.jsx     # Sección de historia
│   │   ├── EventosNoticias.jsx    # Próximos eventos/noticias
│   │   ├── FaithDeclaration.jsx   # Declaración de fe
│   │   └── Multimedia.jsx         # Multimedia (videos, etc)
│   ├── Blog/
│   │   └── PostCard.jsx           # Card de post
│   ├── SocialMedia/
│   │   ├── SocialMediaFeed.jsx    # Feed social
│   │   ├── GalleryGrid.jsx        # Galería
│   │   └── YouTubeFeatured.jsx    # Videos destacados
│   ├── admin/
│   │   ├── StatCard.jsx           # Card de estadísticas
│   │   ├── GroupCard.jsx          # Card de grupo
│   │   └── SkeletonCard.jsx       # Skeleton loader
│   └── ui/
│       ├── Button.jsx             # Botón base
│       ├── Button-shadcn.tsx      # Botón shadcn/ui
│       ├── Input.jsx              # Input base
│       ├── Input-shadcn.tsx       # Input shadcn/ui
│       ├── Card.jsx               # Card base
│       ├── Card-shadcn.tsx        # Card shadcn/ui
│       ├── Tabs-shadcn.tsx        # Tabs shadcn/ui
│       ├── Table-shadcn.tsx       # Table shadcn/ui
│       ├── Select-shadcn.tsx      # Select shadcn/ui
│       └── InfoCard.jsx           # Card info generalista
│
├── lib/
│   ├── api.js                     # Configuración axios
│   └── utils.ts                   # Utilidades (classnames, format, etc)
│
└── styles/
    └── calendar.css               # Estilos calendario
```

---

## 8. CONFIGURACIÓN DE RUTAS (React Router)

### 8.1 Rutas Públicas

```javascript
// GET / → Home.jsx
// GET /historia → HistoryPage.jsx
// GET /eventos → EventsPage.jsx
// GET /eventos/:id → EventDetailPage.jsx
// GET /blog/:slug → PostDetailPage.jsx
// GET /donaciones → DonationPage.jsx
// GET /donaciones/tarjeta → StripeFormPage.jsx
// GET /oracion → PrayerOptionsPage.jsx
// GET /oracion/confidencial → PrayerFormPage.jsx
// GET /login → LoginPage.jsx
// GET /registro → RegisterPage.jsx
```

### 8.2 Rutas Protegidas (Admin)

```javascript
// Require: AuthContext.isAuthenticated && user.role === 'admin'

// GET /admin → Redirect to /admin/dashboard
// GET /admin/dashboard → DashboardPage.jsx
// GET /admin/perfil → ProfilePage.jsx
// GET /admin/historial → DonationHistoryPage.jsx
// GET /admin/grupos → GroupsPage.jsx
// GET /admin/blog → AdminBlogPage.jsx
// GET /admin/blog/new → AdminBlogEditor.jsx (CREATE)
// GET /admin/blog/:id → AdminBlogEditor.jsx (EDIT)
// GET /admin/eventos → AdminEventsPage.jsx
// GET /admin/peticiones → AdminPetitionsPage.jsx
```

---

## 9. GUÍA TÉCNICA DE IMPLEMENTACIÓN

### 9.1 Patrón de Componentes

**Todos los componentes deben seguir esta estructura**:

```jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axiosInstance from '@/lib/api';

export default function ComponentName() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: ['key'],
    queryFn: async () => {
      const response = await axiosInstance.get('/endpoint');
      return response.data;
    }
  });

  // Mutations
  const mutation = useMutation({
    mutationFn: async (payload) => {
      const response = await axiosInstance.post('/endpoint', payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Éxito!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error');
    }
  });

  const onSubmit = (data) => mutation.mutate(data);

  if (isLoading) return <div className="card animate-pulse">Cargando...</div>;
  if (error) return <div className="card bg-red-50">Error: {error.message}</div>;

  return (
    <div className="min-h-screen bg-light p-6">
      <div className="max-w-6xl mx-auto">
        <div className="card">
          {/* Contenido */}
        </div>
      </div>
    </div>
  );
}
```

### 9.2 Hook Personalizado para API

**Ubicación**: `src/hooks/useApiCall.js`

```javascript
import { useMutation, useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/api';

export const useGet = (url, options = {}) => {
  return useQuery({
    queryKey: [url],
    queryFn: async () => {
      const response = await axiosInstance.get(url);
      return response.data;
    },
    ...options
  });
};

export const usePost = (options = {}) => {
  return useMutation({
    mutationFn: async ({ url, data }) => {
      const response = await axiosInstance.post(url, data);
      return response.data;
    },
    ...options
  });
};
```

### 9.3 Validación de Formularios

Usar **react-hook-form** con **Zod** (opcional pero recomendado):

```javascript
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

### 9.4 Componente de Tarjeta Base

**Reutilizable en todas las páginas**:

```jsx
export function Card({ title, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {title && <h2 className="text-xl font-semibold text-primary mb-4">{title}</h2>}
      {children}
    </div>
  );
}
```

### 9.5 Toast Notifications

```javascript
import toast from 'react-hot-toast';

toast.success('¡Operación exitosa!');
toast.error('Error al procesar la solicitud');
toast.loading('Procesando...');
toast.promise(promise, {
  loading: 'Cargando...',
  success: '¡Listo!',
  error: 'Error'
});
```

---

## 10. VARIABLES DE ENTORNO

**Archivo**: `.env.local` (en la raíz de `frontend/`)

```bash
# API
VITE_API_URL=http://localhost:8080/api

# Stripe
VITE_STRIPE_PUBLIC_KEY=pk_test_XXXXXXXXXXXX

# App
VITE_APP_TITLE=Casa del Rey
VITE_APP_VERSION=1.0.0
```

---

## 11. CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Configuración Base
- [ ] Instalar dependencias (`pnpm install`)
- [ ] Configurar Tailwind CSS y variables CSS
- [ ] Crear estructura de directorios
- [ ] Configurar axios con interceptores
- [ ] Implementar AuthContext y SiteConfigContext

### Fase 2: Componentes Base
- [ ] Crear componentes UI (Button, Input, Card, etc)
- [ ] Implementar Header y Footer
- [ ] Crear ProtectedRoute wrapper
- [ ] Implementar layouts (PublicLayout, AdminLayout)

### Fase 3: Páginas Públicas
- [ ] Home.jsx con Hero Banner
- [ ] EventsPage y EventDetailPage
- [ ] BlogDetailPage
- [ ] DonationPage y StripeFormPage
- [ ] PrayerFormPage
- [ ] LoginPage y RegisterPage

### Fase 4: Páginas Admin
- [ ] DashboardPage con KPIs
- [ ] AdminBlogPage y AdminBlogEditor
- [ ] AdminEventsPage
- [ ] AdminPetitionsPage
- [ ] ProfilePage y DonationHistoryPage

### Fase 5: Optimización
- [ ] Lazy loading de rutas
- [ ] Code splitting
- [ ] SEO (Helmet)
- [ ] Testing unitario
- [ ] Build y deploy

---

## 12. REFERENCIAS TÉCNICAS

### Documentación
- [React Router v6](https://reactrouter.com/)
- [TanStack Query](https://tanstack.com/query/latest/)
- [React Hook Form](https://react-hook-form.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Axios](https://axios-http.com/)

### Herramientas
- **Package Manager**: `pnpm`
- **Build Tool**: `Vite`
- **CSS Framework**: `Tailwind CSS`
- **Type Checking**: `TypeScript` (opcional pero recomendado para componentes UI)

---

## 13. NOTAS DE SEGURIDAD

1. **JWT Storage**: Token siempre en localStorage (nunca en cookies sin `httpOnly`).
2. **Interceptores**: Validar expiración de token, refresh automático si aplica.
3. **CORS**: Backend debe permitir origen del frontend.
4. **Stripe**: Usar `@stripe/react-stripe-js` para elementos seguros.
5. **Validación**: Frontend + Backend (nunca confiar solo en frontend).

---

**Última actualización**: Noviembre 26, 2025  
**Versión**: 1.0.0  
**Estado**: Blueprint Activo para Reconstrucción
