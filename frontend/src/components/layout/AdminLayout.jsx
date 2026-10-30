import PhotoImage from '../ui/PhotoImage';
import { useId, useRef, useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotificationCounts } from '../../hooks/useNotificationCounts';
import { useApi } from '../../lib/feed';
import ModalWrapper from '../ui/ModalWrapper';

const NAV_GROUPS = [
  { section: null, items: [{ to: '/admin', label: 'Resumen', exact: true }] },
  { section: 'Sitio web', items: [
    { to: '/admin/hero', label: 'Portada' }, { to: '/admin/site-photos', label: 'Fotos del sitio' },
    { to: '/admin/settings', label: 'Configuración' },
  ] },
  { section: 'Contenido', items: [
    { to: '/admin/blog', label: 'Blog' }, { to: '/admin/events', label: 'Eventos' },
    { to: '/admin/gallery', label: 'Galería' }, { to: '/admin/social', label: 'Redes' },
    { to: '/admin/faqs', label: 'Preguntas frecuentes' }, { to: '/admin/announcements', label: 'Anuncios' },
  ] },
  { section: 'Comunidad', items: [
    { to: '/admin/cells', label: 'Células' }, { to: '/admin/cell-categories', label: 'Categorías de células' },
    { to: '/admin/leaders', label: 'Líderes' }, { to: '/admin/users', label: 'Usuarios' },
    { to: '/admin/volunteers', label: 'Voluntarios', badge: 'pending_volunteers' },
    { to: '/admin/volunteer-areas', label: 'Departamentos' },
    { to: '/admin/connect-cards', label: 'Conéctate', badge: 'pending_connect_cards' },
    { to: '/admin/petitions', label: 'Peticiones', badge: 'unread_petitions' },
    { to: '/admin/cell-reports', label: 'Reportes de célula', badge: 'pending_reports' },
    { to: '/admin/boletas', label: 'Nuevos' },
  ] },
  { section: 'Finanzas', items: [
    { to: '/admin/receipts', label: 'Comprobantes', badge: 'pending_receipts' },
    { to: '/admin/donations', label: 'Donaciones' }, { to: '/admin/donation-purposes', label: 'Destinos de donación' },
  ] },
  { section: 'Sistema', items: [
    { to: '/admin/emails', label: 'Correos' }, { to: '/admin/activity-log', label: 'Actividad' },
    { to: '/admin/profile', label: 'Perfil' },
  ] },
];
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function SidebarContent({ onClose, counts }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});
  const id = useId();
  const query = normalize(search.trim());
  const groups = NAV_GROUPS.map(group => ({ ...group, items: group.items.filter(item => !query || normalize(`${item.label} ${group.section || ''}`).includes(query)) })).filter(group => group.items.length);
  return <div className="glass-light flex h-full min-h-0 flex-col overflow-hidden rounded-[16px]">
    <Link to="/admin" onClick={onClose} className="focus-ring mx-4 mt-5 mb-4 flex items-center gap-3 rounded-lg">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-bg"><img src="/logo.png" alt="Casa del Rey" className="h-8 w-8 object-contain" /></span>
      <span><span className="block text-15 font-bold">Casa del Rey</span><span className="block text-12 text-bg/55">Administración</span></span>
    </Link>
    <div className="px-3 pb-3"><label htmlFor={`${id}-search`} className="sr-only">Buscar en el panel</label><input id={`${id}-search`} type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar sección…" className="input-light !min-h-11 !px-3 !py-2 text-13" /></div>
    <nav aria-label="Secciones de administración" className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" data-lenis-prevent>
      {groups.length === 0 && <p className="px-2 py-4 text-13 text-bg/60">No encontramos esa sección.</p>}
      {groups.map((group, index) => {
        const active = group.items.some(item => item.exact ? pathname === item.to : pathname.startsWith(item.to));
        const open = !group.section || !!query || (expanded[group.section] ?? active);
        const count = group.items.reduce((sum, item) => sum + (counts[item.badge] || 0), 0);
        return <div key={group.section || 'resumen'} className={index ? 'mt-2' : ''}>
          {group.section && <button type="button" aria-expanded={open} aria-controls={`${id}-${index}`} onClick={() => setExpanded(values => ({ ...values, [group.section]: !open }))} className="focus-ring flex min-h-11 w-full items-center justify-between gap-2 rounded-[8px] px-3 text-left text-12 font-bold text-bg/55 hover:bg-bg/5">
            <span>{group.section}{count > 0 && !open && <span className="ml-2 text-bg">{count}</span>}</span><span className="text-11 font-medium">{open ? 'Menos' : 'Ver'}</span>
          </button>}
          <div id={`${id}-${index}`} hidden={!open} className="space-y-1">
            {group.items.map(({ to, label, exact, badge }) => <NavLink key={to} to={to} end={exact} onClick={onClose} className={({ isActive }) => `focus-ring flex min-h-11 items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-13 font-semibold transition-colors duration-150 ${isActive ? 'bg-bg text-white' : 'text-bg/70 hover:bg-bg/5'}`}>
              <span>{label}</span>{counts[badge] > 0 && <span className="rounded-md bg-rose px-1.5 py-0.5 text-11 font-bold text-white">{counts[badge] > 99 ? '99+' : counts[badge]}</span>}
            </NavLink>)}
          </div>
        </div>;
      })}
    </nav>
    <div className="border-t border-bg/10 px-4 py-3">
      <p className="truncate text-13 font-semibold">{user?.name || user?.email || 'Administrador'}</p>
      <button type="button" onClick={() => { logout(); onClose?.(); navigate('/'); }} className="focus-ring -ml-2 mt-1 min-h-11 rounded-lg px-2 text-12 font-semibold text-bg/60 hover:text-bg">Cerrar sesión</button>
    </div>
  </div>;
}

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const settings = useApi('/settings') || {};
  const counts = useNotificationCounts();
  const { pathname } = useLocation();
  const content = useRef(null);
  const current = NAV_GROUPS.flatMap(group => group.items).find(item => item.exact ? item.to === pathname : pathname.startsWith(item.to));
  useEffect(() => { content.current?.scrollTo({ top: 0 }); }, [pathname]);
  return <div className="admin-light admin-shell relative flex h-[100dvh] overflow-hidden bg-paper text-bg">
    <PhotoImage src={settings.admin_bg || '/images/bg-admin.png'} sizes="100vw" className="pointer-events-none fixed inset-0 h-full w-full object-cover opacity-[0.025] blur-[8px] mix-blend-multiply" alt="" />
    <aside className="relative z-10 hidden w-64 shrink-0 flex-col p-3 lg:flex"><SidebarContent counts={counts} /></aside>
    <div className="relative z-10 flex min-w-0 flex-1 flex-col">
      <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-bg/10 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3"><button type="button" onClick={() => setDrawerOpen(true)} aria-expanded={drawerOpen} aria-haspopup="dialog" className="focus-ring min-h-11 rounded-[10px] border border-bg/15 bg-white/65 px-4 text-13 font-bold lg:hidden">Menú</button><p className="truncate text-14 font-semibold"><span className="hidden font-normal text-bg/50 sm:inline">Administración / </span>{current?.label || 'Panel'}</p></div>
        <Link to="/" target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex min-h-11 shrink-0 items-center rounded-[10px] px-3 text-13 font-bold text-bg/70 hover:bg-white/70">Ver sitio</Link>
      </header>
      <main ref={content} className="admin-content min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" data-lenis-prevent><Outlet /></main>
    </div>
    {drawerOpen && <ModalWrapper ariaLabel="Menú de administración" onClose={() => setDrawerOpen(false)}><div className="h-[65svh] min-h-[240px]"><SidebarContent counts={counts} onClose={() => setDrawerOpen(false)} /></div></ModalWrapper>}
  </div>;
}
