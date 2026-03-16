import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';

// Páginas públicas
import Home            from './pages/public/Home';
import Login           from './pages/public/Login';
import Register        from './pages/public/Register';
import ForgotPassword  from './pages/public/ForgotPassword';
import ResetPassword   from './pages/public/ResetPassword';
import BlogPage        from './pages/public/BlogPage';
import EventsPage      from './pages/public/EventsPage';
import PrayerPage      from './pages/public/PrayerPage';
import DonatePage      from './pages/public/DonatePage';
import PaymentSuccess  from './pages/public/PaymentSuccess';
import VolunteeringPage from './pages/public/VolunteeringPage';
import AboutPage       from './pages/public/AboutPage';
import NotFound        from './pages/NotFound';

// Páginas admin
import Dashboard       from './pages/admin/Dashboard';
import AdminBlog       from './pages/admin/AdminBlog';
import AdminEvents     from './pages/admin/AdminEvents';
import AdminPetitions  from './pages/admin/AdminPetitions';
import Profile         from './pages/admin/Profile';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // ── Rutas públicas ──────────────────────────────────────────
      { index: true,                    element: <Home /> },
      { path: 'about',                  element: <AboutPage /> },
      { path: 'blog',                   element: <BlogPage /> },
      { path: 'blog/:slug',             element: <BlogPage /> },
      { path: 'events',                 element: <EventsPage /> },
      { path: 'prayer',                 element: <PrayerPage /> },
      { path: 'donate',                 element: <DonatePage /> },
      { path: 'payment-success',        element: <PaymentSuccess /> },
      { path: 'volunteering',           element: <VolunteeringPage /> },
      { path: 'login',                  element: <Login /> },
      { path: 'register',               element: <Register /> },
      { path: 'forgot-password',        element: <ForgotPassword /> },
      { path: 'reset-password/:token',  element: <ResetPassword /> },

      // ── Rutas admin (requieren autenticación + role admin) ──────
      {
        path: 'admin',
        element: (
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true,          element: <Dashboard /> },
          { path: 'blog',         element: <AdminBlog /> },
          { path: 'events',       element: <AdminEvents /> },
          { path: 'petitions',    element: <AdminPetitions /> },
          { path: 'profile',      element: <Profile /> },
        ],
      },

      // ── 404 ─────────────────────────────────────────────────────
      { path: '*', element: <NotFound /> },
    ],
  },
]);
