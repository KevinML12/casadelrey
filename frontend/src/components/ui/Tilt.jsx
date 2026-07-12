// ============================================================
//  Tilt — la card se inclina en 3D siguiendo al cursor, con física
//  de resorte real (framer-motion), y de paso alimenta el brillo
//  especular (--spec-x/--spec-y) que usan .liquid-glass/.glass-light.
//  NO combinar con .card-spring: esa clase transiciona transform en
//  CSS y pelea con el resorte.
//
//  Además del pointer-follow (solo mouse/trackpad), toda card Tilt
//  reacciona al SCROLL: mientras cruza el viewport se inclina y el
//  brillo se desliza de un extremo a otro — un "giroscopio" simulado
//  a partir de la posición de scroll, sin usar DeviceOrientation (ese
//  API pide permiso explícito en iOS y no es confiable). Funciona
//  igual en teléfono que en desktop; en desktop el mouse manda mientras
//  hay hover, y el scroll retoma en cuanto se suelta.
//
//  prop `glass` (cualquier valor truthy): la card recibe además
//  `.liquid-shine`, una franja de luz en CSS puro fija en la esquina —
//  el efecto "líquido" no anima solo, reacciona a cursor/scroll (antes
//  montaba un canvas WebGL con refracción real, pero se veía
//  opaco/lavado y se descartó — ver docs/DISENO_LIQUID_GLASS.md).
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

const FINE =
  typeof window !== 'undefined' && matchMedia('(pointer: fine)').matches;
const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches;

const SPRING = { stiffness: 260, damping: 20, mass: 0.7 };

/**
 * @param {string} as         — componente a renderizar (p.ej. Link); default div
 * @param {number} max        — grados máximos de inclinación (pointer)
 * @param {number} scrollMax  — grados máximos de inclinación (scroll)
 * @param {number} hoverScale — escala al hacer hover
 * @param {*}      glass      — truthy → agrega el brillo líquido `.liquid-shine`
 */
export default function Tilt({
  as,
  children,
  className = '',
  max = 6,
  scrollMax = 4,
  hoverScale = 1.012,
  glass,
  style,
  ...props
}) {
  const Comp = useMemo(() => (as ? motion.create(as) : motion.div), [as]);
  const rx = useSpring(0, SPRING);
  const ry = useSpring(0, SPRING);
  const nodeRef = useRef(null);
  const hoveringRef = useRef(false);
  // Delay/fase aleatorios (pero estables) por card: si varias reaccionan
  // a la vez, que no se muevan al unísono — se ve más orgánico/líquido y
  // menos "efecto de plantilla". useState con inicializador lazy (no
  // useMemo) porque Math.random() en el cuerpo del render se marca como
  // impuro; el inicializador de useState corre una sola vez a propósito.
  const [shineDelay] = useState(() => `${(Math.random() * 4).toFixed(2)}s`);
  const [phase] = useState(() => Math.random() * Math.PI * 2);
  const shineCls = glass ? ' liquid-shine' : '';
  const shineStyle = glass ? { '--shine-delay': shineDelay } : {};

  // Scroll-driven ambient tilt + specular sweep — corre siempre (mobile
  // y desktop), pero cede el control al mouse mientras hay hover fino.
  useEffect(() => {
    if (REDUCED_MOTION) return;
    const el = nodeRef.current;
    if (!el) return;

    let raf = null;
    let inView = false;

    const apply = () => {
      raf = null;
      if (!inView || hoveringRef.current) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // -1 (entra por abajo) → 0 (centro del viewport) → 1 (sale por arriba)
      const p = Math.max(-1, Math.min(1, (0.5 - (r.top + r.height / 2) / vh) * 2));
      rx.set(p * scrollMax);
      ry.set(Math.sin(p * Math.PI + phase) * scrollMax * 0.7);
      el.style.setProperty('--spec-x', `${50 + Math.sin(p * Math.PI + phase) * 38}%`);
      el.style.setProperty('--spec-y', `${(p * 0.5 + 0.5) * 100}%`);
      el.style.setProperty('--spec-o', FINE ? '0.55' : '0.7');
    };
    const requestApply = () => { if (!raf) raf = requestAnimationFrame(apply); };

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) requestApply();
        else { el.style.setProperty('--spec-o', '0'); rx.set(0); ry.set(0); }
      },
      { rootMargin: '15% 0px' }
    );
    io.observe(el);
    window.addEventListener('scroll', requestApply, { passive: true });
    window.addEventListener('resize', requestApply);
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', requestApply);
      window.removeEventListener('resize', requestApply);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [rx, ry, phase, scrollMax]);

  if (!FINE || REDUCED_MOTION) {
    return (
      <Comp
        ref={nodeRef}
        className={className + shineCls}
        style={{ ...style, ...shineStyle, rotateX: rx, rotateY: ry, transformPerspective: 900 }}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  const onPointerMove = (e) => {
    hoveringRef.current = true;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 2 * max);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 2 * max);
    el.style.setProperty('--spec-x', `${e.clientX - r.left}px`);
    el.style.setProperty('--spec-y', `${e.clientY - r.top}px`);
    el.style.setProperty('--spec-o', '1');
  };
  const onPointerLeave = (e) => {
    hoveringRef.current = false;
    rx.set(0);
    ry.set(0);
    e.currentTarget.style.setProperty('--spec-o', '0');
  };

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
