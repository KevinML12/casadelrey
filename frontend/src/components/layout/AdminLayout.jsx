import { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/admin',              icon: 'dashboard',      label: 'Dashboard',   exact: true },
  { to: '/admin/blog',         icon: 'article',        label: 'Blog' },
  { to: '/admin/events',       icon: 'calendar_month', label: 'Eventos' },
  { to: '/admin/petitions',    icon: 'volunteer_activism', label: 'Peticiones' },
  { to: '/admin/volunteers',   icon: 'group_add',      label: 'Voluntarios' },
  { to: '/admin/cell-reports', icon: 'groups',         label: 'Células' },
  { to: '/admin/boletas',      icon: 'person_add',     label: 'Nuevos' },
  { to: '/admin/social',       icon: 'share',          label: 'Redes' },
  { to: '/admin/profile',      icon: 'person',         label: 'Perfil' },
];

function SidebarContent({ onClose }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Hasta pronto');
    navigate('/');
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#0D1B5E' }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,.1)' }}>
        <div className="flex items-center gap-3">
          <div className="rounded-lg px-2 py-1.5" style={{ background: 'rgba(255,255,255,.08)' }}>
            <img src="/logo.png" alt="Casa del Rey" className="h-7 w-auto object-contain"
              style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
          <div>
            <p className="text-title-s text-white font-bold leading-tight">Casa del Rey</p>
            <p className="text-label-s" style={{ color: 'rgba(255,255,255,.45)' }}>Panel Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-label-l font-medium transition-all duration-150 ${
                isActive
                  ? 'text-white'
                  : 'hover:text-white'
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? 'rgba(255,255,255,.12)' : 'transparent',
              color: isActive ? '#FFFFFF' : 'rgba(255,255,255,.55)',
            })}
          >
            <span className="ms shrink-0" style={{ fontSize: 18 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3 border-t space-y-0.5" style={{ borderColor: 'rgba(255,255,255,.1)' }}>
        <div className="px-3 py-2">
          <p className="text-label-l font-medium text-white truncate">{user?.name || user?.email}</p>
          <p className="text-label-s truncate" style={{ color: 'rgba(255,255,255,.4)' }}>{user?.email}</p>
        </div>
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-label-l font-medium transition-colors"
          style={{ color: 'rgba(255,255,255,.55)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.55)'}
        >
          <span className="ms shrink-0" style={{ fontSize: 18 }}>public</span>
          Ver sitio web
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-label-l font-medium transition-colors"
          style={{ color: 'rgba(255,255,255,.55)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#FFB4AB'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.55)'}
        >
          <span className="ms shrink-0" style={{ fontSize: 18 }}>logout</span>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen bg-surf overflow-hidden">

      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col">
        <SidebarContent />
      </aside>

      {/* Content area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile topbar */}
        <div className="md:hidden h-14 border-b border-outline-var flex items-center px-4 gap-3 shrink-0 surf-1">
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-on-surf-var hover:text-on-surf transition-colors"
          >
            <span className="ms" style={{ fontSize: 22 }}>menu</span>
          </button>
          <span className="text-title-s text-on-surf font-semibold">Panel Admin</span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-surf">
          <Outlet />
        </main>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setDrawerOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-60 z-50 md:hidden animate-slide-up">
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.7)' }}
              >
                <span className="ms" style={{ fontSize: 16 }}>close</span>
              </button>
            </div>
            <SidebarContent onClose={() => setDrawerOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}
