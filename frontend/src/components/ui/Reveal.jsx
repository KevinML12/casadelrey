import { motion } from 'framer-motion';

const EASE = [0.25, 0.1, 0.25, 1];

/**
 * Reveal — envuelve cualquier elemento y lo anima cuando entra al viewport.
 *
 * @param {number}  delay     — retraso en segundos (para stagger)
 * @param {string}  from      — dirección: 'bottom' | 'left' | 'right' | 'none'
 * @param {number}  distance  — píxeles de desplazamiento (default 20)
 * @param {boolean} depth     — transición 3D real: el bloque rota en X
 *                              (perspectiva) al entrar, en vez de solo
 *                              deslizar en 2D. Úsalo en cards/paneles,
 *                              no en bloques de texto largos.
 * @param {string}  className
 */
export default function Reveal({
  children,
  delay = 0,
  from = 'bottom',
  distance = 20,
  duration = 0.5,
  depth = false,
  className = '',
  ...props
}) {
  const hidden = {
    opacity: 0,
    y: from === 'bottom' ? distance : from === 'top' ? -distance : 0,
    x: from === 'left' ? -distance : from === 'right' ? distance : 0,
    ...(depth && { rotateX: 10, scale: 0.96 }),
  };

  return (
    <motion.div
      className={className}
      style={depth ? { transformPerspective: 1000 } : undefined}
      initial={hidden}
      whileInView={{ opacity: 1, y: 0, x: 0, ...(depth && { rotateX: 0, scale: 1 }) }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: depth ? duration + 0.15 : duration, delay, ease: EASE }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * RevealList — aplica stagger automático a sus children.
 *
 * @param {number} stagger — segundos entre cada hijo (default 0.07)
 */
export function RevealList({ children, stagger = 0.07, delay = 0, className = '' }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={{
        hidden:  {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * RevealItem — hijo de RevealList.
 * @param {boolean} depth — misma transición 3D real que Reveal, pero
 *                          orquestada por el stagger del padre.
 */
export function RevealItem({ children, from = 'bottom', distance = 18, depth = false, className = '' }) {
  const hidden = {
    opacity: 0,
    y: from === 'bottom' ? distance : from === 'top' ? -distance : 0,
    x: from === 'left' ? -distance : from === 'right' ? distance : 0,
    ...(depth && { rotateX: 14, scale: 0.94 }),
  };

  return (
    <motion.div
      className={className}
      style={depth ? { transformPerspective: 900 } : undefined}
      variants={{
        hidden,
        visible: {
          opacity: 1, y: 0, x: 0,
          ...(depth && { rotateX: 0, scale: 1 }),
          transition: { duration: depth ? 0.6 : 0.45, ease: EASE },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
