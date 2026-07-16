import { useEffect } from 'react';

// Rastrea el cursor/dedo y alimenta --spec-x/--spec-y en CUALQUIER
// .liquid-glass o .glass-light bajo el puntero — un solo listener
// delegado montado una vez por layout, en vez de envolver cada card
// individualmente (a diferencia del Tilt.jsx del sitio público, que
// hace tilt 3D por card: en un panel denso en datos/formularios la
// inclinación estorbaría, así que aquí solo viaja el brillo). Cubre
// TODAS las cards presentes y futuras de los 3 paneles sin wiring
// por página — basta con usar la clase .liquid-glass en cualquier
// componente nuevo para heredar el efecto automáticamente.
export default function useGlassSpecular() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let current = null;
    const clear = () => {
      if (current) current.style.setProperty('--spec-o', '0');
      current = null;
    };

    const move = (x, y, target) => {
      const el = target?.closest?.('.liquid-glass, .glass-light');
      if (el !== current) { clear(); current = el; }
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--spec-x', `${x - r.left}px`);
      el.style.setProperty('--spec-y', `${y - r.top}px`);
      // El :hover de CSS ya pone opacity:1 con mouse; en touch no hay
      // :hover real, así que el toque necesita forzarlo por JS.
      el.style.setProperty('--spec-o', '1');
    };

    const onPointerMove = (e) => move(e.clientX, e.clientY, e.target);
    const onTouchMove = (e) => {
      const t = e.touches[0];
      if (t) move(t.clientX, t.clientY, e.target);
    };

    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', clear);
    document.addEventListener('pointerleave', clear);

    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', clear);
      document.removeEventListener('pointerleave', clear);
      clear();
    };
  }, []);
}
