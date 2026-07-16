import { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotificationCounts } from '../../hooks/useNotificationCounts';
import toast from 'react-hot-toast';
import { Icon, Halos } from '../ui/Glass';
import useGlassSpecular from '../../hooks/useGlassSpecular';

// Nav agrupado por área — un listado plano de 20 ítems se leía como una
// bandeja de entrada sin orden; las secciones lo hacen escaneable.
const NAV_GROUPS = [
  {
    section: null, // Inicio, sin encabezado
    items: [
      { to: '/admin', icon: 'dashboard', label: 'Dashboard', exact: true },
    ],
  },
  {
    section: 'Sitio web',
    items: [
      { to: '/admin/hero',        icon: 'view_carousel', label: 'Hero' },
      { to: '/admin/site-photos', icon: 'photo_camera',  label: 'Fotos del sitio' },
      { to: '/admin/settings',    icon: 'settings',      label: 'Configuración' },
    ],
  },
  {
    section: 'Contenido',
    items: [
      { to: '/admin/blog',          icon: 'article',        label: 'Blog' },
      { to: '/admin/events',        icon: 'calendar_month', label: 'Eventos' },
      { to: '/admin/gallery',       icon: 'photo_library',  label: 'Galería' },
      { to: '/admin/social',        icon: 'share',          label: 'Redes' },
      { to: '/admin/faqs',          icon: 'help_center',    label: 'FAQs' },
      { to: '/admin/announcements', icon: 'campaign',       label: 'Anuncios' },
    ],
  },
  {
    section: 'Comunidad',
    items: [
      { to: '/admin/users',         icon: 'manage_accounts',    label: 'Usuarios' },
      { to: '/admin/leaders',       icon: 'badge',              label: 'Líderes' },
      { to: '/admin/volunteers',    icon: 'group_add',          label: 'Voluntarios',  badge: 'pending_volunteers' },
      { to: '/admin/connect-cards', icon: 'contact_page',       label: 'Conéctate',    badge: 'pending_connect_cards' },
      { to: '/admin/petitions',     icon: 'volunteer_activism', label: 'Peticiones',   badge: 'unread_petitions' },
      { to: '/admin/cell-reports',  icon: 'groups',             label: 'Células',      badge: 'pending_reports' },
      { to: '/admin/boletas',       icon: 'person_add',         label: 'Nuevos' },
    ],
  },
  {
    section: 'Finanzas',
    items: [
      { to: '/admin/receipts', icon: 'receipt_long', label: 'Comprobantes', badge: 'pending_receipts' },
    ],
  },
  {
    section: 'Sistema',
    items: [
      { to: '/admin/activity-log', icon: 'history', label: 'Actividad' },
      { to: '/admin/profile',      icon: 'person',  label: 'Perfil' },
    ],
  },
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
    <div className="flex flex-col h-full liquid-glass rounded-[28px] overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <Link to="/admin" onClick={onClose} className="flex items-center gap-2.5 group">
          <span className="grid place-items-center w-10 h-10 rounded-2xl bg-celeste text-white shadow-pri">
            <Icon name="crown" className="w-5 h-5" stroke={2} />
          </span>
          <div className="min-w-0">
            <p className="text-[14.5px] font-extrabold tracking-tightish text-white leading-tight">Casa del Rey</p>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-celeste-hov mt-0.5">Panel Admin</p>
          </div>
        </Link>
      </div>

      {/* Nav agrupado */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.section || 'inicio'} className={gi > 0 ? 'mt-5' : ''}>
            {group.section && (
              <p className="px-3 mb-1.5 text-[10.5px] font-extrabold uppercase tracking-widest text-white/35">
                {group.section}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ to, icon, label, exact, badge }) => {
                const count = badge ? (notifCounts[badge] || 0) : 0;
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={exact}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13.5px] font-semibold tracking-tightish transition-all duration-300 ${
                        isActive
                          ? 'bg-white/12 text-white border border-white/15'
                          : 'text-white/55 hover:text-white hover:bg-white/6 border border-transparent'
                      }`
                    }
                  >
                    <Icon name={icon} className="w-[18px] h-[18px] shrink-0" stroke={1.8} />
                    <span className="flex-1">{label}</span>
                    {count > 0 && (
                      <span className="min-w-[20px] h-5 rounded-full bg-celeste text-white text-[10.5px] font-bold flex items-center justify-center px-1.5 shadow-pri">
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3 border-t border-white/10 space-y-0.5">
        <div className="px-3 py-2.5 flex items-center gap-3">
          <span className="grid place-items-center w-9 h-9 rounded-full bg-celeste text-white text-[13px] font-extrabold shadow-pri shrink-0">
            {(user?.name || user?.email || '?')[0].toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-white truncate">{user?.name || 'Usuario'}</p>
            <p className="text-[11.5px] text-white/45 truncate">{user?.email}</p>
          </div>
        </div>
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13.5px] font-semibold text-white/55 hover:text-white hover:bg-white/6 transition-colors"
        >
          <Icon name="public" className="w-[18px] h-[18px] shrink-0" stroke={1.8} />
          Ver sitio web
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13.5px] font-semibold text-white/55 hover:text-rose hover:bg-rose-soft/40 transition-colors"
        >
          <Icon name="logout" className="w-[18px] h-[18px] shrink-0" stroke={1.8} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  useGlassSpecular();

  return (
    <div className="relative flex h-screen bg-bg overflow-hidden text-ink">
      <Halos variant="section" />

      {/* Sidebar desktop — panel de cristal flotante */}
      <aside className="hidden md:flex w-72 shrink-0 flex-col p-3 relative z-10">
        <SidebarContent />
      </aside>

      {/* Content area */}
      <div className="flex flex-col flex-1 min-w-0 relative z-10">
        {/* Mobile topbar */}
        <div className="md:hidden h-14 border-b border-white/10 liquid-glass rounded-none flex items-center px-4 gap-3 shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-white/60 hover:text-white transition-colors"
            aria-label="Abrir menú"
          >
            <Icon name="menu" className="w-[22px] h-[22px]" stroke={1.8} />
          </button>
          <span className="text-[14.5px] text-white font-extrabold tracking-tightish">Panel Admin</span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-40 md:hidden animate-fade-in" onClick={() => setDrawerOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 z-50 md:hidden p-3 animate-slide-up">
            <div className="absolute top-6 right-6 z-10">
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Cerrar menú"
              >
                <Icon name="close" className="w-4 h-4" stroke={2} />
              </button>
            </div>
            <SidebarContent onClose={() => setDrawerOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}
