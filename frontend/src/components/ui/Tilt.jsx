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
//  repetir en muchas cards sin pesar). Sin desktop+puntero fino (o
//  sea, en touch/móvil), el vidrio WebGL no existe — la misma card
//  recibe en su lugar `.liquid-shine`, una franja de luz en CSS puro
//  con el mismo tinte navy, para que ambos casos se sientan como el
//  mismo material y no como dos experiencias distintas.
// ============================================================
import { useMemo, useRef } from 'react';
import { motion, useSpring } from 'framer-motion';
import { useGlassPane } from '../three/GlassLayerContext';

// Sin mouse fino o con reduced-motion el tilt no existe (ni handlers)
const FINE =
  typeof window !== 'undefined' &&
  matchMedia('(pointer: fine)').matches &&
  !matchMedia('(prefers-reduced-motion: reduce)').matches;

// El vidrio WebGL (GlassLayer) exige lo mismo que use3D(): puntero fino
// Y pantalla ancha. Si dependiera solo de FINE, una ventana de escritorio
// angosta tendría el tilt-hover pero registraría un panel que GlassLayer
// nunca monta (use3D exige el ancho) — un limbo a medias. Con este check
// separado, esa misma ventana angosta cae limpio al shine CSS.
const WANTS_3D = FINE && typeof window !== 'undefined' && matchMedia('(min-width: 1024px)').matches;

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
  // Solo se registra en el GlassLayer si de verdad va a montarse un
  // canvas para dibujarlo (WANTS_3D) — nunca con solo FINE.
  useGlassPane(nodeRef, WANTS_3D ? glass : false);
  // Delay aleatorio (pero estable) por card: si varias tienen shine en
  // pantalla a la vez, que no brillen todas al unísono — se ve más
  // orgánico/líquido y menos "efecto de plantilla".
  const shineDelay = useMemo(() => `${(Math.random() * 4).toFixed(2)}s`, []);
  const shineCls = glass && !WANTS_3D ? ' liquid-shine' : '';
  const shineStyle = glass && !WANTS_3D ? { '--shine-delay': shineDelay } : {};

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
