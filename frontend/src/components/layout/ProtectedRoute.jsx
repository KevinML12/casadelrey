import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({
  children,
  adminOnly    = false,
  leaderOnly   = false,
  leaderOrAdmin = false,
  volunteerOnly = false,
  panel        = false,
}) {
  const { isAuthenticated, isAdmin, isLeader, isVolunteer, canAccessPanel, loading } = useAuth();

  if (loading) {
    // adminOnly/leaderOnly/volunteerOnly/panel envuelven el panel claro
    // (Apple light); sin ninguna de esas props es /profile publica
    // (navy oscuro) — bg-surf/border-outline-var ahi SI es correcto, pero
    // mostraba ese flash oscuro tambien al entrar a /admin, /leader,
    // /volunteer mientras resolvia el login.
    const isPanel = adminOnly || leaderOnly || leaderOrAdmin || volunteerOnly || panel;
    return (
      <div className={`min-h-screen flex items-center justify-center ${isPanel ? 'bg-paper' : 'bg-surf'}`}>
        <div className={`w-10 h-10 rounded-full border-2 border-t-pri animate-spin ${isPanel ? 'border-bg/12' : 'border-outline-var'}`} />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly    && !isAdmin)                  return <Navigate to="/"      replace />;
  if (leaderOnly   && !isLeader)                 return <Navigate to={isAdmin ? '/admin' : '/'} replace />;
  if (leaderOrAdmin && !isAdmin && !isLeader)    return <Navigate to="/"      replace />;
  if (volunteerOnly && !isVolunteer)             return <Navigate to={isAdmin ? '/admin' : isLeader ? '/leader' : '/'} replace />;
  if (panel        && !canAccessPanel)           return <Navigate to="/"      replace />;

  return children;
}
