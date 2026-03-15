# Casa del Rey — Frontend

App web para la Iglesia Casa del Rey (Huehuetenango, Guatemala). Construida con **React 19 + Vite + Tailwind CSS v3**.

---

## Stack

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19 | Framework UI |
| Vite | 7 | Bundler / dev server |
| Tailwind CSS | 3 | Estilos |
| React Router | 7 | Navegación SPA |
| Axios | — | HTTP client |
| React Hook Form | — | Formularios |
| TanStack Query | 5 | Mutaciones async |
| jwt-decode | — | Decodificar tokens JWT |
| Supabase JS | — | Cliente Supabase (auth/db) |
| Lucide React | — | Iconografía |
| React Hot Toast | — | Notificaciones |
| Framer Motion | — | Animaciones |

---

## Variables de Entorno

Crear `frontend/.env` a partir de `.env.example`:

```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_APP_TITLE=Casa del Rey
VITE_STRIPE_PUBLIC_KEY=pk_test_...    # opcional, pagos futuros
```

---

## Arranque Local

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # producción → dist/
```

---

## Rutas y Páginas

### Públicas (sin autenticación)

| Ruta | Página | Descripción |
|---|---|---|
| `/` | `Home` | Landing page principal |
| `/about` | `AboutPage` | Historia, misión, visión, multimedia |
| `/blog` | `BlogPage` | Listado de publicaciones |
| `/blog/:slug` | `BlogPage` | Detalle de una publicación |
| `/events` | `EventsPage` | Listado de eventos y cultos |
| `/prayer` | `PrayerPage` | Formulario de petición de oración |
| `/donate` | `DonatePage` | Formulario de donación simulada |
| `/volunteering` | `VolunteeringPage` | Áreas de voluntariado |
| `/payment-success` | `PaymentSuccess` | Confirmación post-donación |
| `/login` | `Login` | Inicio de sesión |
| `/register` | `Register` | Registro de cuenta nueva |
| `/forgot-password` | `ForgotPassword` | Recuperar contraseña |
| `/reset-password/:token` | `ResetPassword` | Nueva contraseña con token de URL |
| `*` | `NotFound` | 404 |

### Admin (requiere `role === 'admin'`)

Todas bajo `/admin`, envueltas en `AdminLayout` (sidebar + outlet).

| Ruta | Página | Descripción |
|---|---|---|
| `/admin` | `Dashboard` | KPIs + tabla de últimas donaciones |
| `/admin/blog` | `AdminBlog` | CRUD publicaciones del blog |
| `/admin/events` | `AdminEvents` | CRUD eventos |
| `/admin/petitions` | `AdminPetitions` | Gestión peticiones de oración |
| `/admin/profile` | `Profile` | Datos del usuario autenticado |

---

## Funcionalidades por Página

### `Home.jsx`
Landing page. Todo el contenido es **estático** (no llama endpoints).

Secciones internas:
- **HeroSection** — Fondo navy oscuro, titular grande, badge "Luz para las Naciones", 2 CTAs primarios, 3 estadísticas (5K+ miembros, 200+ eventos, 15+ años)
- **ServicesSection** — Grid 4 tarjetas con links a `/prayer`, `/events`, `/blog`, `/donate`
- **SundayBanner** — Banner oscuro con hora del servicio dominical (10 AM) y dirección física
- **PrayerCTA** — Sección intermedia invitando a enviar petición de oración → `/prayer`
- **DonationSection** — Montos rápidos Q50/100/250/500 (decorativos) + CTA a `/donate`
- **CommunitySection** — Promoción de células, CTAs a `/register` y `/about`

---

### `Login.jsx`
- Campos: `email`, `password`
- `POST /v1/auth/login` → recibe `{ token }`
- Llama `login(token)` del `AuthContext` → guarda en `localStorage` → redirige a `/admin`
- Links a `/forgot-password` y `/register`

---

### `Register.jsx`
- Campos: nombre completo, email, contraseña, confirmar contraseña
- Llama `register(email, password, name)` del `AuthContext`
- ⚠️ **Pendiente**: `AuthContext` no tiene el método `register` implementado aún
- Redirige a `/admin` en éxito

---

### `ForgotPassword.jsx`
- Campo: email
- Llama `forgotPassword(email)` del `AuthContext`
- ⚠️ **Pendiente**: método no implementado en `AuthContext`
- Muestra pantalla de confirmación tras envío (estado `submitted`)

---

### `ResetPassword.jsx`
- Lee `:token` de la URL (`useParams`)
- Campos: nueva contraseña, confirmar contraseña
- Llama `resetPassword(token, password)` del `AuthContext`
- ⚠️ **Pendiente**: método no implementado en `AuthContext`
- Redirige a `/login` en éxito

---

### `BlogPage.jsx`
Página dual: listado o detalle según si hay `/:slug` en la URL.

- **Vista listado** (`/blog`): `GET /v1/blog/` → grid de tarjetas con título, excerpt, fecha
- **Vista detalle** (`/blog/:slug`): `GET /v1/blog/:slug` → artículo completo (HTML crudo en `post.content`)
- Modelo de post: `{ id, title, slug, excerpt, content, created_at }`

---

### `EventsPage.jsx`
- `GET /v1/events/` → array de eventos
- Cards con: título, fecha formateada (español), ubicación, descripción resumida
- ⚠️ **Pendiente**: los links apuntan a `/events/:id` pero esa ruta no existe en el router

---

### `PrayerPage.jsx`
- Renderiza `PageHero` con versículo bíblico + 3 badges de confianza
- Contiene `<PrayerForm />` (ver componente abajo)

---

### `DonatePage.jsx`
- **Columna izquierda**: 4 destinos del dinero + cita bíblica (2 Corintios 9:6)
- **Columna derecha**: `<DonationCard />` (ver componente abajo)

---

### `VolunteeringPage.jsx`
- Contenido **estático** (no llama endpoints)
- 6 áreas de servicio hardcodeadas:
  - Equipo de Bienvenida
  - Ministerio de Niños
  - Equipo de Producción (sonido/proyección)
  - Grupos de Conexión
  - Equipo de Alcance
  - Ministerio de Oración
- CTA al final → `/prayer` (sustituto temporal del formulario de interés)

---

### `AboutPage.jsx`
- Contenido **estático**
- Sección Historia y Pilares: 3 cards (Misión, Visión, Valores) + bloques de texto libre
- Sección Multimedia: video placeholder de YouTube + 2 items de contenido extra
- Sección Podcast: bloque oscuro con CTAs de acceso

---

### `Dashboard.jsx` (Admin)
- `GET /admin/kpis` → `{ total_users, total_donations, total_petitions, monthly_growth }`
- `GET /admin/donations` → array de donaciones
- Muestra 4 tarjetas de KPI + tabla de últimas 10 donaciones
- Nota: los montos de donación vienen en centavos (dividir entre 100 para mostrar)

---

### `AdminBlog.jsx` (Admin)
- `GET /blog/posts` — lista posts
- `POST /admin/blog` — crear post
- `PUT /admin/blog/:id` — editar post
- Formulario inline con campos: `title`, `slug`, `excerpt`, `content` (HTML libre), `is_published`
- ⚠️ **Pendiente**: eliminar post no implementado

---

### `AdminEvents.jsx` (Admin)
- `GET /events` — lista eventos
- `POST /admin/events` — crear evento
- Formulario con campos: `title`, `date`, `location`, `description`
- ⚠️ **Pendiente**: editar y eliminar no implementados

---

### `AdminPetitions.jsx` (Admin)
- `GET /admin/petitions` — lista peticiones
- `PUT /admin/petitions/:id/read` — marcar como leída
- Badge "Nueva" para peticiones sin leer (`read === false`)
- ⚠️ **Pendiente**: eliminar no implementado

---

### `Profile.jsx` (Admin)
- Sin llamadas a API — usa datos del `AuthContext` (`user.email`, `user.role`)
- ⚠️ **Pendiente**: editar perfil y cambiar contraseña (muestran toast "próximamente")

---

## Componentes UI (`src/components/ui/`)

### `Button.jsx`
Botón polimórfico — puede renderizarse como cualquier tag con `as`.

```jsx
<Button variant="primary" size="md" as={Link} to="/login">
  Ingresar
