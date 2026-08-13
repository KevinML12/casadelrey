import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../lib/feed';
import toast from 'react-hot-toast';
import { Halos } from '../ui/Glass';
import useGlassSpecular from '../../hooks/useGlassSpecular';

export default function VolunteerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  useGlassSpecular();
  const settings = useApi('/settings') || {};
  const bgImage = settings.volunteer_bg || '/images/bg-volunteer.png';

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    navigate('/auth');
  };

  const initial = (user?.name || user?.email || '?')[0].toUpperCase();

  return (
    <div className="admin-light relative min-h-screen bg-paper text-bg flex flex-col">
      <img src={bgImage} className="fixed inset-0 w-full h-full object-cover opacity-[0.04] mix-blend-multiply pointer-events-none" alt="" />
      <Halos variant="section" />

      {/* Topbar — panel de cristal flotante */}
      <header className="relative z-10 m-3 mb-0 glass-light rounded-[24px] h-16 flex items-center px-6 gap-4 shrink-0 sticky top-3">
        <Link to="/" className="flex items-center gap-2.5 mr-auto group">
          <span className="grid place-items-center w-10 h-10 rounded-2xl bg-bg shadow-card">
            <img src="/logo.png" alt="Casa del Rey" className="w-8 h-8 object-contain" />
          </span>
          <div className="hidden sm:block">
            <p className="text-15 font-extrabold tracking-tightish text-bg leading-tight">Casa del Rey</p>
            <p className="text-10 font-extrabold uppercase tracking-widest text-bg/55 mt-0.5">Voluntario</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-14 text-bg font-bold leading-tight">{user?.name}</p>
            <p className="text-12 text-bg/45">{user?.email}</p>
          </div>
          <span className="grid place-items-center w-9 h-9 rounded-full bg-bg text-white text-13 font-extrabold shadow-card">
            {initial}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-13 font-semibold text-bg/60 hover:text-rose hover:bg-rose/8 transition-colors"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
