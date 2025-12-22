import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-caoba"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si la ruta es solo para administradores, verificar el rol
  if (adminOnly && !isAdmin) {
    console.warn('Acceso denegado: Se requiere rol de administrador.');
    return <Navigate to="/" replace />; // Redirigir a la página de inicio o a una página de "no autorizado"
  }

  return children;
}
