import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, X, ChevronDown, LayoutDashboard, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import useDarkMode from '../../hooks/useDarkMode';

const NAV_LINKS = [
  { label: 'Conócenos',  to: '/about' },
  { label: 'Blog',       to: '/blog' },
  { label: 'Eventos',    to: '/events' },
  { label: 'Oración',    to: '/prayer' },
  { label: 'Células',    to: '/cells' },
  { label: 'Donaciones', to: '/donate' },
];

const activeCls = 'text-blue font-semibold';
const navLinkCls = ({ isActive }) =>
  `text-sm font-medium transition-colors hover:text-blue ${isActive ? activeCls : 'text-ink-2'}`;

export default function Header() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { isDark, toggle } = useDarkMode();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen]       = useState(false);
  const [dropOpen, setDropOpen]       = useState(false);
  const [scrolled, setScrolled]       = useState(false);
  const dropRef = useRef(null);

  // Detectar scroll para efecto de sombra
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setDropOpen(false);
    navigate('/');
  };

  return (
    <header
      style={{ backgroundColor: 'var(--bg)', borderBottomColor: 'var(--line)' }}
      className={`sticky top-0 z-40 border-b transition-all duration-200 ${scrolled ? 'shadow-sm' : ''}`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setMenuOpen(false)}>
          <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
            <span className="text-gold font-black text-sm leading-none">CR</span>
          </div>
          <span className="font-black text-ink tracking-tight text-base">Casa del Rey</span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(l => (
            <NavLink key={l.to} to={l.to} className={navLinkCls}>{l.label}</NavLink>
          ))}
        </nav>

        {/* Acciones desktop */}
        <div className="hidden md:flex items-center gap-2">
          {/* Dark toggle */}
          <button
            onClick={toggle}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-2 hover:bg-card-2 hover:text-ink transition-colors"
          >
            {isDark
              ? <Sun size={16} strokeWidth={2} />
              : <Moon size={16} strokeWidth={2} />
            }
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {/* Botón visible de panel admin */}
              {isAdmin && (
                <Link to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-navy text-gold hover:bg-navy-d transition-colors">
                  <LayoutDashboard size={13} /> Admin
                </Link>
              )}

              {/* Avatar + dropdown */}
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropOpen(p => !p)}
                  className="flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-lg text-sm font-medium text-ink-2 hover:bg-card-2 hover:text-ink transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-blue/10 flex items-center justify-center">
                    <span className="text-blue text-xs font-bold">
                      {(user?.name || user?.email || '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown size={14} className={`transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropOpen && (
                  <div style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)' }}
                    className="absolute right-0 top-full mt-2 w-48 border rounded-xl shadow-lg py-1 animate-fade-in z-50">
                    <div className="px-4 py-2 border-b border-line">
                      <p className="text-xs font-semibold text-ink truncate">{user?.name || 'Usuario'}</p>
                      <p className="text-xs text-ink-3 truncate">{user?.email}</p>
                    </div>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setDropOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-2 hover:bg-card-2 hover:text-ink transition-colors">
                        <LayoutDashboard size={14} /> Panel Admin
                      </Link>
                    )}
                    <Link to="/admin/profile" onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-2 hover:bg-card-2 hover:text-ink transition-colors">
                      <User size={14} /> Mi perfil
                    </Link>
                    <div className="my-1 border-t border-line" />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/5 transition-colors">
                      <LogOut size={14} /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link to="/login">
              <button className="px-4 py-2 rounded-lg text-sm font-semibold bg-navy text-white hover:bg-navy-d transition-colors">
                Ingresar
              </button>
            </Link>
          )}
        </div>

        {/* Mobile: toggle + hamburguesa */}
        <div className="flex md:hidden items-center gap-1">
          <button
            onClick={toggle}
            aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-2 hover:bg-card-2 transition-colors"
          >
            {isDark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
          </button>
          <button
            onClick={() => setMenuOpen(p => !p)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-2 hover:bg-card-2 transition-all"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ backgroundColor: 'var(--card)', borderTopColor: 'var(--line)' }} className="md:hidden border-t px-4 py-4 space-y-1 animate-slide-up">
          {NAV_LINKS.map(l => (
            <NavLink key={l.to} to={l.to} className={navLinkCls}
              onClick={() => setMenuOpen(false)}>
              <span className="block px-3 py-2.5">{l.label}</span>
            </NavLink>
          ))}
          <div className="pt-2 border-t border-line mt-2">
            {isAuthenticated ? (
              <>
                <Link to="/admin" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-ink-2 hover:text-ink">
                  <LayoutDashboard size={15} /> Dashboard
                </Link>
                <button onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-err w-full text-left">
                  <LogOut size={15} /> Cerrar sesión
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-semibold text-blue">
                Ingresar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
