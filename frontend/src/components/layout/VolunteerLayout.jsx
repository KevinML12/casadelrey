import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function VolunteerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Hasta pronto');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-surf flex flex-col">

      {/* Topbar */}
      <header className="h-16 border-b border-outline-var bg-surf flex items-center px-6 gap-4 shrink-0 sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-2.5 mr-auto">
          <img src="/logo.png" alt="Casa del Rey" className="h-8 w-auto object-contain" />
          <span className="text-title-s text-on-surf font-bold hidden sm:block">Casa del Rey</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-label-l text-on-surf font-semibold leading-tight">{user?.name}</p>
            <p className="text-label-s text-on-surf-var">Voluntario</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-pri-con flex items-center justify-center">
            <span className="ms text-on-pri-con" style={{ fontSize: 18 }}>person</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-label-m text-on-surf-var hover:text-on-surf hover:bg-surf-dim transition-colors"
            title="Cerrar sesión"
          >
            <span className="ms" style={{ fontSize: 18 }}>logout</span>
            <span className="hidden sm:block">Salir</span>
          </button>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
