import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Icon, Halos } from '../ui/Glass';
import useGlassSpecular from '../../hooks/useGlassSpecular';

export default function VolunteerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  useGlassSpecular();

  const handleLogout = () => {
    logout();
    toast.success('Hasta pronto');
    navigate('/');
  };

  const initial = (user?.name || user?.email || '?')[0].toUpperCase();

  return (
    <div className="relative min-h-screen bg-bg text-ink flex flex-col">
      <Halos variant="section" />

      {/* Topbar — panel de cristal flotante */}
      <header className="relative z-10 m-3 mb-0 liquid-glass rounded-[24px] h-16 flex items-center px-6 gap-4 shrink-0 sticky top-3">
        <Link to="/" className="flex items-center gap-2.5 mr-auto group">
          <span className="grid place-items-center w-10 h-10 rounded-2xl bg-celeste shadow-pri">
            <img src="/logo.png" alt="Casa del Rey" className="w-8 h-8 object-contain" />
          </span>
          <div className="hidden sm:block">
            <p className="text-[14.5px] font-extrabold tracking-tightish text-white leading-tight">Casa del Rey</p>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-celeste-hov mt-0.5">Voluntario</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[13.5px] text-white font-bold leading-tight">{user?.name}</p>
            <p className="text-[11.5px] text-white/45">{user?.email}</p>
          </div>
          <span className="grid place-items-center w-9 h-9 rounded-full bg-celeste text-white text-[13px] font-extrabold shadow-pri">
            {initial}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[13px] font-semibold text-white/55 hover:text-rose hover:bg-rose-soft/40 transition-colors"
            title="Cerrar sesión"
          >
            <Icon name="logout" className="w-[18px] h-[18px]" stroke={1.8} />
            <span className="hidden sm:block">Salir</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