</Button>
```

| Prop | Valores | Default |
|---|---|---|
| `variant` | `primary` \| `secondary` \| `outline` \| `ghost` \| `accent` \| `gold` \| `danger` | `primary` |
| `size` | `sm` \| `md` \| `lg` \| `xl` | `md` |
| `as` | string o componente | `'button'` |
| `disabled` | bool | `false` |

---

### `Card.jsx`
Exporta 4 componentes:

```jsx
<Card>
  <CardHeader>Título</CardHeader>
  <CardContent>Contenido</CardContent>
  <CardFooter>Acciones</CardFooter>
</Card>
```

El `Card` base usa `bg-panel border border-rim rounded-card shadow-card p-6`.

---

### `Input.jsx` / `Textarea`
Exporta 2 componentes:

```jsx
import Input, { Textarea } from '../ui/Input';

<Input label="Nombre" error={errors.name} {...register('name')} />
<Textarea label="Mensaje" rows={5} {...register('message')} />
```

Integra automáticamente estilos de error con `react-hook-form` (acepta objeto `{ message }` en `error`).

---

## Componentes Layout (`src/components/layout/`)

### `Header.jsx`
- Sticky, glassmorphism (`backdrop-blur`)
- Nav links: Inicio, Conócenos, Blog, Eventos, Oración, Donaciones
- Toggle dark/light mode
- Menú de usuario (dropdown): Perfil, Dashboard (solo admin), Cerrar Sesión
- Responsive: menú hamburguesa en mobile

---

### `Footer.jsx`
- Fondo `bg-navy` siempre oscuro
- 4 columnas: Brand, Navegación, Contacto, Redes Sociales
- Datos reales: Facebook `casadelreyhuehue`, Instagram `ig.casadelrey`
- Tel: `+502 5426-0369`, Email: `info@casadelreyhuehue.com`
- Dirección: 7a. Calle 12-66, Huehuetenango, Guatemala

---

### `PageHero.jsx`
Banner de subpáginas interior. Reutilizable.

```jsx
<PageHero
  icon={Calendar}
  title="Eventos"
  subtitle="Conéctate con la comunidad."
