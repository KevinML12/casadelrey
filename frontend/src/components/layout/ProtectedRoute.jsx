import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false, leaderOnly = false, panel = false }) {
  const { isAuthenticated, isAdmin, isLeader, canAccessPanel, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-10 h-10 rounded-full border-2 border-line border-t-blue animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  if (leaderOnly && !isLeader) return <Navigate to={isAdmin ? '/admin' : '/'} replace />;
  if (panel && !canAccessPanel) return <Navigate to="/" replace />;

  return children;
}
