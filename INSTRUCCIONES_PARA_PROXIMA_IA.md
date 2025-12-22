# INSTRUCCIONES PARA LA PRÓXIMA IA

Este documento está diseñado para que una IA futura entienda el estado del proyecto y pueda continuar el trabajo.

---

## 1. CONTEXTO DEL PROYECTO

**Proyecto**: Casa del Rey - Aplicación Web de Iglesia  
**Arquitectura**: React (frontend) + Go (backend)  
**Estado**: Frontend funcional pero con deuda técnica  
**Objetivo Principal**: Reconstrucción limpia del frontend

---

## 2. DOCUMENTACIÓN DISPONIBLE (LEE EN ESTE ORDEN)

### 1️⃣ PARA ENTENDER EL ESTADO ACTUAL
```
Lee PRIMERO: QUICK_REFERENCE_FRONTEND.md (5 min)
Luego lee: AUDITORIA_FRONTEND_ESTADO_ACTUAL.md (20 min)
```

### 2️⃣ PARA RECONSTRUIR DESDE CERO
```
Lee: CONTEXTO_RECONSTRUCCION_FRONTEND.md (30 min)
Este es el blueprint completo
```

### 3️⃣ PARA ENTENDER EL BACKEND
```
Lee: backend/API_BLOG.md
Lee: backend/DASHBOARD_API.md
Lee: backend/STRIPE_INTEGRATION.md
Lee: backend/README_DONACIONES.md
```

---

## 3. COLORES ECLESIALES (MEMORIZAR)

```css
/* Paleta Principal */
--bg-light: #F5E6D3;       /* Fondo base crema */
--bg-dark: #2C1810;        /* Fondo oscuro marrón */

/* Colores Primarios */
--primary: #6B4423;        /* Caoba (botones, CTA) */
--primary-dark: #5A3A1A;   /* Caoba oscura (hover) */

/* Acentos Especiales */
--accent: #D4AF37;         /* Dorado (títulos premium) */

/* Textos */
--text-dark: #2C1810;      /* Texto principal */
--text-light: #FFFBF7;     /* Texto en fondos oscuros */
```

Estos colores están en:
- `frontend/tailwind.config.js` (config)
- `frontend/src/index.css` (variables CSS)

---

## 4. ESTRUCTURA DE CARPETAS

```
proyecto/
├── backend/                 ← API Go (NO TOCAR)
├── frontend/                ← React (MODIFICAR/RECONSTRUIR)
│   ├── src/
│   │   ├── pages/          ← 20+ páginas
│   │   ├── components/     ← 25+ componentes
│   │   ├── context/        ← AuthContext, SiteConfigContext
│   │   ├── layouts/        ← PublicLayout, AdminLayout
│   │   ├── index.css       ← Estilos globales (ACTUALIZADO ✅)
│   │   └── router.jsx      ← Definición de rutas
│   ├── tailwind.config.js  ← Config Tailwind (ACTUALIZADO ✅)
│   ├── vite.config.js      ← Config Vite
│   └── package.json        ← Dependencias
│
├── CONTEXTO_RECONSTRUCCION_FRONTEND.md   ← Blueprint completo
├── AUDITORIA_FRONTEND_ESTADO_ACTUAL.md   ← Estado detallado
├── QUICK_REFERENCE_FRONTEND.md            ← Resumen rápido
└── INSTRUCCIONES_PARA_PROXIMA_IA.md      ← Este archivo

```

---

## 5. ENDPOINTS DEL BACKEND

### ✅ PÚBLICOS (No requieren autenticación)

```
POST   /api/auth/login                → LoginPage
POST   /api/auth/register             → RegisterPage
POST   /api/auth/forgot-password      → ResetPassword
POST   /api/auth/reset-password       → ResetPassword

POST   /api/contact/petition          → PrayerFormPage
POST   /api/donate/stripe             → StripeFormPage

GET    /api/blog/posts                → Home, BlogPages
GET    /api/blog/posts/:slug          → PostDetailPage

GET    /api/events                    → EventsPage, Home
GET    /api/events/:id                → EventDetailPage

GET    /api/health                    → Health check
```

### ⚠️ PROTEGIDOS (Requieren JWT)

```
GET    /api/protected/profile         → ProfilePage

GET    /api/admin/dashboard           → DashboardPage
GET    /api/admin/kpis                → DashboardPage (KPIs)
GET    /api/admin/donations           → DonationHistoryPage
GET    /api/admin/petitions           → AdminPetitionsPage
PUT    /api/admin/petitions/:id/read  → AdminPetitionsPage

POST   /api/admin/blog                → AdminBlogEditor
PUT    /api/admin/blog/:id            → AdminBlogEditor
GET    /api/admin/blog (implied)      → AdminBlogPage

POST   /api/admin/events              → AdminEventsPage
```

### ❌ NO EXISTEN (Frontend los intenta llamar pero no existen)

