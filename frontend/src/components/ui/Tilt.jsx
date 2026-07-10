// ============================================================
//  Tilt — la card se inclina en 3D siguiendo al cursor, con física
//  de resorte real (framer-motion), y de paso alimenta el brillo
//  especular (--spec-x/--spec-y) que usan .liquid-glass/.glass-light.
//  NO combinar con .card-spring: esa clase transiciona transform en
//  CSS y pelea con el resorte.
//
//  prop `glass` (cualquier valor truthy): la card recibe además
//  `.liquid-shine`, una franja de luz en CSS puro que barre la card
//  en loop lento — el efecto "líquido". Es CSS 100%, se ve igual en
//  escritorio y en móvil (antes esto montaba un canvas WebGL con
//  refracción real, pero se veía opaco/lavado y se descartó — ver
//  memoria "liquid glass puro"). El tilt-hover 3D sigue siendo solo
//  para punteros finos (no tiene sentido en touch).
// ============================================================
import { useMemo, useRef } from 'react';
import { motion, useSpring } from 'framer-motion';

// Sin mouse fino o con reduced-motion el tilt no existe (ni handlers)
const FINE =
  typeof window !== 'undefined' &&
  matchMedia('(pointer: fine)').matches &&
  !matchMedia('(prefers-reduced-motion: reduce)').matches;

const SPRING = { stiffness: 260, damping: 20, mass: 0.7 };

/**
 * @param {string} as         — componente a renderizar (p.ej. Link); default div
 * @param {number} max        — grados máximos de inclinación
 * @param {number} hoverScale — escala al hacer hover
 * @param {*}      glass      — truthy → agrega el brillo líquido `.liquid-shine`
 */
export default function Tilt({
  as,
  children,
  className = '',
  max = 6,
  hoverScale = 1.012,
  glass,
  style,
  ...props
}) {
  const Comp = useMemo(() => (as ? motion.create(as) : motion.div), [as]);
  const rx = useSpring(0, SPRING);
  const ry = useSpring(0, SPRING);
  const nodeRef = useRef(null);
  // Delay aleatorio (pero estable) por card: si varias tienen shine en
  // pantalla a la vez, que no brillen todas al unísono — se ve más
  // orgánico/líquido y menos "efecto de plantilla".
  const shineDelay = useMemo(() => `${(Math.random() * 4).toFixed(2)}s`, []);
  const shineCls = glass ? ' liquid-shine' : '';
  const shineStyle = glass ? { '--shine-delay': shineDelay } : {};

  if (!FINE) {
    return (
      <Comp ref={nodeRef} className={className + shineCls} style={{ ...style, ...shineStyle }} {...props}>
        {children}
      </Comp>
    );
  }

  const onPointerMove = (e) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 2 * max);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 2 * max);
    el.style.setProperty('--spec-x', `${e.clientX - r.left}px`);
    el.style.setProperty('--spec-y', `${e.clientY - r.top}px`);
  };
  const onPointerLeave = () => { rx.set(0); ry.set(0); };

  return (
    <Comp
      ref={nodeRef}
      className={className + shineCls}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      whileHover={{ scale: hoverScale }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      style={{ ...style, ...shineStyle, rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      {...props}
    >
      {children}
    </Comp>
  );
}
