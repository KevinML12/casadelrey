import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Splash from './components/ui/Splash';
import StarField from './components/three/StarField';

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

// Public shell — Liquid Glass sobre canvas navy.
// Lenis da scroll suave con inercia (se desactiva con prefers-reduced-motion).
export default function App() {
  const location = useLocation();

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

  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink">
      <Splash />
      <StarField />
      <Header />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
