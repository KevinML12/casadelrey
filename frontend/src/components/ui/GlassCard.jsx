import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { DUR, EASE_OUT } from '../../lib/motion';

// Flat glass surface. A press can confirm an action; the card never tilts,
// tracks the pointer, magnifies its neighbors or simulates perspective.
export default function GlassCard({ as, children, className = '', glass, ...props }) {
  const Component = useMemo(() => as ? motion.create(as) : motion.div, [as]);
  const reducedMotion = useReducedMotion();
  return (
    <Component
      {...props}
      className={className + (glass ? ' liquid-shine' : '')}
      whileTap={reducedMotion ? undefined : { scale: 0.985 }}
      transition={{ duration: DUR.fast, ease: EASE_OUT }}
    >
      {children}
    </Component>
  );
}