```
GET    /api/youtube/latest            ← YouTubeFeatured.jsx intenta
GET    /api/groups                    ← GroupsPage intenta
DELETE /api/admin/blog/:id            ← AdminBlogPage intenta
```

---

## 6. PROBLEMAS CONOCIDOS

### 🔴 CRÍTICOS

1. **YouTubeFeatured llama endpoint inexistente**
   - Archivo: `src/components/SocialMedia/YouTubeFeatured.jsx`
   - Usa: `/api/youtube/latest` (NO EXISTE)
   - Solución: Eliminar componente de Home.jsx

2. **Páginas sin backend (GroupsPage, MyGroupsPage)**
   - Archivos: `src/pages/admin/GroupsPage.jsx`, `MyGroupsPage.jsx`
   - Problema: No hay `/api/groups` en backend
   - Solución: Eliminar del router

3. **URLs hardcodeadas**
   - Archivo: `src/context/AuthContext.jsx`
   - Usa: `'http://localhost:8080/api/...'` (no flexible)
   - Solución: Usar `import.meta.env.VITE_API_URL`

### ⚠️ MODERADOS

1. **Componentes shadcn sin usar**
   - Button-shadcn.tsx, Input-shadcn.tsx, Select-shadcn.tsx, Table-shadcn.tsx, Tabs-shadcn.tsx
   - Solución: Eliminar (Usar Button.jsx, Card.jsx, Input.jsx)

2. **Colores no aplicados uniformemente**
   - Algunos componentes admin aún tienen colores azules/grises
   - Solución: Aplicar clase `bg-primary-caoba`, `text-accent-gold`, etc.

3. **Card-shadcn tiene colores azules**
   - Archivo: `src/components/ui/Card-shadcn.tsx`
   - Solución: Actualizar colores O eliminar (usar Card.jsx)

---

## 7. TAREAS QUE YA FUERON HECHAS ✅

- ✅ Actualizar `tailwind.config.js` con colores eclesiales
- ✅ Crear variables CSS en `index.css`
- ✅ Actualizar `Button.jsx` con colores eclesiales
- ✅ Actualizar `Card.jsx` con colores eclesiales
- ✅ Actualizar `Input.jsx` con colores eclesiales
- ✅ Actualizar `Header.jsx` con colores caoba/dorado
- ✅ Actualizar `App.jsx` con toasts eclesiales
- ✅ Crear documento blueprint (`CONTEXTO_RECONSTRUCCION_FRONTEND.md`)
- ✅ Crear auditoría (`AUDITORIA_FRONTEND_ESTADO_ACTUAL.md`)

---

## 8. TAREAS QUE QUEDAN

### OPCIÓN A: Cleanup Rápido (1.5 horas)

```
1. Eliminar 5 componentes shadcn sin usar
2. Eliminar YouTubeFeatured.jsx
3. Eliminar GroupsPage.jsx y MyGroupsPage.jsx
4. Remover YouTubeFeatured de Home.jsx
5. Remover GroupsPage del router.jsx
6. Cambiar URLs hardcodeadas en AuthContext.jsx
7. Aplicar colores a DashboardPage y AdminPages
8. Test y deploy
```

### OPCIÓN B: Reconstrucción Limpia (4-6 horas) ⭐ RECOMENDADO

```
1. Ejecutar OPCIÓN A (cleanup + fixes)
2. Borrar folder frontend/ completamente
3. Crear frontend/ nuevo siguiendo CONTEXTO_RECONSTRUCCION_FRONTEND.md
4. Copiar solo archivos necesarios del anterior
5. Aplicar colores eclesiales desde el inicio
6. Test completo
7. Deploy
```

---

## 9. INSTRUCCIONES PARA OPCIÓN B (RECONSTRUCCIÓN)

Si decides reconstruir el frontend desde cero:

### Paso 1: Setup Base
```bash
cd proyecto/
rm -r frontend/
npm create vite@latest frontend -- --template react
cd frontend/
npm install
```

### Paso 2: Instalar Dependencias Necesarias
```bash
npm install react-router-dom axios @tanstack/react-query react-hook-form
npm install framer-motion react-hot-toast
npm install @stripe/react-stripe-js @stripe/stripe-js
npm install tailwindcss postcss autoprefixer
npm install date-fns react-big-calendar react-quill recharts
npm install @heroicons/react lucide-react
npm install -D tailwindcss @tailwindcss/typography
```

### Paso 3: Configuración Inicial
- Copiar `tailwind.config.js` del documento
- Copiar `index.css` con colores eclesiales
- Copiar `vite.config.js`
- Copiar `postcss.config.js`

### Paso 4: Crear Estructura
Seguir la estructura en `CONTEXTO_RECONSTRUCCION_FRONTEND.md`:
```
src/
├── components/
├── pages/
├── context/
├── layouts/
├── lib/
├── router.jsx
└── App.jsx
```

