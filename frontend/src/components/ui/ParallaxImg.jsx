import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * ParallaxImg — foto de fondo que se mueve más lento que el contenido.
 * La capa de profundidad que separa un sitio real de una plantilla.
 * Compartido entre todas las páginas públicas (nació en Home.jsx).
 */
export default function ParallaxImg({ src, alt = '', className = '' }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-9%', '9%']);
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <motion.img
        src={src}
        alt={alt}
        style={{ y }}
        className={`absolute inset-0 w-full h-full object-cover scale-[1.18] ${className}`}
      />
    </div>
  );
}
