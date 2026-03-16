import { motion } from 'framer-motion';

const EASE = [0.25, 0.1, 0.25, 1];

/**
 * Reveal — envuelve cualquier elemento y lo anima cuando entra al viewport.
 *
 * @param {number}  delay     — retraso en segundos (para stagger)
 * @param {string}  from      — dirección: 'bottom' | 'left' | 'right' | 'none'
 * @param {number}  distance  — píxeles de desplazamiento (default 20)
 * @param {string}  className
 */
export default function Reveal({
  children,
  delay = 0,
  from = 'bottom',
  distance = 20,
  duration = 0.5,
  className = '',
  ...props
}) {
  const hidden = {
    opacity: 0,
    y: from === 'bottom' ? distance : from === 'top' ? -distance : 0,
    x: from === 'left' ? -distance : from === 'right' ? distance : 0,
  };

  return (
    <motion.div
      className={className}
      initial={hidden}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration, delay, ease: EASE }}
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
 */
export function RevealItem({ children, from = 'bottom', distance = 18, className = '' }) {
  const hidden = {
    opacity: 0,
    y: from === 'bottom' ? distance : from === 'top' ? -distance : 0,
    x: from === 'left' ? -distance : from === 'right' ? distance : 0,
  };

  return (
    <motion.div
      className={className}
      variants={{
        hidden:  hidden,
        visible: { opacity: 1, y: 0, x: 0, transition: { duration: 0.45, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}
