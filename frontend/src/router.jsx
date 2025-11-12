import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import AdminLayout from './layouts/AdminLayout';
import App from './App';
import DashboardPage from './pages/admin/DashboardPage';
import ProfilePage from './pages/admin/ProfilePage';
import DonationHistoryPage from './pages/admin/DonationHistoryPage';
import MyGroupsPage from './pages/admin/MyGroupsPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  // Ruta de Autenticación
  {
    path: '/login',
    element: <LoginPage />,
  },
  
  // Rutas Protegidas del Dashboard
  {
    path: '/admin',
    element: <AdminLayout />,
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
            element: <MyGroupsPage />
        },
        // ... otras rutas de admin
    ]
  },
  // Ruta 404
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

export default router;