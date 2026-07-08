import { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotificationCounts } from '../../hooks/useNotificationCounts';
import toast from 'react-hot-toast';
import { Icon } from '../ui/Glass';

const NAV = [
  { to: '/admin',                  icon: 'dashboard',          label: 'Dashboard',     exact: true },
  { to: '/admin/hero',             icon: 'view_carousel',      label: 'Hero' },
  { to: '/admin/site-photos',      icon: 'photo_camera',       label: 'Fotos del sitio' },
  { to: '/admin/users',            icon: 'manage_accounts',    label: 'Usuarios' },
  { to: '/admin/blog',             icon: 'article',            label: 'Blog' },
  { to: '/admin/events',           icon: 'calendar_month',     label: 'Eventos' },
  { to: '/admin/faqs',             icon: 'help_center',        label: 'FAQs' },
  { to: '/admin/announcements',    icon: 'campaign',           label: 'Anuncios' },
  { to: '/admin/petitions',        icon: 'volunteer_activism', label: 'Peticiones',    badge: 'unread_petitions' },
  { to: '/admin/volunteers',       icon: 'group_add',          label: 'Voluntarios',   badge: 'pending_volunteers' },
  { to: '/admin/cell-reports',     icon: 'groups',             label: 'Células',       badge: 'pending_reports' },
  { to: '/admin/boletas',          icon: 'person_add',         label: 'Nuevos' },
  { to: '/admin/receipts',         icon: 'receipt_long',       label: 'Comprobantes', badge: 'pending_receipts' },
  { to: '/admin/gallery',          icon: 'photo_library',      label: 'Galería' },
  { to: '/admin/social',           icon: 'share',              label: 'Redes' },
  { to: '/admin/activity-log',     icon: 'history',            label: 'Actividad' },
  { to: '/admin/profile',          icon: 'person',             label: 'Perfil' },
];

function SidebarContent({ onClose }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const notifCounts = useNotificationCounts();

  const handleLogout = () => {
    logout();
    toast.success('Hasta pronto');
    navigate('/');
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full bg-bg border-r border-ink-soft">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-ink-soft">
        <Link to="/admin" onClick={onClose} className="flex items-center gap-2.5 group">
          <span className="grid place-items-center w-10 h-10 rounded-md bg-celeste text-white shadow-pri">
            <Icon name="crown" className="w-5 h-5" stroke={2} />
          </span>
          <div className="min-w-0">
            <p className="text-[14.5px] font-extrabold tracking-tightish text-ink leading-tight">Casa del Rey</p>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-celeste mt-0.5">Panel Admin</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon, label, exact, badge }) => {
          const count = badge ? (notifCounts[badge] || 0) : 0;
          return (
            <NavLink
              key={to}
              to={to}
              end={exact}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-[13.5px] font-semibold tracking-tightish transition-all duration-300 ${
                  isActive
                    ? 'bg-ink text-white shadow-whisper'
                    : 'text-ink-2 hover:text-ink hover:bg-bg-soft'
                }`
              }
            >
              <span className="ms shrink-0" style={{ fontSize: 18 }}>{icon}</span>
              <span className="flex-1">{label}</span>
              {count > 0 && (
                <span className="min-w-[20px] h-5 rounded-full bg-celeste text-white text-[10.5px] font-bold flex items-center justify-center px-1.5 shadow-pri">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3 border-t border-ink-soft space-y-0.5">
        <div className="px-3 py-2.5 flex items-center gap-3">
          <span className="grid place-items-center w-9 h-9 rounded-full bg-celeste text-white text-[13px] font-extrabold shadow-pri shrink-0">
            {(user?.name || user?.email || '?')[0].toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-ink truncate">{user?.name || 'Usuario'}</p>
            <p className="text-[11.5px] text-ink-2 truncate">{user?.email}</p>
          </div>
        </div>
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-[13.5px] font-semibold text-ink-2 hover:text-ink hover:bg-bg-soft transition-colors"
        >
          <span className="ms shrink-0" style={{ fontSize: 18 }}>public</span>
          Ver sitio web
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[13.5px] font-semibold text-ink-2 hover:text-rose hover:bg-rose-soft transition-colors"
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
    <div className="flex h-screen bg-bg-tint overflow-hidden text-ink">

      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col">
        <SidebarContent />
      </aside>

      {/* Content area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile topbar */}
        <div className="md:hidden h-14 border-b border-ink-soft flex items-center px-4 gap-3 shrink-0 bg-bg">
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-ink-2 hover:text-ink transition-colors"
            aria-label="Abrir menú"
          >
            <span className="ms" style={{ fontSize: 22 }}>menu</span>
          </button>
          <span className="text-[14.5px] text-ink font-extrabold tracking-tightish">Panel Admin</span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-bg-tint">
          <Outlet />
        </main>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-ink/40 backdrop-blur-md z-40 md:hidden animate-fade-in" onClick={() => setDrawerOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 z-50 md:hidden animate-slide-up">
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-bg-soft text-ink-2 hover:text-ink flex items-center justify-center transition-colors"
                aria-label="Cerrar menú"
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
