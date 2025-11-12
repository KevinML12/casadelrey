import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DonationPage from './pages/DonationPage';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardPage from './pages/admin/DashboardPage';
import ProfilePage from './pages/admin/ProfilePage';
import DonationHistoryPage from './pages/admin/DonationHistoryPage';
import GroupsPage from './pages/admin/GroupsPage';

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
    ]
  },
  // Ruta 404
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

export default router;