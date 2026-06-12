import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Icon } from '../ui/Glass';

export default function VolunteerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Hasta pronto');
    navigate('/');
  };

  const initial = (user?.name || user?.email || '?')[0].toUpperCase();

  return (
    <div className="min-h-screen bg-bg-tint text-ink flex flex-col">
      {/* Topbar — glass squircle bar */}
      <header className="h-16 border-b border-ink-soft bg-bg flex items-center px-6 gap-4 shrink-0 sticky top-0 z-30 shadow-whisper">
        <Link to="/" className="flex items-center gap-2.5 mr-auto group">
          <span className="grid place-items-center w-10 h-10 rounded-md bg-celeste text-white shadow-pri">
            <Icon name="crown" className="w-5 h-5" stroke={2} />
          </span>
          <div className="hidden sm:block">
            <p className="text-[14.5px] font-extrabold tracking-tightish text-ink leading-tight">Casa del Rey</p>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-celeste mt-0.5">Voluntario</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[13.5px] text-ink font-bold leading-tight">{user?.name}</p>
            <p className="text-[11.5px] text-ink-2">{user?.email}</p>
          </div>
          <span className="grid place-items-center w-9 h-9 rounded-full bg-celeste text-white text-[13px] font-extrabold shadow-pri">
            {initial}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-semibold text-ink-2 hover:text-rose hover:bg-rose-soft transition-colors"
            title="Cerrar sesión"
          >
            <span className="ms" style={{ fontSize: 18 }}>logout</span>
            <span className="hidden sm:block">Salir</span>
          </button>
        </div>
      </header>

      <main className="flex-1 bg-bg-tint">
        <Outlet />
      </main>
    </div>
  );
}
