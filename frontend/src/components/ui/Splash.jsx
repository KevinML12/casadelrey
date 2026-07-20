// ============================================================
//  Splash — el logo animado (mp4) como cortina de carga de marca.
//  Una vez por sesión, ~2.5s máximo, se desvanece al terminar el
//  video o al agotar el tiempo. Con reduced-motion no existe.
// ============================================================
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const KEY = 'cdr-splash-seen';

const shouldShow = () =>
  typeof window !== 'undefined' &&
  !sessionStorage.getItem(KEY) &&
  !matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Splash() {
  const [open, setOpen] = useState(shouldShow);
  const timer = useRef(null);

  const dismiss = () => {
    sessionStorage.setItem(KEY, '1');
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    // tope duro: nunca retener al visitante más de 2.6s
    timer.current = setTimeout(dismiss, 2600);
    return () => clearTimeout(timer.current);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        // Fondo blanco: el mp4 es logo navy sobre blanco — así el video
        // se funde sin bordes y el fade-out revela el sitio navy
        <motion.div
          // pointer-events-none: el splash no tiene nada clickeable adentro
          // -- si por lo que sea el fade de salida se traba o tarda de más,
          // el sitio de abajo sigue siendo usable en vez de quedar
          // bloqueado por un overlay invisible/fantasma.
          className="fixed inset-0 z-[100] bg-white flex items-center justify-center pointer-events-none"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          aria-hidden
        >
          <video
            src="/logo-animado.mp4"
            autoPlay
            muted
            playsInline
            onEnded={dismiss}
            onError={dismiss}
            className="w-[min(70vw,420px)] aspect-square object-cover"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
