import { motion, useReducedMotion } from 'framer-motion';
import { DUR, EASE_OUT } from '../../lib/motion';
const offset = (from, distance) => ({
  opacity: 0,
  y: from === 'bottom' ? distance : from === 'top' ? -distance : 0,
  x: from === 'left' ? -distance : from === 'right' ? distance : 0,
});

// Two-dimensional entrances only. Reduced motion shows content immediately.
export default function Reveal({ children, delay = 0, from = 'bottom', distance = 6, duration = DUR.base, className = '', ...props }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : offset(from, distance)}
      animate={reducedMotion ? { opacity: 1, y: 0, x: 0 } : undefined}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: reducedMotion ? 0 : duration, delay: reducedMotion ? 0 : Math.min(delay, 0.12), ease: EASE_OUT }}
      {...props}
    >{children}</motion.div>
  );
}

export function RevealList({ children, stagger = 0.025, delay = 0, className = '' }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : 'hidden'}
      animate={reducedMotion ? 'visible' : undefined}
      whileInView={reducedMotion ? undefined : 'visible'}
      viewport={{ once: true, margin: '-60px' }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: reducedMotion ? 0 : stagger, delayChildren: reducedMotion ? 0 : delay } } }}
    >{children}</motion.div>
  );
}

export function RevealItem({ children, from = 'bottom', distance = 6, className = '' }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : undefined}
      variants={{ hidden: offset(from, distance), visible: { opacity: 1, y: 0, x: 0, transition: { duration: reducedMotion ? 0 : DUR.base, ease: EASE_OUT } } }}
    >{children}</motion.div>
  );
}
