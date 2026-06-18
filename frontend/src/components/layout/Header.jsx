import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../ui/Glass';

const NAV_LINKS = [
  { label: 'Inicio',       to: '/' },
  { label: 'Ministerios',  to: '/about' },
  { label: 'Eventos',      to: '/events' },
  { label: 'Dar',          to: '/donate' },
];

export default function Header() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
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

  const handleLogout = () => { logout(); setDropOpen(false); navigate('/'); };

  return (
    <header className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-4 pointer-events-none">
      <nav
        className={`pointer-events-auto w-full max-w-6xl rounded-pill glass-nav glass-sheen transition-all duration-500 ease-spring ${
          scrolled ? 'shadow-card-lg' : 'shadow-whisper'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
      >
        <div className="flex items-center justify-between pl-4 pr-2 py-2">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group rounded-pill pl-1.5 pr-3 py-1">
            <span
              className="grid place-items-center w-10 h-10 rounded-md bg-white text-bg transition-transform duration-400"
              style={{ transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
            >
              <Icon name="crown" className="w-5 h-5" stroke={2} />
            </span>
            <span className="text-[15px] font-extrabold tracking-tightish text-white">Casa del Rey</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(n => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'}>
                {({ isActive }) => (
                  <span
                    className={`px-4 py-2 rounded-pill text-[14px] font-semibold cursor-pointer transition-all duration-300 ${
                      isActive
                        ? 'bg-white text-bg shadow-whisper'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {n.label}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <div className="relative hidden sm:block" ref={dropRef}>
                <button
                  onClick={() => setDropOpen(p => !p)}
                  className="flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-pill text-[13px] text-ink hover:bg-bg-soft transition-all duration-300 focus-ring"
                >
                  <span className="grid place-items-center w-7 h-7 rounded-full bg-white/20 text-white text-[12px] font-extrabold shadow-pri">
                    {(user?.name || user?.email || '?')[0].toUpperCase()}
                  </span>
                  <span className="font-semibold text-white">{(user?.name || user?.email || 'Cuenta').split(' ')[0]}</span>
                </button>

                {dropOpen && (
                  <div
                    className="absolute right-0 top-full mt-3 w-60 liquid-glass rounded-[24px] p-2 z-50 animate-rise"
                    style={{ animationDuration: '300ms' }}
                  >
                    <div className="px-3 py-2.5 border-b border-white/10 mb-1">
                      <p className="text-[13px] font-bold text-white truncate">{user?.name || 'Usuario'}</p>
                      <p className="text-[12px] text-white/60 truncate">{user?.email}</p>
                    </div>
                    {(isAdmin || user?.role === 'leader') && (
                      <Link
                        to={isAdmin ? '/admin' : '/leader'}
                        onClick={() => setDropOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[13.5px] font-medium text-white hover:bg-white/10 transition-colors"
                      >
                        <Icon name="spark" className="w-4 h-4 text-white" />
                        {isAdmin ? 'Panel Admin' : 'Panel Líder'}
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[13.5px] font-medium text-white hover:bg-white/10 transition-colors"
                    >
                      <Icon name="user" className="w-4 h-4 text-white" />
                      Mi perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[13.5px] font-medium text-rose hover:bg-rose-soft transition-colors"
                    >
                      <Icon name="close" className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            )}

            <Link
              to="/donate"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full liquid-glass text-white text-[14px] font-bold btn-spring focus-ring"
            >
              {isAuthenticated ? 'Dar' : 'Planifica tu visita'}
              <Icon name="arrow" className="w-4 h-4" stroke={2} />
            </Link>

            <button
              onClick={() => setMenuOpen(o => !o)}
              className="md:hidden grid place-items-center w-10 h-10 rounded-pill bg-white/5 text-white hover:bg-white/10 transition-colors focus-ring"
              aria-label="Menú"
            >
              <Icon name={menuOpen ? 'close' : 'menu'} />
            </button>
          </div>
        </div>

        {/* Mobile sheet */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-500 ease-spring ${
            menuOpen ? 'max-h-[520px] opacity-100' : 'max-h-0 opacity-0'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
        >
          <div className="px-2 pb-2 pt-1 flex flex-col gap-1">
            {NAV_LINKS.map(n => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'} onClick={() => setMenuOpen(false)}>
                {({ isActive }) => (
                  <span className={`block px-4 py-3 rounded-md text-[15px] font-semibold transition-colors ${
                    isActive ? 'bg-ink text-white' : 'text-ink hover:bg-bg-soft'
                  }`}>
                    {n.label}
                  </span>
                )}
              </NavLink>
            ))}

            <div className="pt-2 mt-1 border-t border-ink-soft flex flex-col gap-1">
              {isAuthenticated && (
                <>
                  {(isAdmin || user?.role === 'leader') && (
                    <Link
                      to={isAdmin ? '/admin' : '/leader'}
                      onClick={() => setMenuOpen(false)}
                      className="px-4 py-2.5 rounded-md text-[14px] font-medium text-white hover:bg-white/10 transition-colors"
                    >
                      {isAdmin ? 'Panel Admin' : 'Panel Líder'}
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="px-4 py-2.5 rounded-md text-[14px] font-medium text-white hover:bg-white/10 transition-colors"
                  >
                    Mi perfil
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setMenuOpen(false); }}
                    className="text-left px-4 py-2.5 rounded-md text-[14px] font-medium text-rose hover:bg-rose-soft transition-colors"
                  >
                    Cerrar sesión
                  </button>
                </>
              )}
                <Link
                  to="/donate"
                  onClick={() => setMenuOpen(false)}
                  className="mt-1 flex items-center justify-center gap-2 px-5 py-3 rounded-pill bg-white text-bg text-[14.5px] font-bold shadow-pri btn-spring hover:bg-white/90"
                >
                  {isAuthenticated ? 'Donar' : 'Planifica tu visita'}
                  <Icon name="arrow" className="w-4 h-4" stroke={2} />
                </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
