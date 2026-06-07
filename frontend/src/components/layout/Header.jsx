import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { label: 'Inicio',       to: '/' },
  { label: 'Nosotros',     to: '/about' },
  { label: 'Eventos',      to: '/events' },
  { label: 'Blog',         to: '/blog' },
  { label: 'Voluntariado', to: '/volunteering' },
  { label: 'Donar',        to: '/donate' },
];

export default function Header() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || 'light'
  );
  const dropRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    setTheme(next);
  };

  const handleLogout = () => { logout(); setDropOpen(false); navigate('/'); };

  // Sin scroll → opaco (no sangra el contenido oscuro del hero a través del blur)
  // Con scroll → glass con blur (ya hay contenido claro debajo)
  const navBg = scrolled
    ? 'bg-[var(--surf-high)]/80 backdrop-blur-xl border-[var(--outline-var)] shadow-sm'
    : 'bg-[var(--surf-high)] border-[var(--outline-var)]';
  const linkColor  = 'text-[var(--on-surf-var)] hover:text-[var(--on-surf)]';
  const linkActiveCl = 'text-[var(--on-surf)] font-semibold';
  const iconColor  = 'text-[var(--on-surf-var)] hover:text-[var(--on-surf)] hover:bg-[var(--surf-low)]';

  return (
    <header className={`sticky top-0 z-40 border-b transition-all duration-300 ${navBg}`}>
      <div className="max-w-[1440px] mx-auto px-6 md:px-16 h-[72px] md:h-[88px] flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="shrink-0">
          <img
            src="/logo.png"
            alt="Casa del Rey"
            className="h-8 md:h-9 w-auto object-contain"
          />
        </Link>

        {/* Nav links — desktop */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {NAV_LINKS.map(({ label, to }) => (
            <NavLink key={to} to={to} end={to === '/'}>
              {({ isActive }) => (
                <span className={`px-4 py-2 rounded-full text-[14px] cursor-pointer transition-colors duration-150 block
                  ${isActive ? linkActiveCl : linkColor}`}>
                  {label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right actions — desktop */}
        <div className="hidden lg:flex items-center gap-1">

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors ${iconColor}`}
            aria-label="Cambiar tema"
          >
            <span className="ms" style={{ fontSize: 20 }}>
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 ml-1">
              {(isAdmin || user?.role === 'leader') && (
                <Link
                  to={isAdmin ? '/admin' : '/leader'}
                  className="px-4 py-1.5 rounded-full text-[13px] font-medium border border-[var(--outline-var)] text-[var(--on-surf-var)] hover:bg-[var(--surf-low)] transition-colors"
                >
                  {isAdmin ? 'Admin' : 'Líderes'}
                </Link>
              )}

              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropOpen(p => !p)}
                  className="flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full text-[13px] text-[var(--on-surf-var)] hover:bg-[var(--surf-low)] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[var(--pri)] flex items-center justify-center shrink-0">
                    <span className="text-[var(--on-pri)] text-[11px] font-bold">
                      {(user?.name || user?.email || '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="ms" style={{ fontSize: 16, transition: 'transform .2s', transform: dropOpen ? 'rotate(180deg)' : '' }}>
                    expand_more
                  </span>
                </button>

                {dropOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-[var(--surf-high)] border border-[var(--outline-var)] rounded-2xl shadow-xl py-2 z-50">
                    <div className="px-4 py-2.5 border-b border-[var(--outline-var)]">
                      <p className="text-[13px] font-semibold text-[var(--on-surf)] truncate">{user?.name || 'Usuario'}</p>
                      <p className="text-[12px] text-[var(--on-surf-var)] truncate">{user?.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[var(--on-surf)] hover:bg-[var(--surf-low)] transition-colors">
                      <span className="ms" style={{ fontSize: 16 }}>person</span>
                      Mi perfil
                    </Link>
                    <div className="my-1 border-t border-[var(--outline-var)]" />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[var(--err)] hover:bg-[var(--err-con)] transition-colors">
                      <span className="ms" style={{ fontSize: 16 }}>logout</span>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-1">
              <Link to="/login"
                className="px-4 py-1.5 rounded-full text-[13px] font-medium text-[var(--on-surf-var)] hover:bg-[var(--surf-low)] transition-colors">
                Ingresar
              </Link>
              <Link to="/donate"
                className="px-5 py-1.5 rounded-full text-[13px] font-semibold bg-[var(--pri)] text-[var(--on-pri)] hover:bg-[var(--pri-press)] transition-colors">
                Donar
              </Link>
            </div>
          )}
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex lg:hidden items-center gap-1">
          <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${iconColor}`} aria-label="Tema">
            <span className="ms" style={{ fontSize: 20 }}>{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <button onClick={() => setMenuOpen(p => !p)} className={`p-2 rounded-full transition-colors ${iconColor}`} aria-label="Menú">
            <span className="ms" style={{ fontSize: 22 }}>{menuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-[var(--surf-high)] border-t border-[var(--outline-var)] px-4 py-3 space-y-1">
          {NAV_LINKS.map(({ label, to }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setMenuOpen(false)}>
              {({ isActive }) => (
                <span className={`flex items-center px-4 py-2.5 rounded-xl text-[14px] transition-colors
                  ${isActive
                    ? 'bg-[var(--pri-con)] text-[var(--on-pri-con)] font-semibold'
                    : 'text-[var(--on-surf-var)] hover:bg-[var(--surf-low)]'}`}>
                  {label}
                </span>
              )}
            </NavLink>
          ))}
          <div className="pt-2 mt-1 border-t border-[var(--outline-var)] space-y-1">
            {isAuthenticated ? (
              <>
                {(isAdmin || user?.role === 'leader') && (
                  <Link to={isAdmin ? '/admin' : '/leader'} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] text-[var(--on-surf-var)]">
                    <span className="ms" style={{ fontSize: 18 }}>dashboard</span>
                    {isAdmin ? 'Panel Admin' : 'Panel Líder'}
                  </Link>
                )}
                <button onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] text-[var(--err)] w-full">
                  <span className="ms" style={{ fontSize: 18 }}>logout</span>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="flex items-center px-4 py-2.5 rounded-xl text-[14px] font-semibold text-[var(--pri)]">
                Ingresar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
