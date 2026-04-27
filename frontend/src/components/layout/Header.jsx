import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button, { IconButton } from '../ui/Button';

const NAV_LINKS = [
  { label: 'Conócenos',   to: '/about' },
  { label: 'Blog',        to: '/blog' },
  { label: 'Eventos',     to: '/events' },
  { label: 'Oración',     to: '/prayer' },
  { label: 'Voluntariado', to: '/volunteering' },
];

export default function Header() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate   = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [theme, setTheme]       = useState(() => document.documentElement.dataset.theme || 'light');
  const dropRef = useRef(null);

  // Sync tema con el atributo del HTML
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    setTheme(next);
  };

  // Cerrar dropdown al click fuera
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setDropOpen(false);
    navigate('/');
  };

  return (
    // M3 Top App Bar — Surface level 2 (tinted)
    <header className="surf-1 sticky top-0 z-40 border-b border-outline-var transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-4">

        {/* ── Leading: Logo ─────────────────────────────────────── */}
        <Link to="/" className="flex items-center shrink-0" onClick={() => setMenuOpen(false)}>
          {/* Contenedor navy fijo — logo siempre blanco en ambos temas */}
          <div className="rounded-lg px-2.5 py-1.5" style={{ background: '#0D1B5E' }}>
            <img
              src="/logo.png"
              alt="Casa del Rey"
              className="h-9 w-auto object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
        </Link>

        {/* ── Center: Nav links (desktop) ───────────────────────── */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ label, to }) => (
            <NavLink key={to} to={to}>
              {({ isActive }) => (
                <span
                  className={
                    'flex flex-col items-center gap-0.5 px-4 py-2 rounded-full ' +
                    'text-label-l cursor-pointer relative overflow-hidden ' +
                    'before:content-[""] before:absolute before:inset-0 before:bg-pri ' +
                    'before:opacity-0 before:transition-opacity before:duration-150 ' +
                    'hover:before:opacity-[.08] transition-colors duration-150 ' +
                    (isActive ? 'text-on-surf font-semibold' : 'text-on-surf-var')
                  }
                >
                  {label}
                  {/* M3 active indicator */}
                  {isActive && (
                    <span className="w-6 h-0.5 rounded-full bg-pri" />
                  )}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── Trailing: Actions (desktop) ───────────────────────── */}
        <div className="hidden md:flex items-center gap-2">

          {/* Dark/Light toggle — M3 Icon Button */}
          <IconButton onClick={toggleTheme} aria-label="Cambiar tema">
            <span className="ms" style={{ fontSize: 20 }}>
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </IconButton>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {(isAdmin || user?.role === 'leader') && (
                <Button
                  as="link"
                  to={isAdmin ? '/admin' : '/leader'}
                  variant="tonal"
                  size="sm"
                >
                  <span className="ms" style={{ fontSize: 16 }}>dashboard</span>
                  {isAdmin ? 'Admin' : 'Líderes'}
                </Button>
              )}

              {/* Avatar dropdown */}
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropOpen(p => !p)}
                  className={
                    'flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full ' +
                    'text-label-l text-on-surf-var cursor-pointer ' +
                    'relative overflow-hidden ' +
                    'before:content-[""] before:absolute before:inset-0 before:bg-on-surf ' +
                    'before:opacity-0 before:transition-opacity ' +
                    'hover:before:opacity-[.08] transition-colors'
                  }
                >
                  <div className="w-8 h-8 rounded-full bg-pri-con flex items-center justify-center shrink-0">
                    <span className="text-on-pri-con text-label-m font-bold">
                      {(user?.name || user?.email || '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="ms" style={{ fontSize: 16, transition: 'transform .2s', transform: dropOpen ? 'rotate(180deg)' : '' }}>
                    expand_more
                  </span>
                </button>

                {dropOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 surf-2 border border-outline-var rounded-xl shadow-elev-3 py-1 animate-fade-in z-50">
                    <div className="px-4 py-2 border-b border-outline-var">
                      <p className="text-title-s text-on-surf truncate">{user?.name || 'Usuario'}</p>
                      <p className="text-body-s text-on-surf-var truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-body-s text-on-surf-var hover:bg-on-surf/[.08] transition-colors"
                    >
                      <span className="ms" style={{ fontSize: 18 }}>person</span>
                      Mi perfil
                    </Link>
                    <div className="my-1 border-t border-outline-var" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-body-s text-err hover:bg-err/[.08] transition-colors"
                    >
                      <span className="ms" style={{ fontSize: 18 }}>logout</span>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button as="link" to="/login" variant="tonal" size="sm">
                Donaciones
              </Button>
              <Button as="link" to="/login" variant="filled" size="sm">
                <span className="ms" style={{ fontSize: 16 }}>login</span>
                Ingresar
              </Button>
            </div>
          )}
        </div>

        {/* ── Mobile: theme toggle + hamburger ──────────────────── */}
        <div className="flex md:hidden items-center gap-1">
          <IconButton onClick={toggleTheme}>
            <span className="ms" style={{ fontSize: 20 }}>
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </IconButton>
          <IconButton onClick={() => setMenuOpen(p => !p)} aria-label="Menú">
            <span className="ms" style={{ fontSize: 22 }}>
              {menuOpen ? 'close' : 'menu'}
            </span>
          </IconButton>
        </div>
      </div>

      {/* ── Mobile menu ─────────────────────────────────────────── */}
      {menuOpen && (
        <div className="md:hidden surf-2 border-t border-outline-var px-4 py-3 space-y-1 animate-slide-up">
          {NAV_LINKS.map(({ label, to }) => (
            <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}>
              {({ isActive }) => (
                <span className={
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-label-l ' +
                  (isActive ? 'bg-pri-con text-on-pri-con' : 'text-on-surf-var')
                }>
                  {label}
                </span>
              )}
            </NavLink>
          ))}
          <div className="pt-2 border-t border-outline-var mt-2 space-y-1">
            {isAuthenticated ? (
              <>
                {(isAdmin || user?.role === 'leader') && (
                  <Link
                    to={isAdmin ? '/admin' : '/leader'}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-label-l text-on-surf-var"
                  >
                    <span className="ms" style={{ fontSize: 18 }}>dashboard</span>
                    {isAdmin ? 'Admin' : 'Panel líder'}
                  </Link>
                )}
                <button
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-label-l text-err w-full text-left"
                >
                  <span className="ms" style={{ fontSize: 18 }}>logout</span>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-label-l text-pri font-semibold"
              >
                Ingresar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
