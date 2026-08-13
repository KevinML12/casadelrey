import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Splash from './components/ui/Splash';
import { useApi } from './lib/feed';

// Título de pestaña por ruta (SEO + pestañas distinguibles). Rutas
// dinámicas (/blog/:slug) ponen título propio desde su componente;
// aquí gana el prefijo más largo que haga match.
const BASE_TITLE = 'Casa del Rey — Huehuetenango';
const ROUTE_TITLES = {
  '/about':        'Nosotros',
  '/celulas':      'Células',
  '/events':       'Eventos',
  '/blog':         'Blog',
  '/gallery':      'Galería',
  '/conectate':    'Conéctate',
  '/prayer':       'Oración',
  '/donate':       'Dar',
  '/volunteering': 'Voluntariado',
  '/comprobante':  'Comprobante',
  '/profile':      'Mi perfil',
  '/login':        'Iniciar sesión',
  '/register':     'Crear cuenta',
};

const ROUTE_BG_KEYS = {
  '/about':        'public_bg_nosotros',
  '/celulas':      'public_bg_celulas',
  '/events':       'public_bg_eventos',
  '/donate':       'public_bg_donaciones',
  '/volunteering': 'public_bg_voluntariado',
  '/blog':         'public_bg_blog',
  '/gallery':      'public_bg_galeria',
  '/prayer':       'public_bg_oracion',
  '/conectate':    'public_bg_conectate',
  '/login':        'public_bg_login',
  '/register':     'public_bg_registro',
  '/comprobante':  'public_bg_donaciones',
  '/profile':      'public_bg_home',
  '/':             'public_bg_home',
};

// Public shell — Liquid Glass sobre canvas navy.
// Lenis da scroll suave con inercia (se desactiva con prefers-reduced-motion).
//
// Sin 3D (ago-2026). Aquí vivía <StarField />, un campo de partículas
// three.js montado detrás de todas las páginas públicas, y el hero de Home
// tenía además un globo de puntos. Los dos se fueron a pedido del dueño
// ("quita lo 3d"), y los números le dan la razón: ambos estaban gateados a
// desktop ≥1024px con puntero fino, así que el tráfico móvil —que es casi
// todo el de una iglesia de Huehuetenango— nunca los vio, mientras que el
// bundle de react-three-fiber (888 KB) se descargaba igual. La sensación de
// profundidad que aportaban ahora la carga WindowStack, que apila las
// ventanas como cartas con puro transform/opacity y funciona en todos lados.
export default function App() {
  const location = useLocation();
  const settings = useApi('/settings') || {};

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    let raf = requestAnimationFrame(function loop(t) {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    });
    return () => { cancelAnimationFrame(raf); lenis.destroy(); };
  }, []);

  // Al cambiar de ruta, arrancar arriba + título de pestaña
  useEffect(() => {
    window.scrollTo(0, 0);
    const hit = Object.keys(ROUTE_TITLES)
      .filter(p => location.pathname === p || location.pathname.startsWith(p + '/'))
      .sort((a, b) => b.length - a.length)[0];
    document.title = hit ? `${ROUTE_TITLES[hit]} · Casa del Rey` : BASE_TITLE;
  }, [location.pathname]);

  // Encontrar el background según la ruta actual (Home es el fallback '/' por default)
  const bgHit = Object.keys(ROUTE_BG_KEYS)
    .filter(p => location.pathname === p || location.pathname.startsWith(p === '/' ? '@@' : p + '/'))
    .sort((a, b) => b.length - a.length)[0] || '/';
  
  const bgImage = settings[ROUTE_BG_KEYS[bgHit]];

  return (
    <div className="relative min-h-screen flex flex-col bg-bg text-ink overflow-hidden">
      {bgImage && (
        <>
          <img src={bgImage} className="fixed inset-0 w-full h-full object-cover opacity-35 pointer-events-none" alt="" />
          <div className="fixed inset-0 bg-bg/70 pointer-events-none" />
        </>
      )}
      <Splash />
      <Header />
      <main className="flex-1 w-full relative z-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