>
  {/* children opcionales bajo el subtítulo */}
</PageHero>
```

Fondo `bg-navy` + gradiente + patrón punteado. Siempre texto blanco.

---

### `AdminLayout.jsx`
- **Desktop**: sidebar fijo 256px a la izquierda, fondo `bg-navy`
- **Mobile**: topbar de 56px + drawer con overlay
- Links: Dashboard, Blog, Peticiones, Eventos, Perfil
- Footer del sidebar: email del usuario + botón logout
- Renderiza `<Outlet />` como contenido principal

---

### `ProtectedRoute.jsx`

```jsx
<ProtectedRoute adminOnly={true}>
  <AdminLayout />
</ProtectedRoute>
```

Flujo: loading → spinner / no auth → redirect `/login` / no admin → redirect `/` / ok → children.

---

## Secciones Reutilizables (`src/components/sections/`)

### `PrayerForm.jsx`
Formulario de petición de oración con `react-hook-form`.

```jsx
<PrayerForm compact={false} />
```

- Campos: nombre*, email, categoría (select), asunto*, petición (textarea*)
- `POST /v1/contact/petition` → `{ name, email, subject, message, category }`
- Estado de éxito: pantalla de confirmación + opción de enviar otra
- Categorías: Salud, Familia, Trabajo/Finanzas, Crecimiento Espiritual, Otro

---

### `DonationCard.jsx`
Formulario de donación simulada.

- Montos preset: Q50, Q100, Q250, Q500 + campo libre (mínimo Q10)
- Propósitos: Fondo General, Células, Misiones, Ministerio Joven, Edificio
- Datos: nombre*, email
- `POST /v1/donations/simulate` → `{ name, email, amount, currency: 'GTQ', payment_method: 'simulado', donation_purpose }`
- Estado de éxito: pantalla de agradecimiento con el monto en dorado

---

## Contextos

### `AuthContext` (`useAuth()`)

```js
const { user, isAuthenticated, isAdmin, loading, login, logout } = useAuth();
```

| Valor | Tipo | Descripción |
|---|---|---|
| `user` | `{ id, email, role }` \| null | Decodificado del JWT |
| `isAuthenticated` | bool | `!!token` |
| `isAdmin` | bool | `user?.role === 'admin'` |
| `loading` | bool | Inicialización del contexto |
| `login(token)` | fn | Guarda token en state + localStorage |
| `logout()` | fn | Limpia state + localStorage |

⚠️ **Pendiente**: métodos `register()`, `forgotPassword()`, `resetPassword()` no implementados.

---

### `SiteConfigContext` (`useSiteConfig()`)

```js
const { appTitle, apiUrl, stripePublicKey } = useSiteConfig();
```

Lee variables `VITE_*` con fallbacks razonables.

---

## Hooks

### `useDarkMode()`
```js
const { isDark, toggle } = useDarkMode();
```
- Inicializa desde `localStorage.getItem('theme')`, luego `prefers-color-scheme`
- Agrega/quita clase `dark` en `<html>` y persiste elección

---

### `usePost({ url, onSuccess, onError })`
Wrapper de `useMutation` (TanStack Query) sobre `apiClient.post`.

```js
const { mutate, isPending } = usePost({ url: '/v1/contact/petition', onSuccess: () => {} });
mutate({ name: '...', message: '...' });
```

---

## API Client (`src/lib/apiClient.js`)

- Base URL: `VITE_API_URL` o `http://localhost:8080/api/v1`
- Timeout: 10 segundos
- Interceptor de request: agrega `Authorization: Bearer <token>` si hay token en `localStorage`
- Interceptor de response: limpia token en localStorage si recibe `401`

