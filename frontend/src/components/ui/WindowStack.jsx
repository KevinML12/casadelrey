// ============================================================
//  WindowStack — ventanas de cristal SOBREPUESTAS (lenguaje de diseño
//  del sitio, ver docs/DISENO_LIQUID_GLASS.md). Al abrir un ítem se
//  muestra su ventana de cristal flotante sobre TODO; detrás asoman los
//  demás ítems apilados como cartas, y se salta entre ellos trayéndolos
//  al frente. Navegación: X, Escape, flechas ←→, dots. Bloquea el scroll
//  del fondo mientras hay ventana abierta.
//
//  props:
//   items          [{ key, image, badge?, title }]  — pila + banner
//   openKey        key abierta (o null = cerrado)
//   onChange(key)  cambia la ventana activa; null cierra
//   renderContent(item) → cuerpo (scrollable) de la ventana del frente
// ============================================================
import { useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Glass';

// Posición de cada ventana según su profundidad (0 = frente). Las de
// atrás asoman hacia arriba, alternando el lado, como cartas apiladas.
const stackPose = (depth) => ({
  scale: 1 - depth * 0.055,
  y: -depth * 16,
  x: (depth % 2 === 0 ? 1 : -1) * depth * 12,
  rotate: (depth % 2 === 0 ? -1 : 1) * depth * 1.6,
  opacity: depth > 3 ? 0 : 1 - depth * 0.16,
  zIndex: 50 - depth,
});

export default function WindowStack({ items, openKey, onChange, renderContent, height = 'min(80vh, 640px)' }) {
  const stack = useMemo(() => {
    if (!openKey) return [];
    const idx = items.findIndex(it => it.key === openKey);
    if (idx < 0) return [];
    return [...items.slice(idx), ...items.slice(0, idx)]; // activo primero
  }, [openKey, items]);

  const close = useCallback(() => onChange(null), [onChange]);
  const go = useCallback((dir) => {
    const i = items.findIndex(it => it.key === openKey);
    if (i < 0) return;
    onChange(items[(i + dir + items.length) % items.length].key);
  }, [items, openKey, onChange]);

  useEffect(() => {
    if (!openKey) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [openKey, close, go]);

  return (
    <AnimatePresence>
      {openKey && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop que difumina TODO el fondo */}
          <motion.div
            className="absolute inset-0 bg-bg/60"
            style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
            onClick={close}
          />

          {/* Cerrar */}
          <motion.button
            onClick={close}
            whileHover={{ scale: 1.08, rotate: 90 }} whileTap={{ scale: 0.9 }}
            aria-label="Cerrar"
            className="absolute top-6 right-6 z-[120] w-11 h-11 rounded-full liquid-glass flex items-center justify-center text-white/80 hover:text-white"
          >
            <Icon name="close" className="w-5 h-5" />
          </motion.button>

          {/* Flechas laterales (desktop) */}
          {items.length > 1 && (
            <>
              <button onClick={() => go(-1)} aria-label="Anterior"
                className="hidden md:flex absolute left-6 z-[120] w-11 h-11 rounded-full liquid-glass items-center justify-center text-white/70 hover:text-white">
                <Icon name="arrow" className="w-5 h-5 rotate-180" />
              </button>
              <button onClick={() => go(1)} aria-label="Siguiente"
                className="hidden md:flex absolute right-6 z-[120] w-11 h-11 rounded-full liquid-glass items-center justify-center text-white/70 hover:text-white">
                <Icon name="arrow" className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Pila de ventanas */}
          <div className="relative w-full max-w-[780px]" style={{ height, perspective: 1400 }}>
            {stack.map((it, depth) => {
              const isFront = depth === 0;
              return (
                <motion.div
                  key={it.key}
                  animate={stackPose(depth)}
                  transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                  onClick={() => !isFront && onChange(it.key)}
                  className={`absolute inset-0 liquid-glass rounded-[28px] overflow-hidden flex flex-col ${isFront ? '' : 'cursor-pointer'}`}
                  style={{ transformOrigin: 'top center', pointerEvents: depth > 3 ? 'none' : 'auto' }}
                >
                  {/* Banner */}
                  <div className="relative h-32 sm:h-40 shrink-0">
                    {it.image && <img src={it.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A1526] via-[#0A1526]/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-5 sm:p-6">
                      {it.badge && (
                        <span className="bg-white/12 border border-white/20 text-white/90 px-2.5 py-0.5 rounded-full text-[11px] font-semibold backdrop-blur-md">
                          {it.badge}
                        </span>
                      )}
                      <h2 className="text-[26px] sm:text-[32px] font-bold text-white tracking-tight mt-2 leading-none">{it.title}</h2>
                    </div>
                  </div>

                  {/* Cuerpo (solo la del frente es interactiva/scrollable) */}
                  {isFront && (
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                      {renderContent(it)}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Dots */}
          {items.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[120] flex gap-2">
              {items.map(it => (
                <button
                  key={it.key}
                  onClick={() => onChange(it.key)}
                  aria-label={it.title}
                  className={`h-1.5 rounded-full transition-all ${it.key === openKey ? 'w-6 bg-white' : 'w-1.5 bg-white/35 hover:bg-white/60'}`}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
