# Especificación Técnica - Frontend Casa del Rey

**Versión:** 1.0  
**Última actualización:** 26 de noviembre, 2025  
**Estado:** Implementado

---

## 📋 Tabla de Contenidos

1. [Requisitos de Estilo](#requisitos-de-estilo)
2. [Arquitectura Técnica y Dependencias](#arquitectura-técnica-y-dependencias)
3. [Funcionalidad Transaccional y Endpoints](#funcionalidad-transaccional-y-endpoints)
4. [Estructura de Carpetas](#estructura-de-carpetas)

---

## 1. Requisitos de Estilo

### 1.1 Estética Visual: Soft UI (Shopify/Apple)

La interfaz sigue principios de **Soft UI** con inspiración en plataformas modernas (Shopify, Apple):

- **Esquinas suaves**: Todos los elementos usan `border-radius` redondeados (no ángulos agudos)
- **Sombras sutiles**: Elevaciones progresivas con sombras marrón-tintadas (RGBA 44, 24, 16)
- **Transiciones suaves**: Todas las interacciones usan `cubic-bezier(0.4, 0, 0.2, 1)` (200ms base)
- **Uniformidad total**: Mismo lenguaje visual en todas las páginas

### 1.2 Paleta de Colores - Eclesial

La paleta refleja la identidad eclesiástica y liturgia:

```
COLORES PRIMARIOS:
├── Caoba (#6B4423)
│   ├── DEFAULT: #6B4423 (botones, CTA, acciones primarias)
│   ├── Dark: #5A3A1A (hover states)
│   └── Light: #8B7355 (estados alternativos)
│
├── Dorado (#D4AF37)
│   ├── DEFAULT: #D4AF37 (destacados, títulos premium, sagrado)
│   ├── Dark: #B8940C (hover dorado)
│   └── Light: #E8C547 (overlays, decorativos)
│
└── Crema (#F5E6D3)
    ├── Fondo base: #F5E6D3 (todas las páginas)
    ├── Alternativo claro: #FAFAF8 (variante minimalista)
    ├── Tarjetas: #FFFBF7 (blancas cálidas con tono crema)
    └── Texto en oscuro: #FFFBF7 (contraste)

COLORES SECUNDARIOS (Estados):
├── Success: #10B981 (confirmaciones, validaciones)
├── Warning: #F59E0B (advertencias, cautela)
├── Error: #DC2626 (errores, destructivas)
└── Info: #06B6D4 (información, neutral)

TEXTOS:
├── Primary: #2C1810 (texto principal, máximo contraste)
├── Secondary: #6B7280 (texto secundario, etiquetas)
├── Muted: #A6988F (texto tenue, hints, placeholders)
└── Light: #FFFBF7 (texto sobre fondos oscuros)

BORDES:
├── Default: #E5D9CA (borde marrón muy suave)
└── Dark: #D4C4B3 (borde marrón medio, énfasis)
```

### 1.3 Tipografía

**Fuente única y obligatoria en todo el proyecto:** `Inter`

```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

- **Importación:** CDN de rsms.me/inter/inter.css
- **Pesos:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Tamaños:**
  - H1: 2.5rem (40px), peso 700
  - H2: 2rem (32px), peso 700
  - H3: 1.5rem (24px), peso 600
  - H4: 1.25rem (20px), peso 600
  - Body: 1rem (16px), peso 400
  - Small: 0.875rem (14px), peso 400

### 1.4 Sistema de Sombras (Soft UI Elevations)

Cinco niveles de elevación con sombras marrón-tintadas:

```javascript
boxShadow: {
  'soft': '0 2px 8px rgba(44, 24, 16, 0.06)',           // Elevation 1
  'soft-sm': '0 1px 3px rgba(44, 24, 16, 0.04)',        // Elevation 0
  'soft-md': '0 4px 12px rgba(44, 24, 16, 0.1)',        // Elevation 2
  'soft-lg': '0 8px 24px rgba(44, 24, 16, 0.12)',       // Elevation 3
  'soft-xl': '0 12px 32px rgba(44, 24, 16, 0.15)',      // Elevation 4
  'soft-2xl': '0 20px 48px rgba(44, 24, 16, 0.18)',     // Elevation 5
  'soft-inner': 'inset 0 2px 4px rgba(44, 24, 16, 0.06)',
}
```

**Uso en componentes:**
- **Cards base:** `shadow-soft` (1px lift)
- **Cards hover:** `hover:shadow-soft-md` (4px lift)
- **Modales:** `shadow-soft-lg` (8px lift)
- **Floating elements:** `shadow-soft-xl` (12px lift)

### 1.5 Arquitectura de Contenido - Floating Cards

**Patrón visual en TODAS las páginas:**

```
┌─────────────────────────────────────────────┐
│  Fondo Base: #F5E6D3 (Crema)                │
│  ┌───────────────────────────────────────┐  │
│  │  Tarjeta: #FFFBF7 (Blanco cálido)    │  │ ← shadow-soft
│  │  ┌─────────────────────────────────┐ │  │
│  │  │  Contenido                       │ │  │
│  │  │  - Títulos: Caoba               │ │  │
│  │  │  - Cuerpo: Gris secundario      │ │  │
│  │  │  - Acentos: Dorado              │ │  │
│  │  └─────────────────────────────────┘ │  │
│  │                                        │  │
│  │  Bordes: #E5D9CA (muy suave)         │  │
│  │  Border-radius: 12px (rounded-card)  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

**Especificaciones:**
- **Background page:** `bg-light` (#F5E6D3)
- **Card container:** `bg-card-bg` (#FFFBF7)
- **Card border:** `border border-DEFAULT` (#E5D9CA)
- **Card padding:** `p-lg` (16px) o `p-xl` (24px)
- **Card border-radius:** `rounded-card` (12px)
- **Card shadow:** `shadow-soft` (base) → `shadow-soft-md` (hover)
- **Animación:** `transition-soft duration-200`

### 1.6 Transiciones y Animaciones

**Timing functions estándar:**
```javascript
transitionTimingFunction: {
  'soft': 'cubic-bezier(0.4, 0, 0.2, 1)',      // Estándar Material
  'bounce-soft': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Bounce suave
}

transitionDuration: {
  'fast': '150ms',   // Hover inmediato
  'base': '200ms',   // Transición estándar
  'slow': '300ms',   // Transición notable
  'slower': '500ms', // Animación entrada/salida
}
```

**Animaciones predefinidas:**
```css
@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes slideUp {
  0% { transform: translateY(10px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes slideDown {
  0% { transform: translateY(-10px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes scaleIn {
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
```

**Uso común:**
- **Page loads:** `animation: fadeIn 0.3s ease-in-out`
- **Modal opens:** `animation: slideUp 0.3s ease-out`
- **Dropdowns:** `animation: slideDown 0.2s ease-out`
- **Buttons:** `transition-soft duration-200`

### 1.7 Componentes Estilizados

#### Button
```jsx
// Variants: primary, secondary, outline, ghost, accent, danger
// Sizes: sm, md, lg, xl
// Base: Soft UI shadow + focus ring
// Hover: Shadow elevation + opacity change
// Example: <Button variant="primary" size="md">Acción</Button>
```

**Clases aplicadas:**
- Primary: `bg-primary hover:bg-primary-dark shadow-soft hover:shadow-soft-md`
- Accent: `bg-accent hover:bg-accent-dark shadow-soft hover:shadow-soft-md`
- Outline: `border border-primary text-primary hover:bg-primary/5`
- Focus: `focus:ring-2 focus:ring-primary focus:ring-offset-2`

#### Card
```jsx
// Floating pattern por defecto
// Subcomponents: CardHeader, CardContent, CardFooter
// Border + Shadow + Rounded corners
// Example: <Card><CardContent>Contenido</CardContent></Card>
```

**Clases aplicadas:**
- Base: `bg-card-bg border border-DEFAULT rounded-card shadow-soft`
- Hover: `hover:shadow-soft-md transition-soft duration-200`
- Padding: `p-lg` o `p-xl` internamente

#### Input
```jsx
// Soft UI focus states
// Smooth color transitions
// Accessible focus rings
// Example: <Input placeholder="Correo" />
```

**Clases aplicadas:**
- Base: `border border-border rounded-input bg-white`
- Focus: `focus:border-primary focus:ring-2 focus:ring-primary/20`
- Transition: `transition-soft duration-200`

#### Header/Navigation
```jsx
// Sticky navigation con Soft UI
// Logo + Menu items + Auth buttons
// Shadow-soft-sm en base
// Transiciones suaves en hover
```

**Clases aplicadas:**
- Base: `bg-card-bg shadow-soft-sm border-b border-border`
- Items: `transition-soft duration-200 hover:text-primary`

---

## 2. Arquitectura Técnica y Dependencias

### 2.1 Stack Tecnológico

```
Frontend Framework:     React 19.2.0
Build Tool:            Vite 7.2.4
CSS Framework:         Tailwind CSS 4.1.17
Router:                React Router DOM 7.9.6
HTTP Client:           Axios 1.13.2
State Management:      @tanstack/react-query 5.90.11
Forms:                 react-hook-form 7.66.1
Animations:            framer-motion 12.23.24
Notifications:         react-hot-toast 2.6.0
Icons:                 lucide-react 0.555.0, @heroicons/react 2.2.0
CSS Processor:         PostCSS 8.5.6 + Autoprefixer
```

### 2.2 Dependencias Esenciales - Propósito y Uso

#### **React Router DOM** (Navegación)
```javascript
// Definición de rutas en router.jsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/events', element: <EventsPage /> },
      { path: '/blog', element: <BlogPage /> },
      { path: '/donate', element: <DonatePage /> },
      { path: '/prayer', element: <PrayerPage /> },
      // Admin routes con ProtectedRoute
      { path: '/admin', element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
    ],
  },
]);
```

**Propósito:** Enrutamiento cliente-side sin necesidad de refrescar página.

#### **Axios** (HTTP Client)
```javascript
// Configurado en: src/lib/apiClient.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Agregar token JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Manejar errores 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login'; // Redirect a login si token expirado
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

**Propósito:**
- Realizar requests HTTP a backend
- Inyectar JWT token automáticamente en headers
- Manejar errores globalmente (auth expirada, etc.)
- Usar en servicios: `apiClient.post('/auth/login', data)`

#### **@tanstack/react-query** (Server State Management)
```javascript
// Uso en componentes
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';

// Fetching data
const { data: events, isLoading, error } = useQuery({
  queryKey: ['events'],
  queryFn: () => apiClient.get('/events').then(res => res.data),
  staleTime: 5 * 60 * 1000, // 5 minutos
});

// Mutations (POST/PUT/DELETE)
const { mutate: createEvent } = useMutation({
  mutationFn: (data) => apiClient.post('/events', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
    toast.success('Evento creado!');
  },
  onError: (err) => {
    toast.error(err.response?.data?.message || 'Error');
  },
});
```

**Propósito:**
- Cachear datos del servidor automáticamente
- Re-fetch en background (stale-while-revalidate)
- Sincronización de estado servidor-cliente
- Invalidación de cache tras mutaciones

#### **react-hook-form** (Form Management)
```javascript
// Uso en formularios
import { useForm } from 'react-hook-form';
import { Input, Button } from '@/components/ui';

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    try {
      const response = await apiClient.post('/auth/login', data);
      localStorage.setItem('token', response.data.token);
      // ... redirigir
    } catch (err) {
      toast.error(err.response?.data?.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input 
        {...register('email', { required: 'Email requerido' })}
        placeholder="correo@ejemplo.com"
        error={errors.email?.message}
      />
      <Input 
        {...register('password', { required: 'Contraseña requerida' })}
        type="password"
        placeholder="Contraseña"
        error={errors.password?.message}
      />
      <Button type="submit">Iniciar Sesión</Button>
    </form>
  );
}
```

**Propósito:**
- Gestionar estado de formularios sin re-renders innecesarios
- Validación built-in
- Integración con Input personalizado

#### **framer-motion** (Animaciones Avanzadas)
```javascript
import { motion } from 'framer-motion';

// Animación de fade-in con Framer
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
  className="card"
>
  Contenido animado
</motion.div>

// Animación de lista (stagger)
<motion.div variants={containerVariants} initial="hidden" animate="visible">
  {items.map((item) => (
    <motion.div key={item.id} variants={itemVariants}>
      {item.name}
    </motion.div>
  ))}
</motion.div>
```

**Propósito:**
- Animaciones complejas más allá de CSS
- Gestos (drag, hover, tap)
- Orquestación de múltiples elementos

#### **react-hot-toast** (Notificaciones)
```javascript
import toast from 'react-hot-toast';

// En cualquier lugar
toast.success('¡Guardado correctamente!');
toast.error('Ocurrió un error');
toast.loading('Cargando...');

// Custom
toast.custom((t) => (
  <div className="bg-green-500 text-white p-4 rounded">
    Mensaje personalizado
  </div>
));
```

**Propósito:**
- Notificaciones no-intrusivas en esquina
- Feedback inmediato de acciones

### 2.3 Context API - Estado Global

#### **AuthContext** (Autenticación)
```javascript
// Ubicación: src/context/AuthContext.jsx

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sincronizar token en headers
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Verificar token al cargar app
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API_URL}/protected/profile`);
          setUser(response.data);
          setError(null);
        } catch (err) {
          console.error('Token verification failed:', err);
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    verifyToken();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      setToken(response.data.token);
      setUser(response.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar en componentes
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
}
```

**Propósito:**
- Gestionar estado de usuario logueado
- Persistir token en localStorage
- Verificar validez de sesión al cargar
- Inyectar token en todas las requests

**Uso en componentes:**
```javascript
function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Bienvenido, {user?.name}</h1>
      <button onClick={logout}>Cerrar Sesión</button>
    </div>
  );
}
```

#### **SiteConfigContext** (Configuración de App)
```javascript
// Ubicación: src/context/SiteConfigContext.jsx

export const SiteConfigContext = createContext();

export function SiteConfigProvider({ children }) {
  const [config, setConfig] = useState({
    appId: import.meta.env.VITE_APP_ID || 'casa-del-rey',
    appTitle: import.meta.env.VITE_APP_TITLE || 'Casa del Rey',
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
    stripePublicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY || '',
  });

  useEffect(() => {
    console.log('App Config loaded:', config);
  }, [config]);

  return (
    <SiteConfigContext.Provider value={config}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  const context = useContext(SiteConfigContext);
  if (!context) {
    throw new Error('useSiteConfig debe ser usado dentro de SiteConfigProvider');
  }
  return context;
}
```

**Propósito:**
- Centralizar configuración de environment variables
- Acceso a claves públicas (Stripe) desde cualquier componente
- Inyectar valores desde `.env.local`

**Uso:**
```javascript
function CheckoutForm() {
  const { stripePublicKey } = useSiteConfig();
  // ... usar stripePublicKey
}
```

### 2.4 Configuración de Axios - Detallada

**Archivo:** `src/lib/apiClient.js`

```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Crear instancia con configuración base
const apiClient = axios.create({
  baseURL: API_URL,        // Base URL para todas las requests
  timeout: 10000,          // Timeout de 10 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * REQUEST INTERCEPTOR
 * Se ejecuta antes de cada request
 * Propósito: Inyectar JWT token en Authorization header
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Error en la request
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

/**
 * RESPONSE INTERCEPTOR
 * Se ejecuta después de cada response
 * Propósito: Manejar errores globalmente
 */
apiClient.interceptors.response.use(
  (response) => {
    // Success: retornar response como está
    return response;
  },
  (error) => {
    // Error 401: Token expirado o inválido
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login'; // Redirigir a login
    }

    // Otros errores
    console.error('Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
```

**Flujo de autenticación:**
1. Usuario hace login → Backend retorna `{ token: "..." }`
2. Frontend guarda token en `localStorage`
3. Siguiente request:
   - Request Interceptor obtiene token de localStorage
   - Agrega header: `Authorization: Bearer <token>`
   - Backend valida token y procesa request
4. Si token expirado:
   - Response Interceptor detecta 401
   - Elimina token de localStorage
   - Redirige a `/login`

---

## 3. Funcionalidad Transaccional y Endpoints

### 3.1 Autenticación (Auth)

#### **POST /auth/register**
```javascript
// Request
{
  name: "Juan Pérez",
  email: "juan@example.com",
  password: "SecurePassword123",
  phone: "+34 123 456 789" // Opcional
}

// Response (201)
{
  token: "eyJhbGciOiJIUzI1NiIs...",
  user: {
    id: "user-123",
    name: "Juan Pérez",
    email: "juan@example.com",
    role: "member"
  }
}

// Error (400)
{
  message: "Email already registered",
  field: "email"
}
```

**Implementación:**
```javascript
// En: src/pages/public/Register.jsx
const { mutate: register, isPending } = useMutation({
  mutationFn: (data) => apiClient.post('/auth/register', data),
  onSuccess: (response) => {
    const { token, user } = response.data;
    login(user, token); // AuthContext
    navigate('/');
  },
  onError: (error) => {
    toast.error(error.response?.data?.message);
  },
});
```

#### **POST /auth/login**
```javascript
// Request
{
  email: "juan@example.com",
  password: "SecurePassword123"
}

// Response (200)
{
  token: "eyJhbGciOiJIUzI1NiIs...",
  user: {
    id: "user-123",
    name: "Juan Pérez",
    email: "juan@example.com",
    role: "member"
  }
}

// Error (401)
{
  message: "Invalid credentials"
}
```

#### **GET /protected/profile** (Requiere JWT)
```javascript
// Headers: Authorization: Bearer <token>

// Response (200)
{
  id: "user-123",
  name: "Juan Pérez",
  email: "juan@example.com",
  role: "member",
  createdAt: "2025-01-15T10:30:00Z"
}
```

### 3.2 Eventos (Events)

#### **GET /events**
```javascript
// Query params opcionales
// ?page=1&limit=10&category=liturgy&status=active

// Response (200)
{
  data: [
    {
      id: "event-1",
      title: "Misa Domenical",
      description: "Misa dominical de la comunidad",
      date: "2025-12-01T10:00:00Z",
      location: "Iglesia Principal",
      image: "https://...",
      category: "liturgy",
      attendees: 45
    }
  ],
  pagination: {
    total: 120,
    page: 1,
    pages: 12
  }
}
```

**Implementación:**
```javascript
const { data: events, isLoading } = useQuery({
  queryKey: ['events', { page: 1, limit: 10 }],
  queryFn: ({ queryKey }) => {
    const [_, params] = queryKey;
    return apiClient.get('/events', { params }).then(r => r.data);
  },
});
```

#### **GET /events/:id**
```javascript
// Response (200)
{
  id: "event-1",
  title: "Misa Domenical",
  description: "...",
  date: "2025-12-01T10:00:00Z",
  location: "Iglesia Principal",
  image: "...",
  fullDescription: "Descripción larga...",
  pastor: "Padre Juan",
  capacity: 100,
  registered: 45
}
```

#### **POST /events** (Admin only)
```javascript
// Requiere: Authorization: Bearer <token> + role: admin

// Request
{
  title: "Retiro Espiritual",
  description: "Retiro de 3 días",
  date: "2025-12-15T09:00:00Z",
  location: "Casa de Retiros",
  image: File, // multipart/form-data
  category: "retreat",
  capacity: 50
}

// Response (201)
{
  id: "event-2",
  title: "Retiro Espiritual",
  ...
}
```

### 3.3 Blog (Posts)

#### **GET /blog**
```javascript
// Response (200)
{
  data: [
    {
      id: "post-1",
      title: "Fe y Esperanza",
      slug: "fe-y-esperanza",
      excerpt: "Reflexión sobre la fe...",
      content: "...",
      author: "Padre Juan",
      date: "2025-11-20T14:00:00Z",
      image: "https://...",
      category: "reflection"
    }
  ],
  pagination: {
    total: 35,
    page: 1,
    pages: 4
  }
}
```

#### **GET /blog/:slug**
```javascript
// Response (200)
{
  id: "post-1",
  title: "Fe y Esperanza",
  slug: "fe-y-esperanza",
  content: "Contenido HTML renderizado...",
  author: "Padre Juan",
  date: "2025-11-20T14:00:00Z",
  image: "...",
  category: "reflection",
  relatedPosts: [
    { id: "post-2", title: "...", slug: "..." }
  ]
}
```

#### **POST /blog** (Admin only)
```javascript
// Request
{
  title: "Nuevo Artículo",
  slug: "nuevo-articulo",
  excerpt: "Resumen corto",
  content: "<h2>Contenido HTML</h2>...", // De Quill editor
  category: "reflection",
  image: File
}

// Response (201)
{
  id: "post-3",
  ...
}
```

### 3.4 Donaciones (Donations)

#### **POST /donations** (Requiere JWT)
```javascript
// Request
{
  amount: 5000,           // Centavos (50.00 EUR)
  currency: "EUR",
  paymentMethod: "stripe",
  message: "Para la reparación del techo",
  anonymous: false
}

// Response (200)
{
  id: "donation-1",
  status: "processing",
  sessionUrl: "https://checkout.stripe.com/..." // Redirigir aquí
}
```

**Flujo Stripe:**
1. Frontend hace POST a `/donations`
2. Backend crea Stripe Session
3. Backend retorna `sessionUrl`
4. Frontend redirige a Stripe Checkout
5. Usuario completa pago
6. Stripe redirige a `success_url` o `cancel_url` configurado

**Implementación:**
```javascript
function DonateForm() {
  const { mutate: donate } = useMutation({
    mutationFn: (data) => apiClient.post('/donations', data),
    onSuccess: (response) => {
      // Redirigir a Stripe
      window.location.href = response.data.sessionUrl;
    },
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      donate({ amount: 5000, currency: 'EUR', paymentMethod: 'stripe' });
    }}>
      <Input type="number" placeholder="Cantidad" />
      <Button type="submit">Donar</Button>
    </form>
  );
}
```

#### **GET /donations/user** (Requiere JWT)
```javascript
// Response (200)
{
  data: [
    {
      id: "donation-1",
      amount: 5000,
      currency: "EUR",
      date: "2025-11-20T10:00:00Z",
      status: "completed",
      message: "Para la reparación del techo"
    }
  ],
  total: 15000,
  count: 3
}
```

### 3.5 Oraciones (Prayers/Petitions)

#### **POST /petitions**
```javascript
// Request (sin autenticación requerida)
{
  name: "María García",
  email: "maria@example.com",
  petitionText: "Pido por la salud de mi madre",
  category: "health",
  notifyByEmail: true
}

// Response (201)
{
  id: "petition-1",
  status: "received",
  message: "Tu petición ha sido recibida con amor"
}
```

#### **GET /petitions/recent**
```javascript
// Response (200)
{
  data: [
    {
      id: "petition-1",
      petitionText: "Pido por la salud de mi madre",
      category: "health",
      date: "2025-11-20T09:00:00Z",
      status: "received"
    }
  ],
  count: 150
}
```

### 3.6 Dashboard (Admin)

#### **GET /dashboard/stats** (Admin only)
```javascript
// Response (200)
{
  events: {
    total: 24,
    upcoming: 6,
    attendees: 342
  },
  blog: {
    posts: 35,
    views: 2400
  },
  donations: {
    total: 15000,
    count: 42,
    currency: "EUR"
  },
  users: {
    total: 245,
    active: 198
  },
  petitions: {
    total: 380,
    pending: 45
  }
}
```

---

## 4. Estructura de Carpetas

```
frontend/
├── src/
│   ├── main.jsx                 # Entry point (imports index.css)
│   ├── index.css                # ★ ÚNICO archivo de estilos global
│   ├── App.jsx                  # Root component (sin App.css)
│   ├── router.jsx               # Definición de rutas
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx       # Navegación principal
│   │   │   ├── Footer.jsx       # Pie de página
│   │   │   └── ProtectedRoute.jsx # Wrapper para admin routes
│   │   │
│   │   └── ui/
│   │       ├── Button.jsx       # 6 variants, soft UI
│   │       ├── Card.jsx         # Floating pattern, subcomponents
│   │       ├── Input.jsx        # Form input, soft UI focus
│   │       ├── Modal.jsx        # Modales
│   │       └── ...
│   │
│   ├── context/
│   │   ├── AuthContext.jsx      # Usuario, token, login/logout
│   │   └── SiteConfigContext.jsx # Configuración global
│   │
│   ├── hooks/
│   │   ├── useAuth.js           # Hook para AuthContext
│   │   └── ...
│   │
│   ├── lib/
│   │   ├── apiClient.js         # Axios + interceptores JWT
│   │   └── ...
│   │
│   ├── services/
│   │   └── api.js               # Funciones de API (deprecated, usar apiClient)
│   │
│   ├── pages/
│   │   ├── public/
│   │   │   ├── Home.jsx         # Landing page
│   │   │   ├── Login.jsx        # Formulario login
│   │   │   ├── Register.jsx     # Formulario registro
│   │   │   ├── EventsPage.jsx   # Listado eventos
│   │   │   ├── BlogPage.jsx     # Listado blog
│   │   │   ├── DonatePage.jsx   # Formulario donación
│   │   │   ├── PrayerPage.jsx   # Formulario oraciones
│   │   │   └── NotFound.jsx     # 404 page
│   │   │
│   │   └── admin/
│   │       ├── Dashboard.jsx    # Panel principal
│   │       ├── AdminEvents.jsx  # Gestión eventos
│   │       ├── AdminBlog.jsx    # Gestión blog
│   │       ├── AdminPetitions.jsx # Gestión oraciones
│   │       └── Profile.jsx      # Perfil usuario
│   │
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── ...
│   │
│   └── ...
│
├── index.html               # HTML template
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # ★ ÚNICA configuración Tailwind (no .ts)
├── postcss.config.js       # ★ ÚNICA configuración PostCSS
├── eslint.config.js        # Linter configuration
├── package.json
├── .env.local              # Environment variables (no commit)
└── public/
    └── ...
```

### 4.1 Variables de Entorno (`.env.local`)

```bash
# API
VITE_API_URL=http://localhost:8080/api

# Stripe
VITE_STRIPE_PUBLIC_KEY=pk_test_XXXXXXXXXXXXXXXXXXXX

# App
VITE_APP_ID=casa-del-rey
VITE_APP_TITLE=Casa del Rey
```

### 4.2 Scripts NPM Disponibles

```bash
npm run dev        # Inicia servidor Vite (http://localhost:5173/)
npm run build      # Build para producción (dist/)
npm run preview    # Preview del build
npm run lint       # ESLint check
```

---

## 5. Guía de Implementación

### 5.1 Crear una Nueva Página

```jsx
// src/pages/public/Example.jsx
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ExamplePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['example'],
    queryFn: () => apiClient.get('/example').then(r => r.data),
  });

  if (isLoading) return <div className="text-center py-8">Cargando...</div>;
  if (error) return <div className="text-error">Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Ejemplo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data?.map((item) => (
          <Card key={item.id}>
            <Card.Content>
              <h2 className="text-xl font-semibold text-primary">{item.title}</h2>
              <p className="text-secondary mt-2">{item.description}</p>
              <Button variant="primary" size="md" className="mt-4">
                Más info
              </Button>
            </Card.Content>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### 5.2 Crear un Formulario

```jsx
// src/pages/public/ExampleForm.jsx
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import toast from 'react-hot-toast';

export default function ExampleForm() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });

  const { mutate: submitForm, isPending } = useMutation({
    mutationFn: (data) => apiClient.post('/example', data),
    onSuccess: () => {
      toast.success('¡Formulario enviado!');
      reset();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error al enviar');
    },
  });

  return (
    <Card className="max-w-md mx-auto">
      <Card.Header>
        <h2 className="text-2xl font-bold text-primary">Formulario Ejemplo</h2>
      </Card.Header>
      
      <Card.Content>
        <form onSubmit={handleSubmit((data) => submitForm(data))} className="space-y-4">
          <Input
            {...register('name', { required: 'Nombre requerido' })}
            placeholder="Tu nombre"
            error={errors.name?.message}
          />
          
          <Input
            {...register('email', { required: 'Email requerido' })}
            type="email"
            placeholder="tu@email.com"
            error={errors.email?.message}
          />
          
          <Input
            {...register('message', { required: 'Mensaje requerido' })}
            placeholder="Tu mensaje"
            error={errors.message?.message}
            multiline
            rows={4}
          />

          <Button 
            type="submit" 
            variant="primary" 
            disabled={isPending}
            className="w-full"
          >
            {isPending ? 'Enviando...' : 'Enviar'}
          </Button>
        </form>
      </Card.Content>
    </Card>
  );
}
```

### 5.3 Usar AuthContext

```jsx
// En cualquier componente
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-4">
      <h1>Perfil de {user?.name}</h1>
      <p className="text-secondary">{user?.email}</p>
      <Button onClick={handleLogout} variant="outline">
        Cerrar Sesión
      </Button>
    </div>
  );
}
```

---

## 📌 Checklist de Verificación

- [x] Index.css como único archivo global de estilos
- [x] Tailwind + PostCSS configurado correctamente
- [x] Paleta eclesial en CSS variables + Tailwind theme
- [x] Soft UI shadows (5 niveles) implementado
- [x] Inter typography en todo el sitio
- [x] Floating cards pattern en páginas
- [x] AuthContext con JWT management
- [x] SiteConfigContext para env variables
- [x] apiClient con interceptores
- [x] React Router DOM para navegación
- [x] react-hook-form para formularios
- [x] @tanstack/react-query para server state
- [x] framer-motion para animaciones avanzadas
- [x] react-hot-toast para notificaciones
- [x] ProtectedRoute para admin pages
- [x] Build production exitoso (npm run build)

---

**Última revisión:** 26 de noviembre, 2025  
**Responsable:** Equipo Frontend  
**Estado:** ✅ Listo para desarrollo

