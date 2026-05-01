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
import VerifyEmail      from './pages/public/VerifyEmail';
import BlogPage         from './pages/public/BlogPage';
import EventsPage       from './pages/public/EventsPage';
import PrayerPage       from './pages/public/PrayerPage';
import VolunteeringPage from './pages/public/VolunteeringPage';
import AboutPage        from './pages/public/AboutPage';
import GalleryPage      from './pages/public/GalleryPage';
import NotFound         from './pages/NotFound';

// Lazy — evita inflar el bundle principal con páginas de uso infrecuente
const DonatePage     = lazy(() => import('./pages/public/DonatePage'));
const PaymentSuccess = lazy(() => import('./pages/public/PaymentSuccess'));

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surf">
      <div className="w-7 h-7 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
    </div>
  );
}

// Páginas admin — lazy para reducir bundle inicial
const AdminIndex         = lazy(() => import('./pages/admin/AdminIndex'));
const AdminUsers         = lazy(() => import('./pages/admin/AdminUsers'));
const AdminBlog          = lazy(() => import('./pages/admin/AdminBlog'));
const AdminEvents        = lazy(() => import('./pages/admin/AdminEvents'));
const AdminPetitions     = lazy(() => import('./pages/admin/AdminPetitions'));
const AdminVolunteers    = lazy(() => import('./pages/admin/AdminVolunteers'));
const AdminCellReports   = lazy(() => import('./pages/admin/AdminCellReports'));
const AdminBoletas       = lazy(() => import('./pages/admin/AdminBoletas'));
const AdminSocial        = lazy(() => import('./pages/admin/AdminSocial'));
const AdminAnnouncements = lazy(() => import('./pages/admin/AdminAnnouncements'));
const AdminGallery       = lazy(() => import('./pages/admin/AdminGallery'));
const AdminActivityLog   = lazy(() => import('./pages/admin/AdminActivityLog'));
const ProfilePage        = lazy(() => import('./pages/public/ProfilePage'));

// Páginas líder — lazy
import LeaderLayout        from './components/layout/LeaderLayout';
const LeaderIndex         = lazy(() => import('./pages/leader/LeaderIndex'));
const LeaderReports       = lazy(() => import('./pages/leader/LeaderReports'));
const LeaderBoletas       = lazy(() => import('./pages/leader/LeaderBoletas'));
const LeaderVolunteers    = lazy(() => import('./pages/leader/LeaderVolunteers'));
const LeaderCellDirectory = lazy(() => import('./pages/leader/LeaderCellDirectory'));

export const router = createBrowserRouter([

  // ── Panel Admin ────────────────────────────────────────────────────────────
  {
    path: '/admin',
    element: (
      <ProtectedRoute adminOnly>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true,             element: <Suspense fallback={<PageFallback />}><AdminIndex /></Suspense> },
      { path: 'users',           element: <Suspense fallback={<PageFallback />}><AdminUsers /></Suspense> },
      { path: 'blog',            element: <Suspense fallback={<PageFallback />}><AdminBlog /></Suspense> },
      { path: 'events',          element: <Suspense fallback={<PageFallback />}><AdminEvents /></Suspense> },
      { path: 'petitions',       element: <Suspense fallback={<PageFallback />}><AdminPetitions /></Suspense> },
      { path: 'volunteers',      element: <Suspense fallback={<PageFallback />}><AdminVolunteers /></Suspense> },
      { path: 'cell-reports',    element: <Suspense fallback={<PageFallback />}><AdminCellReports /></Suspense> },
      { path: 'boletas',         element: <Suspense fallback={<PageFallback />}><AdminBoletas /></Suspense> },
      { path: 'social',          element: <Suspense fallback={<PageFallback />}><AdminSocial /></Suspense> },
      { path: 'announcements',   element: <Suspense fallback={<PageFallback />}><AdminAnnouncements /></Suspense> },
      { path: 'gallery',         element: <Suspense fallback={<PageFallback />}><AdminGallery /></Suspense> },
      { path: 'activity-log',    element: <Suspense fallback={<PageFallback />}><AdminActivityLog /></Suspense> },
      { path: 'profile',         element: <Suspense fallback={<PageFallback />}><ProfilePage /></Suspense> },
    ],
  },

  // ── Panel Líder ────────────────────────────────────────────────────────────
  {
    path: '/leader',
    element: (
      <ProtectedRoute leaderOnly>
        <LeaderLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true,             element: <Suspense fallback={<PageFallback />}><LeaderIndex /></Suspense> },
      { path: 'reports',         element: <Suspense fallback={<PageFallback />}><LeaderReports /></Suspense> },
      { path: 'boletas',         element: <Suspense fallback={<PageFallback />}><LeaderBoletas /></Suspense> },
      { path: 'volunteers',      element: <Suspense fallback={<PageFallback />}><LeaderVolunteers /></Suspense> },
      { path: 'cell-directory',  element: <Suspense fallback={<PageFallback />}><LeaderCellDirectory /></Suspense> },
      { path: 'profile',         element: <Suspense fallback={<PageFallback />}><ProfilePage /></Suspense> },
    ],
  },

  // ── Sitio Público ──────────────────────────────────────────────────────────
  {
    path: '/',
    element: <App />,
    children: [
      { index: true,                   element: <Home /> },
      { path: 'about',                 element: <AboutPage /> },
      { path: 'blog',                  element: <BlogPage /> },
      { path: 'blog/:slug',            element: <BlogPage /> },
      { path: 'events',                element: <EventsPage /> },
      { path: 'gallery',               element: <GalleryPage /> },
      { path: 'prayer',                element: <PrayerPage /> },
      { path: 'donate',                element: <Suspense fallback={<PageFallback />}><DonatePage /></Suspense> },
      { path: 'payment-success',       element: <Suspense fallback={<PageFallback />}><PaymentSuccess /></Suspense> },
      { path: 'volunteering',          element: <VolunteeringPage /> },
      { path: 'profile',               element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
      { path: 'login',                 element: <Login /> },
      { path: 'register',              element: <Register /> },
      { path: 'forgot-password',       element: <ForgotPassword /> },
      { path: 'verify-email',          element: <VerifyEmail /> },
      { path: 'reset-password/:token', element: <ResetPassword /> },
      { path: '*',                     element: <NotFound /> },
    ],
  },
]);