---

## Sistema de Diseño

### Paleta de Colores (Tailwind tokens)

| Token | Valor Light | Valor Dark | Uso |
|---|---|---|---|
| `bg-surface` | `#F8FAFC` | `#080F1E` | Canvas principal de página |
| `bg-surface-2` | `#EEF2F8` | `#0C1525` | Secciones alternadas |
| `bg-panel` | `#FFFFFF` | `#111C30` | Tarjetas, modales |
| `bg-panel-2` | `#F1F5F9` | `#162540` | Inputs, chips, filas de tabla |
| `text-on-surface` | `#0D1B3E` | `#E8F0FE` | Títulos principales |
| `text-on-surface-2` | `#4B6380` | `#7B99BE` | Texto de cuerpo |
| `text-on-surface-3` | `#8FA3BC` | `#4A6480` | Texto muted/placeholder |
| `border-rim` | `#DCE8F4` | `#1A3050` | Bordes de cards e inputs |
| `text-primary` | `#2563EB` | `#2563EB` | Azul royal (acción principal) |
| `bg-navy` | `#0D1B3E` | `#0D1B3E` | Hero, banners, footer (siempre oscuro) |
| `text-gold` | `#F59E0B` | `#F59E0B` | Acento dorado premium |

> Los tokens `surface`, `panel`, `on-surface` y `rim` son **CSS variables semánticas** definidas en `index.css`. Cambian automáticamente con la clase `dark` en `<html>`. No necesitan prefijo `dark:` en los componentes.

