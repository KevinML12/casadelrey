import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Calendar, MessageSquare, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/admin',           icon: LayoutDashboard, label: 'Dashboard',  exact: true },
  { to: '/admin/blog',      icon: FileText,         label: 'Blog' },
  { to: '/admin/events',    icon: Calendar,          label: 'Eventos' },
  { to: '/admin/petitions', icon: MessageSquare,     label: 'Peticiones' },
  { to: '/admin/profile',   icon: User,              label: 'Perfil' },
];

function SidebarNav({ onClose }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Hasta pronto');
    navigate('/');
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
            <span className="text-gold font-black text-xs">CR</span>
          </div>
          <span className="font-black text-white text-sm">Casa del Rey</span>
        </div>
        <p className="text-white/40 text-xs mt-1">Panel admin</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs text-white/40 truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen bg-bg overflow-hidden">

      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-56 shrink-0 bg-navy flex-col">
        <SidebarNav />
      </aside>

      {/* Mobile: topbar + drawer */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile topbar */}
        <div className="md:hidden h-14 bg-navy border-b border-white/10 flex items-center px-4 gap-3 shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-white/70 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>
          <span className="font-bold text-white text-sm">Panel Admin</span>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-bg">
          <Outlet />
        </main>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setDrawerOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-56 bg-navy z-50 md:hidden animate-slide-up">
            <div className="flex justify-end p-3">
              <button onClick={() => setDrawerOpen(false)} className="text-white/60 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <SidebarNav onClose={() => setDrawerOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}
