import { useRef } from 'react';
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';

// The foreground moves only a few pixels over its stationary photograph.
// No rotation, magnification or light attached to the pointer.
export default function LayeredPanel({ children, className = '', ...props }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(pointerX, { stiffness: 320, damping: 38 });
  const pointer = useSpring(pointerY, { stiffness: 320, damping: 38 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(() => reduced ? 0 : pointer.get() + (0.5 - scrollYProgress.get()) * 12);
  const reset = () => { pointerX.set(0); pointerY.set(0); };
  return <motion.div ref={ref} data-layered-panel className={className} style={{ x: reduced ? 0 : x, y }}
    onPointerMove={event => {
      if (reduced || event.pointerType !== 'mouse' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      const box = event.currentTarget.getBoundingClientRect();
      pointerX.set(((event.clientX - box.left) / box.width - 0.5) * 8);
      pointerY.set(((event.clientY - box.top) / box.height - 0.5) * 6);
    }} onPointerLeave={reset} onPointerCancel={reset} {...props}>{children}</motion.div>;
}
