# 🚀 CHECKLIST EJECUTABLE

**Usa este archivo como tu guía paso a paso para completar el proyecto.**

---

## 📋 FASE 0: DECISIÓN (5 minutos)

```
[ ] He leído RESUMEN_FINAL_AUDITORIA.md
[ ] He leído QUICK_REFERENCE_FRONTEND.md
[ ] He entendido los 8 problemas encontrados
[ ] He decidido entre Opción A o B

DECISIÓN ESCOGIDA:
  [ ] OPCIÓN A (Cleanup, 1.5 horas)
  [ ] OPCIÓN B (Reconstrucción, 6-8 horas) ← RECOMENDADO

Timestamp: _______________
```

---

## 🔧 OPCIÓN A: CLEANUP RÁPIDO (1.5 horas)

### SECCIÓN 1: Eliminar Archivos (5 minutos)

```bash
# Ejecuta estos comandos en PowerShell
cd c:\Users\keyme\proyectos\casadelreyhue\frontend

# Eliminar componentes shadcn sin usar
Remove-Item -Path "src/components/ui/Button-shadcn.tsx" -Force
Remove-Item -Path "src/components/ui/Input-shadcn.tsx" -Force
Remove-Item -Path "src/components/ui/Select-shadcn.tsx" -Force
Remove-Item -Path "src/components/ui/Table-shadcn.tsx" -Force
Remove-Item -Path "src/components/ui/Tabs-shadcn.tsx" -Force

# Eliminar componentes problemáticos
Remove-Item -Path "src/components/SocialMedia/YouTubeFeatured.jsx" -Force
Remove-Item -Path "src/pages/admin/GroupsPage.jsx" -Force
Remove-Item -Path "src/pages/admin/MyGroupsPage.jsx" -Force

# Eliminar componente huérfano
Remove-Item -Path "src/components/admin/GroupCard.jsx" -Force
```

```
RESULTADO ESPERADO:
  ✅ 9 archivos eliminados
  ✅ Sin errores

VERIFICACIÓN:
  [ ] Ejecuté los comandos
  [ ] Se eliminaron 9 archivos
  [ ] No hay errores de PowerShell
  [ ] Timestamp: _______________
```

---

### SECCIÓN 2: Remover Imports (5 minutos)

#### ARCHIVO 1: src/pages/Home.jsx
```javascript
// BUSCA ESTA LÍNEA (en las importaciones):
import YouTubeFeatured from '../components/SocialMedia/YouTubeFeatured';

// ELIMÍNALA (la línea completa)
// No reemplaces con nada, solo bórrala

// BUSCA ESTE JSX (en el return):
<YouTubeFeatured />

// ELIMÍNALO (la etiqueta completa)
// Pueden estar entre otras secciones
```

#### ARCHIVO 2: src/router.jsx
```javascript
// BUSCA ESTA LÍNEA (en las importaciones):
import GroupsPage from './pages/admin/GroupsPage';

// ELIMÍNALA

// BUSCA ESTA RUTA (en el routes array):
{
  path: '/admin/groups',
  element: <ProtectedRoute><GroupsPage /></ProtectedRoute>
}

// ELIMÍNALA (la ruta completa entre las llaves)
```

```
CHECKLIST:
  [ ] Abrí src/pages/Home.jsx
  [ ] Eliminé import de YouTubeFeatured
  [ ] Eliminé <YouTubeFeatured /> del JSX
  [ ] Abrí src/router.jsx
  [ ] Eliminé import de GroupsPage
  [ ] Eliminé ruta de /admin/groups
  [ ] Guardé ambos archivos (Ctrl+S)
  [ ] Timestamp: _______________
```

---

### SECCIÓN 3: Fijar AuthContext (10 minutos)

#### ARCHIVO: src/context/AuthContext.jsx

```javascript
// BUSCA ESTAS LÍNEAS (cerca del inicio del archivo):
// const API_URL = 'http://localhost:8080/api';
// O
// const baseURL = 'http://localhost:8080/api';

// REEMPLÁZALAS CON ESTO:
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// AHORA BUSCA TODAS LAS LÍNEAS QUE TIENEN ESTO:
fetch('http://localhost:8080/api/auth/...

// REEMPLÁZALAS CON ESTO:
fetch(`${API_URL}/auth/...

