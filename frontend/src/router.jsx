import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DonationPage from './pages/DonationPage';
import StripeFormPage from './pages/StripeFormPage';
import PrayerOptionsPage from './pages/PrayerOptionsPage';
import PrayerFormPage from './pages/PrayerFormPage';
import HistoryPage from './pages/HistoryPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import PostDetailPage from './pages/PostDetailPage';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardPage from './pages/admin/DashboardPage';
import ProfilePage from './pages/admin/ProfilePage';
import DonationHistoryPage from './pages/admin/DonationHistoryPage';
import GroupsPage from './pages/admin/GroupsPage';
import AdminBlogPage from './pages/admin/AdminBlogPage';
import AdminBlogEditor from './pages/admin/AdminBlogEditor';
import AdminEventsPage from './pages/admin/AdminEventsPage';
import AdminPetitionsPage from './pages/admin/AdminPetitionsPage';

const router = createBrowserRouter([
  // Rutas Públicas
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/donaciones',
    element: <DonationPage />,
  },
  {
    path: '/donaciones/tarjeta',
    element: <StripeFormPage />,
  },
  {
    path: '/oracion',
    element: <PrayerOptionsPage />,
  },
  {
    path: '/oracion/confidencial',
    element: <PrayerFormPage />,
  },
  {
    path: '/historia',
    element: <HistoryPage />,
  },
  {
    path: '/eventos',
    element: <EventsPage />,
  },
  {
    path: '/eventos/:id',
    element: <EventDetailPage />,
  },
  {
    path: '/blog/:slug',
    element: <PostDetailPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/registro',
    element: <RegisterPage />,
  },
  
  // Rutas Protegidas (Admin)
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
        {
            index: true,
            element: <Navigate to="/admin/dashboard" replace />
        },
        {
            path: 'dashboard',
            element: <DashboardPage />
        },
        {
            path: 'perfil',
            element: <ProfilePage />
        },
        {
            path: 'historial',
            element: <DonationHistoryPage />
        },
        {
            path: 'grupos',
            element: <GroupsPage />
        },
        {
            path: 'blog',
            element: <AdminBlogPage />
        },
        {
            path: 'blog/new',
            element: <AdminBlogEditor />
        },
        {
            path: 'blog/:id',
            element: <AdminBlogEditor />
        },
        {
            path: 'eventos',
            element: <AdminEventsPage />
        },
        {
            path: 'peticiones',
            element: <AdminPetitionsPage />
        },
    ]
  },
  // Ruta 404
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

export default router;