import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Splash from './components/ui/Splash';
import StarField from './components/three/StarField';

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

  // Al cambiar de ruta, arrancar arriba
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

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