// EJEMPLOS ESPECÍFICOS A BUSCAR Y REEMPLAZAR:

// DE:
fetch('http://localhost:8080/api/auth/login', {

// A:
fetch(`${API_URL}/login`, {

// DE:
fetch('http://localhost:8080/api/auth/register', {

// A:
fetch(`${API_URL}/register`, {

// DE:
fetch('http://localhost:8080/api/auth/validate', {

// A:
fetch(`${API_URL}/validate`, {
```

```
CHECKLIST:
  [ ] Abrí src/context/AuthContext.jsx
  [ ] Encontré las líneas hardcodeadas
  [ ] Reemplacé con import.meta.env.VITE_API_URL
  [ ] Busqué todas las líneas fetch('http://localhost...
  [ ] Reemplacé con fetch(`${API_URL}/...
  [ ] Guardé el archivo (Ctrl+S)
  [ ] No hay líneas rojas de error
  [ ] Timestamp: _______________
```

---

### SECCIÓN 4: Aplicar Colores Eclesiales (30 minutos)

**Archivos a actualizar**: 4 páginas admin

#### PÁGINA 1: src/pages/admin/DashboardPage.jsx

```jsx
// Busca el div principal de la página
// Reemplaza className existente con:
className="min-h-screen bg-cream p-6"

// Busca títulos (h1, h2)
// Reemplaza className con:
className="text-3xl font-bold text-dark-church"

// Busca tarjetas de stats
// Reemplaza className con:
className="bg-white rounded-lg border border-church shadow-sm p-4"

// Busca botones
// Reemplaza className con:
className="bg-primary-caoba text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
```

#### PÁGINA 2: src/pages/admin/AdminBlogPage.jsx

```jsx
// Mismos patrones que DashboardPage:
// - bg-cream para fondo
// - text-dark-church para títulos
// - border-church para bordes
// - bg-primary-caoba para botones
```

#### PÁGINA 3: src/pages/admin/AdminEventsPage.jsx

```jsx
// Mismos patrones
```

#### PÁGINA 4: src/pages/admin/AdminPetitionsPage.jsx

```jsx
// Mismos patrones
```

```
CHECKLIST - COLORES A APLICAR:
  [ ] Fondos: bg-cream (principal), bg-white (tarjetas)
  [ ] Títulos: text-dark-church
  [ ] Bordes: border-church
  [ ] Botones: bg-primary-caoba
  [ ] Acentos: text-accent-gold

ARCHIVOS:
  [ ] Actualicé DashboardPage.jsx
  [ ] Actualicé AdminBlogPage.jsx
  [ ] Actualicé AdminEventsPage.jsx
  [ ] Actualicé AdminPetitionsPage.jsx
  [ ] Guardé todos (Ctrl+S en cada uno)
  [ ] Timestamp: _______________
```

---

### SECCIÓN 5: Testing (20 minutos)

```bash
cd c:\Users\keyme\proyectos\casadelreyhue\frontend

# Instala dependencias si no las tienes
npm install

# Inicia servidor de desarrollo
npm run dev
```

```
CHECKLIST DE TESTING:
  [ ] Ejecuté npm run dev
  [ ] Abrí http://localhost:5173 en navegador
  [ ] Página de Home carga sin errores
  [ ] Página de Home no tiene <YouTubeFeatured />
  [ ] Admin > Dashboard carga
  [ ] Admin > Blog carga
  [ ] Admin > Events carga
  [ ] Admin > Petitions carga
  [ ] Login/Register funciona
  [ ] No hay errores rojos en consola
  [ ] Colores eclesiales se ven correctos
  [ ] Timestamp: _______________
```

---

### SECCIÓN 6: Build (5 minutos)

```bash
cd c:\Users\keyme\proyectos\casadelreyhue\frontend

# Build para producción
npm run build
```

```
CHECKLIST DE BUILD:
  [ ] Build completado sin errores
  [ ] Archivo dist/ fue creado
  [ ] No hay warnings
  [ ] Puedo ver el size del bundle
  [ ] Timestamp: _______________
```

---

### ✅ OPCIÓN A COMPLETADA

```
RESULTADO FINAL OPCIÓN A:
  ✅ 8 archivos eliminados
  ✅ Imports limpios
  ✅ URLs de API flexibles
  ✅ Colores eclesiales aplicados
  ✅ Build exitoso
  ✅ Sin errores
  ✅ Listo para deploy

TIEMPO TOTAL: ~1.5 horas
ESTADO: 🟡 Funcional con deuda técnica menor
PRÓXIMO PASO: Deploy a producción
```

---

## 🚀 OPCIÓN B: RECONSTRUCCIÓN LIMPIA (6-8 horas)

### SECCIÓN 1: Preparación (15 minutos)

```bash
# Ve a la carpeta del proyecto
cd c:\Users\keyme\proyectos\casadelreyhue

# Haz backup del frontend actual
Rename-Item -Path "frontend" -NewName "frontend_backup_old"

# Crea el nuevo proyecto
npm create vite@latest frontend -- --template react

cd frontend

# Instala dependencias principales
npm install
```

Dependencias que necesitas (copia todo):
```bash
npm install \
  react-router-dom \
  axios \
  @tanstack/react-query \
  react-hook-form \
  tailwindcss postcss autoprefixer \
  framer-motion \
  @stripe/react-stripe-js @stripe/stripe-js \
  react-hot-toast \
  lucide-react @heroicons/react \
  react-big-calendar \
  react-quill \
  recharts \
  date-fns

npm install -D \
  @tailwindcss/forms \
  prettier \
  eslint \
  eslint-config-prettier
```

```
CHECKLIST SECCIÓN 1:
  [ ] Hice backup del frontend_backup_old
  [ ] Ejecuté npm create vite
  [ ] Instalé todas las dependencias
  [ ] npm install completó exitosamente
  [ ] No hay errores rojo
  [ ] Timestamp: _______________
```

---

### SECCIÓN 2: Configuración Base (30 minutos)

#### Archivo 1: tailwind.config.js
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-caoba': '#6B4423',
        'accent-gold': '#D4AF37',
        'bg-cream': '#F5E6D3',
        'bg-white-warm': '#FFFBF7',
        'bg-dark-church': '#2C1810',
        'text-dark-church': '#2C1810',
        'text-light-cream': '#F5E6D3',
        'border-church': '#A6988F',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '12px',
      },
    },
  },
  plugins: [],
}
```

#### Archivo 2: postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

#### Archivo 3: src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-caoba: #6B4423;
  --color-dorado: #D4AF37;
  --color-crema: #F5E6D3;
  --color-dark: #2C1810;
}

@layer components {
  .card {
    @apply bg-white-warm rounded-lg border border-border-church shadow-sm;
  }

  .btn-primary {
    @apply bg-primary-caoba text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all;
  }

  .accent-text {
    @apply text-accent-gold font-semibold;
  }
}
```

#### Archivo 4: .env.local
```env
VITE_API_URL=http://localhost:8080/api
VITE_STRIPE_PUBLIC_KEY=pk_test_XXXXXXXXXXXX
VITE_APP_TITLE=Casa del Rey
VITE_APP_VERSION=1.0.0
```

```
CHECKLIST SECCIÓN 2:
  [ ] Creé tailwind.config.js
  [ ] Creé postcss.config.js
  [ ] Actualicé src/index.css
  [ ] Creé .env.local con variables
  [ ] Reemplacé VITE_STRIPE_PUBLIC_KEY con valor real
  [ ] Timestamp: _______________
```

---

### SECCIÓN 3: Contextos (30 minutos)

Crea los tres archivos:

#### Archivo 1: src/context/AuthContext.jsx
```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/validate`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('authToken');
      setToken(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
    return response.data;
  };

  const register = async (formData) => {
    const response = await axios.post(`${API_URL}/auth/register`, formData);
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

#### Archivo 2: src/context/SiteConfigContext.jsx
```jsx
import { createContext, useContext } from 'react';

const SiteConfigContext = createContext(null);

const siteConfig = {
  churchName: 'Casa del Rey',
  logo: '/logo.png',
  email: 'contact@casadelrey.com',
  phone: '+57 (code) xxxx-xxxx',
  address: 'Address here',
  socialMedia: {
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    youtube: 'https://youtube.com',
  },
};

export function SiteConfigProvider({ children }) {
  return (
    <SiteConfigContext.Provider value={siteConfig}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  const context = useContext(SiteConfigContext);
  if (!context) {
    throw new Error('useSiteConfig must be used within SiteConfigProvider');
  }
  return context;
}
```

#### Archivo 3: src/context/ThemeContext.jsx
```jsx
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 'light'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

```
CHECKLIST SECCIÓN 3:
  [ ] Creé src/context/AuthContext.jsx
  [ ] Creé src/context/SiteConfigContext.jsx
  [ ] Creé src/context/ThemeContext.jsx
  [ ] No hay errores rojos en los archivos
  [ ] Timestamp: _______________
```

---

### SECCIÓN 4: Componentes Base (1.5 horas)

> Hay muchos componentes, pero aquí te dejo los 5 principales. Los demás siguen el mismo patrón.

#### Componente 1: src/components/ui/Button.jsx
```jsx
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  const baseStyles = 'rounded-lg font-medium transition-all duration-200';

  const variants = {
    primary: 'bg-primary-caoba text-white hover:bg-opacity-90',
    secondary: 'bg-border-church text-dark-church hover:bg-opacity-80',
    outline: 'border-2 border-primary-caoba text-primary-caoba hover:bg-primary-caoba hover:text-white',
    accent: 'bg-accent-gold text-dark-church hover:bg-opacity-90',
    ghost: 'text-primary-caoba hover:bg-primary-caoba hover:text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

#### Componente 2: src/components/ui/Card.jsx
```jsx
export function Card({ children, className = '' }) {
  return (
    <div
      className={`
        bg-bg-white-warm 
        rounded-lg 
        border border-border-church 
        shadow-sm 
        p-6
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return (
    <h2
      className={`
        text-2xl 
        font-bold 
        text-dark-church 
        ${className}
      `}
    >
      {children}
    </h2>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`my-4 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-4 pt-4 border-t border-border-church ${className}`}>
      {children}
    </div>
  );
}
```

#### Componente 3: src/components/ui/Input.jsx
```jsx
import { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-dark-church mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`
          w-full
          px-4
          py-2
          border
          border-border-church
          rounded-lg
          bg-bg-white-warm
          text-dark-church
          placeholder-gray-500
          focus:outline-none
          focus:ring-2
          focus:ring-primary-caoba
          focus:border-primary-caoba
          transition-all
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-red-600 text-sm mt-1">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
```

#### Componente 4: src/components/ui/Loading.jsx
```jsx
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-caoba"></div>
    </div>
  );
}

export function LoadingSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-gray-200 h-12 rounded-lg animate-pulse"></div>
      ))}
    </div>
  );
}
```

#### Componente 5: src/components/ui/Toast.jsx
```jsx
import toast from 'react-hot-toast';

export const showToast = {
  success: (message) => {
    toast.success(message, {
      style: {
        background: '#6B4423',
        color: '#F5E6D3',
      },
    });
  },
  error: (message) => {
    toast.error(message, {
      style: {
        background: '#DC2626',
        color: 'white',
      },
    });
  },
  loading: (message) => {
    toast.loading(message, {
      style: {
        background: '#6B4423',
        color: '#F5E6D3',
      },
    });
  },
};
```

```
CHECKLIST SECCIÓN 4:
  [ ] Creé src/components/ui/Button.jsx
  [ ] Creé src/components/ui/Card.jsx
  [ ] Creé src/components/ui/Input.jsx
  [ ] Creé src/components/ui/Loading.jsx
  [ ] Creé src/components/ui/Toast.jsx
  [ ] Todos compilan sin errores
  [ ] Timestamp: _______________
```

---

### SECCIÓN 5: Layout Components (30 minutos)

> Crea `Header.jsx`, `Footer.jsx`, `ProtectedRoute.jsx` siguiendo el patrón CONTEXTO_RECONSTRUCCION_FRONTEND.md

```
CHECKLIST SECCIÓN 5:
  [ ] Creé src/components/layout/Header.jsx
  [ ] Creé src/components/layout/Footer.jsx
  [ ] Creé src/components/auth/ProtectedRoute.jsx
  [ ] Header usa colores caoba + dorado
  [ ] ProtectedRoute verifica isAuthenticated
  [ ] Todos funcionan sin errores
  [ ] Timestamp: _______________
```

---

### SECCIÓN 6: Páginas Públicas (2 horas)

Crea estas 8 páginas en `src/pages/`:
- Home.jsx
- LoginPage.jsx
- RegisterPage.jsx
- BlogPage.jsx
- BlogDetailPage.jsx
- EventsPage.jsx
- EventDetailPage.jsx
- DonationPage.jsx

**Usa CONTEXTO_RECONSTRUCCION_FRONTEND.md como referencia para cada página.**

```
CHECKLIST SECCIÓN 6:
  [ ] Home.jsx - Página principal (Hero, sections)
  [ ] LoginPage.jsx - Formulario login
  [ ] RegisterPage.jsx - Formulario register
  [ ] BlogPage.jsx - Lista de posts
  [ ] BlogDetailPage.jsx - Detalle de post
  [ ] EventsPage.jsx - Lista de eventos
  [ ] EventDetailPage.jsx - Detalle evento
  [ ] DonationPage.jsx - Formulario donación (Stripe)
  [ ] Todas las páginas renderean
  [ ] No hay errores en consola
  [ ] Timestamp: _______________
```

---

### SECCIÓN 7: Páginas Admin (1.5 horas)

Crea estas 5 páginas en `src/pages/admin/`:
- DashboardPage.jsx
- BlogManagerPage.jsx
- EventsManagerPage.jsx
- PetitionsManagerPage.jsx
- ProfilePage.jsx

```
CHECKLIST SECCIÓN 7:
  [ ] DashboardPage.jsx - Stats y overview
  [ ] BlogManagerPage.jsx - CRUD blog
  [ ] EventsManagerPage.jsx - CRUD eventos
  [ ] PetitionsManagerPage.jsx - CRUD peticiones
  [ ] ProfilePage.jsx - Perfil usuario
  [ ] Todas tienen ProtectedRoute
  [ ] Todas usan colores eclesiales
  [ ] Timestamp: _______________
```

---

### SECCIÓN 8: Router (20 minutos)

Crea `src/router.jsx`:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Páginas públicas
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BlogPage from './pages/BlogPage';
import BlogDetailPage from './pages/BlogDetailPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import DonationPage from './pages/DonationPage';

// Páginas admin
import DashboardPage from './pages/admin/DashboardPage';
import BlogManagerPage from './pages/admin/BlogManagerPage';
import EventsManagerPage from './pages/admin/EventsManagerPage';
import PetitionsManagerPage from './pages/admin/PetitionsManagerPage';
import ProfilePage from './pages/admin/ProfilePage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:id" element={<BlogDetailPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/donate" element={<DonationPage />} />

        {/* Admin */}
        <Route
          path="/admin/dashboard"
          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/blog"
          element={<ProtectedRoute><BlogManagerPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/events"
          element={<ProtectedRoute><EventsManagerPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/petitions"
          element={<ProtectedRoute><PetitionsManagerPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/profile"
          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

```
CHECKLIST SECCIÓN 8:
  [ ] Creé src/router.jsx
  [ ] Todas las 8 rutas públicas están
  [ ] Todas las 5 rutas admin están
  [ ] Admin routes tienen ProtectedRoute
  [ ] Importé todas las páginas
  [ ] Sin errores
  [ ] Timestamp: _______________
```

---

### SECCIÓN 9: App.jsx (15 minutos)

```jsx
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { SiteConfigProvider } from './context/SiteConfigContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppRouter } from './router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SiteConfigProvider>
          <ThemeProvider>
            <AppRouter />
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#6B4423',
                  color: '#F5E6D3',
                },
              }}
            />
          </ThemeProvider>
        </SiteConfigProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

```
CHECKLIST SECCIÓN 9:
  [ ] Actualicé src/App.jsx
  [ ] Importé Toaster de react-hot-toast
  [ ] Importé todos los providers
  [ ] QueryClient configurado
  [ ] Toaster con colores eclesiales
  [ ] Sin errores
  [ ] Timestamp: _______________
```

---

### SECCIÓN 10: Testing (1 hora)

```bash
cd c:\Users\keyme\proyectos\casadelreyhue\frontend

npm run dev
```

**Testing checklist:**

```
PAGES PÚBLICAS:
  [ ] http://localhost:5173/ - Home carga
  [ ] http://localhost:5173/blog - Blog carga
  [ ] http://localhost:5173/events - Events carga
  [ ] http://localhost:5173/donate - Donate carga
  [ ] http://localhost:5173/login - Login carga
  [ ] http://localhost:5173/register - Register carga

FUNCIONALIDAD:
  [ ] Puedo escribir en formularios
  [ ] Botones responden
  [ ] Colores eclesiales se ven
  [ ] Responsive en móvil
  [ ] Dark mode funciona (toggle)

CONSOLE:
  [ ] No hay errores rojos
  [ ] No hay advertencias
  [ ] LocalStorage guarda token

ADMIN:
  [ ] /admin/dashboard redirige a login
  [ ] Login funciona
  [ ] /admin/dashboard accesible post-login
  [ ] Admin pages usan colores eclesiales

Timestamp: _______________
```

---

### SECCIÓN 11: Build (10 minutos)

```bash
npm run build
```

```
CHECKLIST BUILD:
  [ ] Build completó sin errores
  [ ] Carpeta dist/ fue creada
  [ ] No hay warnings
  [ ] Bundle size es razonable
  [ ] Timestamp: _______________
```

---

### ✅ OPCIÓN B COMPLETADA

```
RESULTADO FINAL OPCIÓN B:
  ✅ 6-8 horas de reconstrucción
  ✅ Frontend 100% limpio
  ✅ Colores eclesiales desde inicio
  ✅ Arquitectura profesional
  ✅ Sin deuda técnica
  ✅ Build exitoso
  ✅ Testing completo
  ✅ Listo para producción

ESTADO: 🟢 Limpio y profesional
PRÓXIMO PASO: Deploy a producción
```

---

## 🎯 PASO FINAL: DEPLOY

### Vercel (Recomendado)

```bash
npm install -g vercel

# Login
vercel login

# Deploy
vercel
```

### Netlify

```bash
npm install -g netlify-cli

netlify deploy --prod --dir=dist
```

### Manual (VPS)

```bash
# En tu servidor
npm run build

# Copiar dist/ a web root
# Configurar reverse proxy a backend
```

---

## 📊 RESUMEN FINAL

```
┌─────────────────────────────────────────────────────────┐
│                  CHECKLIST COMPLETADO                   │
│                                                         │
│ OPCIÓN ESCOGIDA:  _____________________________        │
│                                                         │
│ FASE 0: Decisión                     [ ] ✅            │
│ FASE 1: Eliminación/Setup            [ ] ✅            │
│ FASE 2: Configuración                [ ] ✅            │
│ FASE 3: Contextos                    [ ] ✅            │
│ FASE 4: Componentes                  [ ] ✅            │
│ FASE 5: Páginas                      [ ] ✅            │
│ FASE 6: Router                       [ ] ✅            │
│ FASE 7: Testing                      [ ] ✅            │
│ FASE 8: Build                        [ ] ✅            │
│ FASE 9: Deploy                       [ ] ✅            │
│                                                         │
│ FECHA INICIO:         _______________                 │
│ FECHA FINALIZACIÓN:   _______________                 │
│ TIEMPO TOTAL:         _______________                 │
│ ESTADO FINAL:         🟢 COMPLETADO                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🆘 SI ALGO NO FUNCIONA

1. **Lee el error mensaje completo**
2. **Busca en CONTEXTO_RECONSTRUCCION_FRONTEND.md**
3. **Verifica variables de entorno (.env.local)**
4. **Verifica que backend esté corriendo (localhost:8080)**
5. **Limpia cache: `npm cache clean --force`**
6. **Reinstala: `rm -r node_modules && npm install`**

---

**Creado**: 26 de Noviembre, 2025  
**Proyecto**: Casa del Rey  
**Versión**: 1.0 Checklist  
**Estado**: ✅ Listo para usar
