// ============================================================
//  Tilt — Fase 3: la card de cristal se inclina en 3D siguiendo
//  al cursor, con física de resorte real (framer-motion), y de
//  paso alimenta el brillo especular (--spec-x/--spec-y) que ya
//  usan .liquid-glass/.glass-light. NO combinar con .card-spring:
//  esa clase transiciona transform en CSS y pelea con el resorte.
//
//  prop `glass` ("standard" | "featured"): además del tilt CSS,
//  registra esta card en el GlassLayer compartido — un panel de
//  vidrio con refracción REAL (WebGL) se renderiza justo detrás,
//  seguido en cada frame a la posición real de la card en pantalla.
//  "featured" usa MeshTransmissionMaterial (alta calidad, pocas a
//  la vez); "standard" usa un material nativo más barato (se puede
//  repetir en muchas cards sin pesar). Sin desktop+puntero fino,
//  `glass` no hace nada — la card se queda en su .liquid-glass CSS.
// ============================================================
import { useMemo, useRef } from 'react';
import { motion, useSpring } from 'framer-motion';
import { useGlassPane } from '../three/GlassLayerContext';

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
 * @param {string} glass      — "standard" | "featured" — vidrio WebGL real detrás
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
  useGlassPane(nodeRef, glass);

  if (!FINE) {
    return <Comp ref={nodeRef} className={className} style={style} {...props}>{children}</Comp>;
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
      className={className}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      whileHover={{ scale: hoverScale }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      style={{ ...style, rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      {...props}
    >
      {children}
    </Comp>
  );
}
