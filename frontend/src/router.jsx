import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import App from './App';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';

// Páginas públicas (eager — sin dependencias pesadas)
import Home             from './pages/public/Home';
import Login            from './pages/public/Login';
import Register         from './pages/public/Register';
import ForgotPassword   from './pages/public/ForgotPassword';
import ResetPassword    from './pages/public/ResetPassword';
import BlogPage         from './pages/public/BlogPage';
import EventsPage       from './pages/public/EventsPage';
import PrayerPage       from './pages/public/PrayerPage';
import VolunteeringPage from './pages/public/VolunteeringPage';
import AboutPage        from './pages/public/AboutPage';
import NotFound         from './pages/NotFound';

// Páginas con Stripe — lazy para que el SDK no contamine el bundle principal
const DonatePage     = lazy(() => import('./pages/public/DonatePage'));
const PaymentSuccess = lazy(() => import('./pages/public/PaymentSuccess'));

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-7 h-7 rounded-full border-2 border-line border-t-blue animate-spin" />
    </div>
  );
}

// Páginas admin
import Dashboard        from './pages/admin/Dashboard';
import AdminBlog        from './pages/admin/AdminBlog';
import AdminEvents      from './pages/admin/AdminEvents';
import AdminPetitions   from './pages/admin/AdminPetitions';
import Profile          from './pages/admin/Profile';

export const router = createBrowserRouter([

  // ── Panel Admin ────────────────────────────────────────────────────────────
  // Layout propio (sidebar sin header/footer público).
  // Los providers (Auth, QueryClient) viven en main.jsx, disponibles aquí.
  {
    path: '/admin',
    element: (
      <ProtectedRoute adminOnly>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true,       element: <Dashboard /> },
      { path: 'blog',      element: <AdminBlog /> },
      { path: 'events',    element: <AdminEvents /> },
      { path: 'petitions', element: <AdminPetitions /> },
      { path: 'profile',   element: <Profile /> },
    ],
  },

  // ── Sitio Público ──────────────────────────────────────────────────────────
  // App shell: Header + animación de página + Footer.
  {
    path: '/',
    element: <App />,
    children: [
      { index: true,                   element: <Home /> },
      { path: 'about',                 element: <AboutPage /> },
      { path: 'blog',                  element: <BlogPage /> },
      { path: 'blog/:slug',            element: <BlogPage /> },
      { path: 'events',                element: <EventsPage /> },
      { path: 'prayer',                element: <PrayerPage /> },
      { path: 'donate',                element: <Suspense fallback={<PageFallback />}><DonatePage /></Suspense> },
      { path: 'payment-success',       element: <Suspense fallback={<PageFallback />}><PaymentSuccess /></Suspense> },
      { path: 'volunteering',          element: <VolunteeringPage /> },
      { path: 'login',                 element: <Login /> },
      { path: 'register',              element: <Register /> },
      { path: 'forgot-password',       element: <ForgotPassword /> },
      { path: 'reset-password/:token', element: <ResetPassword /> },
      { path: '*',                     element: <NotFound /> },
    ],
  },
]);