### Paso 5: Componentes Base
Crear primero:
1. `components/ui/Button.jsx`
2. `components/ui/Card.jsx`
3. `components/ui/Input.jsx`
4. `context/AuthContext.jsx`
5. `components/layout/Header.jsx`
6. `components/layout/Footer.jsx`

### Paso 6: Páginas Públicas
Implementar en orden:
1. Home
2. Auth (Login, Register)
3. Events, EventDetail
4. Blog, PostDetail
5. Prayer, Donation, Stripe

### Paso 7: Páginas Admin
Implementar:
1. Dashboard
2. AdminBlog + Editor
3. AdminEvents
4. AdminPetitions
5. Profile, DonationHistory

### Paso 8: Testing
- Test todas las rutas
- Verificar autenticación
- Verificar formularios
- Verificar integración Stripe
- Verificar estilos eclesiales

---

## 10. VARIABLES DE ENTORNO (.env.local)

```bash
VITE_API_URL=http://localhost:8080/api
VITE_STRIPE_PUBLIC_KEY=pk_test_XXXXXXXXXXXX
VITE_APP_TITLE=Casa del Rey
```

---

## 11. COMANDOS ÚTILES

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Preview
npm run preview

# Limpiar dependencias
npm prune

# Ver tamaño bundle
npm run build --report
```

---

## 12. REFERENCIAS IMPORTANTES

### Documentos del Proyecto
- `CONTEXTO_RECONSTRUCCION_FRONTEND.md` - Blueprint técnico completo
- `AUDITORIA_FRONTEND_ESTADO_ACTUAL.md` - Estado detallado actual
- `QUICK_REFERENCE_FRONTEND.md` - Resumen ejecutivo rápido

### Documentos Backend
- `backend/API_BLOG.md`
- `backend/DASHBOARD_API.md`
- `backend/STRIPE_INTEGRATION.md`
- `backend/router/router.go` - Definición exacta de endpoints

### Librerías Clave
- [React Router v6 Docs](https://reactrouter.com/)
- [TanStack Query Docs](https://tanstack.com/query/latest/)
- [React Hook Form](https://react-hook-form.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)

---

## 13. PUNTOS CLAVE PARA RECORDAR

✅ **MANTENER SIEMPRE**:
- Colores eclesiales (caoba #6B4423, dorado #D4AF37, crema #F5E6D3)
- Tipografía Inter
- Componentes UI base (Button, Card, Input)
- AuthContext y rutas protegidas
- Integración Stripe

❌ **NUNCA VOLVER A HACER**:
- Componentes shadcn sin usar
- Endpoints hardcodeados
- URLs sin variables de entorno
- Componentes que llaman endpoints inexistentes

⚠️ **REVISAR SIEMPRE**:
- Que cada componente tenga su correspondiente endpoint backend
- Que los colores sean consistentes
- Que las rutas sean accesibles y routed correctamente
- Que no haya importaciones circulares

---

## 14. CHECKLIST DE VERIFICACIÓN

Antes de dar por completada cualquier tarea, verifica:

```
□ Todos los archivos compilar sin errores
□ No hay console.errors en dev
□ Colores eclesiales aplicados uniformemente
□ Rutas públicas funcionan (Home, Auth, Events, Blog, Prayer, Donation)
□ Rutas admin protegidas (Dashboard, Blog, Events, Petitions)
□ ProtectedRoute rechaza usuarios no autenticados
□ Formularios validan correctamente
□ Stripe integrado y funciona
□ Todas las páginas responden a mobile
□ npm run build se ejecuta sin errores
□ Tamaño bundle < 500KB (gzipped)
```

---

## 15. CONTACTO / PREGUNTAS

Si tienes dudas:
1. Revisa CONTEXTO_RECONSTRUCCION_FRONTEND.md primero
2. Revisa AUDITORIA_FRONTEND_ESTADO_ACTUAL.md segundo
3. Revisa backend/API_BLOG.md y STRIPE_INTEGRATION.md para endpoints

---

**VERSIÓN**: 1.0  
**FECHA**: 2025-11-26  
**ESTADO**: LISTO PARA PRÓXIMA IA  
**RECOMENDACIÓN**: Seguir OPCIÓN B (Reconstrucción limpia)

---

### 📌 RESUMEN DE 2 MINUTOS

1. Frontend actual funciona pero tiene deuda técnica
2. 5 componentes sin usar, 2 páginas sin backend, 1 endpoint inexistente
3. Colores eclesiales ya están definidos e implementados en componentes base
4. Documentación completa disponible en 3 archivos markdown
5. Mejor opción: Reconstruir desde cero (4-6 horas) siguiendo blueprint
6. Todas las tareas y problemas documentados
7. Próxima IA puede empezar inmediatamente con OPCIÓN B

¡Buena suerte! 🚀
