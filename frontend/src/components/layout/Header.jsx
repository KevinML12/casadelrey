import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../ui/Glass';

// Espeja las secciones reales del sitio (mismo orden que el Footer).
// "Dar" no va aquí: es el CTA de la derecha cuando hay sesión.
const NAV_LINKS = [
  { label: 'Inicio',       to: '/' },
  { label: 'Nosotros',     to: '/about' },
  { label: 'Células',      to: '/celulas' },
  { label: 'Voluntariado', to: '/volunteering' },
  { label: 'Eventos',      to: '/events' },
  { label: 'Blog',         to: '/blog' },
  { label: 'Galería',      to: '/gallery' },
];

export default function Header() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const dropRef = useRef(null);

  // Alto del menu movil en PIXELES reales via window.innerHeight, no vh:
  // 100vh tiene un bug de plataforma conocido en Safari movil real (no
  // descuenta la barra de direcciones), asi que el sheet podia quedar
  // mas alto que el viewport visible.
  const [viewportH, setViewportH] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 800));
  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // El nav se esconde al bajar y reaparece al subir (con resorte)
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    setHidden(y > prev && y > 350 && !menuOpen);
  });

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const handleLogout = () => { logout(); setDropOpen(false); navigate('/'); };

  // CTA principal = "Conéctate" (tarjeta de conexión real, /conectate):
  // la acción de primer contacto de un visitante nuevo. Reemplazó a
  // "Planifica tu visita", que sólo hacía scroll a la dirección y se
  // sentía genérica. "Dar" (donaciones) es un link visible aparte.
  return (
    <motion.header
      animate={{ y: hidden ? '-130%' : '0%' }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-4 pointer-events-none"
    >
      <nav
        className={`pointer-events-auto w-full max-w-6xl glass-nav transition-all duration-500 ease-spring ${
          menuOpen ? 'rounded-[22px]' : 'rounded-pill'
        } ${scrolled ? 'glass-nav--scrolled shadow-card-lg' : 'shadow-whisper'}`}
      >
        <div className="flex items-center justify-between pl-4 pr-2 py-2">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group rounded-pill pl-1.5 pr-3 py-1">
            <span className="grid place-items-center w-10 h-10 rounded-md bg-bg transition-transform duration-400 ease-spring group-hover:scale-105">
              <img src="/logo.png" alt="Casa del Rey" className="w-8 h-8 object-contain" />
            </span>
            <span className="text-[15px] font-extrabold tracking-tightish text-bg">Casa del Rey</span>
          </Link>

          {/* Desktop nav links — solo desde xl (1280px). Con 7 links (se
              agregó Voluntariado) + avatar + Dar + Conéctate, medido en
              vivo: a 1024px (lg) el hueco entre los links y las acciones
              de la derecha era 0px, sin margen — cualquier nombre de
              usuario un poco más largo lo desbordaba. Subido a xl para
              tener aire real; 1024-1280 usa el menú hamburguesa. */}
          <div className="hidden xl:flex items-center gap-0.5">
            {NAV_LINKS.map(n => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'}>
                {({ isActive }) => (
                  <span
                    className={`px-3.5 py-2 rounded-pill text-[13.5px] font-semibold cursor-pointer whitespace-nowrap transition-all duration-300 ${
                      isActive
                        ? 'bg-white text-bg shadow-card'
                        : 'text-bg/70 hover:text-bg hover:bg-bg/5'
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
                  className="flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-pill text-[13px] hover:bg-bg/5 transition-all duration-300 focus-ring"
                >
                  <span className="grid place-items-center w-7 h-7 rounded-full bg-bg text-white text-[12px] font-extrabold">
                    {(user?.name || user?.email || '?')[0].toUpperCase()}
                  </span>
                  <span className="font-semibold text-bg">{(user?.name || user?.email || 'Cuenta').split(' ')[0]}</span>
                </button>

                {dropOpen && (
                  <div
                    className="absolute right-0 top-full mt-3 w-60 glass-light rounded-[20px] p-2 z-50 animate-rise"
                    style={{ animationDuration: '300ms' }}
                  >
                    <div className="px-3 py-2.5 border-b border-bg/10 mb-1">
                      <p className="text-[13px] font-bold text-bg truncate">{user?.name || 'Usuario'}</p>
                      <p className="text-[12px] text-bg/60 truncate">{user?.email}</p>
                    </div>
                    {(isAdmin || user?.role === 'leader') && (
                      <Link
                        to={isAdmin ? '/admin' : '/leader'}
                        onClick={() => setDropOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[13.5px] font-medium text-bg hover:bg-bg/5 transition-colors"
                      >
                        <Icon name="spark" className="w-4 h-4 text-bg" />
                        {isAdmin ? 'Panel Admin' : 'Panel Líder'}
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[13.5px] font-medium text-bg hover:bg-bg/5 transition-colors"
                    >
                      <Icon name="user" className="w-4 h-4 text-bg" />
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

            {/* Sin sesión: entrada visible a /login (antes no existía —
                imposible llegar al panel admin sin teclear la URL) */}
            {!isAuthenticated && (
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-bg/70 hover:text-bg hover:bg-bg/5 text-[14px] font-bold transition-all duration-300 focus-ring"
              >
                <Icon name="user" className="w-4 h-4" />
                Ingresar
              </Link>
            )}

            <Link
              to="/donate"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-bg/70 hover:text-bg hover:bg-bg/5 text-[14px] font-bold transition-all duration-300 focus-ring"
            >
              <Icon name="heart" className="w-4 h-4" />
              Dar
            </Link>

            <Link
              to="/conectate"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-bg text-white text-[14px] font-bold btn-spring focus-ring hover:bg-bg-soft"
            >
              Conéctate
              <Icon name="arrow" className="w-4 h-4" stroke={2} />
            </Link>

            <button
              onClick={() => setMenuOpen(o => !o)}
              className="xl:hidden grid place-items-center w-10 h-10 rounded-pill bg-bg/5 text-bg hover:bg-bg/10 transition-colors focus-ring"
              aria-label="Menú"
            >
              <Icon name={menuOpen ? 'close' : 'menu'} />
            </button>
          </div>
        </div>

        {/* Mobile sheet — cubre tablet y laptop angosto (< 1280px). Antes
            max-h-[520px] fijo: con sesión iniciada se agregan 3 links más
            (Panel Admin/Líder, Mi perfil, Cerrar sesión) y el contenido
            real (613px medido con esos links) superaba el tope -- el
            final del menú (Conéctate, a veces también Dar) quedaba
            cortado e invisible sin que hubiera manera de hacer scroll.
            Ahora la altura es relativa al viewport (nunca más grande que
            la pantalla) con scroll interno si aun asi no entra todo. */}
        <div
          className={`xl:hidden transition-all duration-500 ease-spring ${
            menuOpen ? 'opacity-100 overflow-y-auto' : 'opacity-0 overflow-hidden'
          }`}
          // max-height en pixeles reales (viewportH, de window.innerHeight)
          // en vez de vh en CSS -- ver nota arriba sobre el bug de 100vh en
          // Safari movil. Los dos estados via estilo inline (no mezclado
          // con clase Tailwind) para que la transicion anime limpio entre
          // dos valores numericos reales.
          style={{ maxHeight: menuOpen ? `${viewportH - 96}px` : '0px' }}
        >
          <div className="px-2 pb-2 pt-1 flex flex-col gap-1">
            {NAV_LINKS.map(n => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'} onClick={() => setMenuOpen(false)}>
                {({ isActive }) => (
                  <span className={`block px-4 py-3 rounded-md text-[15px] font-semibold transition-colors ${
                    isActive ? 'bg-bg text-white' : 'text-bg hover:bg-bg/5'
                  }`}>
                    {n.label}
                  </span>
                )}
              </NavLink>
            ))}

            <div className="pt-2 mt-1 border-t border-bg/10 flex flex-col gap-1">
              {!isAuthenticated && (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 rounded-md text-[14px] font-medium text-bg hover:bg-bg/5 transition-colors"
                >
                  Ingresar
                </Link>
              )}
              {isAuthenticated && (
                <>
                  {(isAdmin || user?.role === 'leader') && (
                    <Link
                      to={isAdmin ? '/admin' : '/leader'}
                      onClick={() => setMenuOpen(false)}
                      className="px-4 py-2.5 rounded-md text-[14px] font-medium text-bg hover:bg-bg/5 transition-colors"
                    >
                      {isAdmin ? 'Panel Admin' : 'Panel Líder'}
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="px-4 py-2.5 rounded-md text-[14px] font-medium text-bg hover:bg-bg/5 transition-colors"
                  >
                    Mi perfil
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setMenuOpen(false); }}
                    className="text-left px-4 py-2.5 rounded-md text-[14px] font-medium text-rose hover:bg-rose/10 transition-colors"
                  >
                    Cerrar sesión
                  </button>
                </>
              )}
                <Link
                  to="/donate"
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-pill text-bg text-[14.5px] font-bold hover:bg-bg/5 transition-colors"
                >
                  <Icon name="heart" className="w-4 h-4" />
                  Dar
                </Link>
                <Link
                  to="/conectate"
                  onClick={() => setMenuOpen(false)}
                  className="mt-1 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-pill bg-bg text-white text-[14.5px] font-bold btn-spring hover:bg-bg-soft"
                >
                  Conéctate
                  <Icon name="arrow" className="w-4 h-4" stroke={2} />
                </Link>
            </div>
          </div>
        </div>
      </nav>
    </motion.header>
  );
}