### Tipografía
- Fuente: **Inter** (cargada desde CDN `rsms.me/inter/inter.css`)
- Encabezados: `font-black` (900)
- Cuerpo: `font-normal` con `leading-relaxed`

### Sombras personalizadas
- `shadow-card` — sutil para tarjetas en reposo
- `shadow-card-lg` — hover/focus de tarjetas
- `shadow-glow-blue` — glow azul para CTAs primarios
- `shadow-glow-gold` — glow dorado para CTAs de donación

---

## Pendientes y Bugs Conocidos

| Prioridad | Descripción |
|---|---|
| 🔴 Alta | `AuthContext` no implementa `register`, `forgotPassword`, `resetPassword` |
| 🔴 Alta | Ruta `/events/:id` no existe en el router (links rotos desde `EventsPage`) |
| 🟡 Media | `AdminBlog`, `AdminEvents`, `AdminPetitions` — falta implementar eliminar |
| 🟡 Media | `AdminEvents` — falta implementar editar |
| 🟡 Media | `Profile` — editar perfil y cambiar contraseña dicen "próximamente" |
| 🟢 Baja | `PaymentSuccess` y `VolunteeringPage` usan alias legacy de CSS (funcional pero redundante) |
| 🟢 Baja | `supabaseClient.js` importado en el proyecto pero ninguna página lo usa actualmente |

---

## Estructura de Archivos

```
frontend/
├── public/
├── src/
│   ├── main.jsx              # Entry point, provee QueryClient + RouterProvider
│   ├── App.jsx               # AppShell (Header + main + Footer) + providers de contexto
│   ├── router.jsx            # Todas las rutas con createBrowserRouter
│   ├── index.css             # CSS variables semánticas + Tailwind directives
│   ├── lib/
│   │   ├── apiClient.js      # Axios instance con interceptors JWT
│   │   └── supabaseClient.js # Supabase JS client (sin uso activo aún)
│   ├── context/
│   │   ├── AuthContext.jsx   # Auth basada en JWT localStorage
│   │   └── SiteConfigContext.jsx # Config global desde VITE_* env vars
│   ├── hooks/
│   │   ├── useDarkMode.js    # Toggle dark/light con localStorage + html.dark
│   │   └── useApiCall.js     # usePost wrapper de useMutation
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.jsx    # Botón polimórfico, 7 variantes
│   │   │   ├── Card.jsx      # Card + CardHeader + CardContent + CardFooter
│   │   │   └── Input.jsx     # Input + Textarea con manejo de errores
│   │   ├── layout/
│   │   │   ├── Header.jsx    # Nav sticky + dark toggle + user menu
│   │   │   ├── Footer.jsx    # Footer navy oscuro
│   │   │   ├── AdminLayout.jsx # Sidebar admin (desktop + mobile drawer)
│   │   │   ├── PageHero.jsx  # Banner navy reutilizable para subpáginas
│   │   │   └── ProtectedRoute.jsx # Guard de rutas autenticadas/admin
│   │   └── sections/
│   │       ├── PrayerForm.jsx    # Formulario petición de oración
│   │       └── DonationCard.jsx  # Formulario donación simulada
│   └── pages/
│       ├── NotFound.jsx
│       ├── public/
│       │   ├── Home.jsx
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── ForgotPassword.jsx
│       │   ├── ResetPassword.jsx
│       │   ├── BlogPage.jsx
│       │   ├── EventsPage.jsx
│       │   ├── PrayerPage.jsx
│       │   ├── DonatePage.jsx
│       │   ├── PaymentSuccess.jsx
│       │   ├── VolunteeringPage.jsx
│       │   └── AboutPage.jsx
│       └── admin/
│           ├── Dashboard.jsx
│           ├── AdminBlog.jsx
│           ├── AdminEvents.jsx
│           ├── AdminPetitions.jsx
│           └── Profile.jsx
├── tailwind.config.js        # Tokens semánticos + colores estáticos
├── vite.config.js
├── package.json
└── .env.example
```
