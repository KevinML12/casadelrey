import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * ParallaxImg — foto de fondo que se mueve más lento que el contenido.
 * La capa de profundidad que separa un sitio real de una plantilla.
 * Compartido entre todas las páginas públicas (nació en Home.jsx).
 */
export default function ParallaxImg({ src, alt = '', className = '', overlay = false }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-9%', '9%']);
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <motion.img
        src={src}
        alt={alt}
        // saturate(1.12): las fotos de la iglesia son el único activo
        // irrepetible del sitio y llegaban lavadas -- primero por el
        // `opacity-45` que cada caller le encimaba (ya eliminado, el
        // contraste ahora lo pone el scrim) y después porque el JPG
        // original ya venía plano. Un empujón leve de saturación, no un
        // filtro de color: la piel y la luz cálida de escenario vuelven
        // a leerse sin que la foto se sienta procesada.
        style={{ y, filter: 'saturate(1.12)' }}
        className={`absolute inset-0 w-full h-full object-cover scale-[1.18] ${className}`}
      />
      {overlay && <div className="absolute inset-0 bg-bg/60 pointer-events-none" />}
    </div>
  );
}
