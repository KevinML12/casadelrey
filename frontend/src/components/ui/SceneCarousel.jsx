import { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import SectionBg from './SectionBg';
import GlassCard from './GlassCard';
import { DUR, EASE_OUT } from '../../lib/motion';

const FALLBACK = '/images/backgrounds/congregacion.webp';

// One stationary glass surface over the current admin-owned photograph.
// Identity (rather than position) survives insertions, filtering and reordering.
export default function SceneCarousel({ items, label, onOpen, renderContent, empty = 'Sin contenido publicado aún.', initialKey, className = '', panelClassName = 'h-[310px]' }) {
  const navigationRef = useRef(null);
  const [selected, setSelected] = useState(initialKey);
  const [shown, setShown] = useState(initialKey);
  const reducedMotion = useReducedMotion();
  const requestedIndex = Math.max(0, items.findIndex(item => item.key === selected));
  const currentIndex = Math.max(0, items.findIndex(item => item.key === shown));
  const requested = items[requestedIndex];
  const current = items[currentIndex];
  const go = direction => setSelected(items[(requestedIndex + direction + items.length) % items.length].key);

  return <section className={`relative isolate overflow-clip py-16 md:py-20 ${className}`} aria-label={label}>
    <SectionBg sceneKey={requested?.key} src={requested?.image || FALLBACK} fallbackSrc={FALLBACK} opacity="opacity-70" animate onReady={() => setShown(requested?.key)} />
    <div className="relative z-10 max-w-4xl mx-auto px-6">
      {!current ? <p className="py-12 text-20 text-white/75">{empty}</p> : <div role="region" aria-roledescription="carrusel" aria-label={label} className="max-w-xl" onKeyDown={event => {
        if (event.target.closest('input, select, textarea, [role="tablist"], a[href], [contenteditable="true"]') || event.defaultPrevented) return;
        if (items.length > 1 && event.key === 'ArrowRight') { event.preventDefault(); navigationRef.current?.focus(); go(1); }
        if (items.length > 1 && event.key === 'ArrowLeft') { event.preventDefault(); navigationRef.current?.focus(); go(-1); }
      }}>
        <GlassCard as={onOpen ? 'button' : 'div'} {...(onOpen ? { type: 'button', onClick: () => onOpen(current.key), 'aria-haspopup': 'dialog' } : {})} glass data-lenis-prevent className={`liquid-glass block w-full ${panelClassName} overflow-y-auto [overflow-wrap:anywhere] rounded-[16px] p-7 sm:p-9 text-left text-white focus-ring`}>
          <motion.div key={current.key} initial={{ opacity: reducedMotion ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: reducedMotion ? 0 : DUR.base, ease: EASE_OUT }}>
            {renderContent ? renderContent(current) : <>
              <h2 className="text-28 sm:text-32 font-bold tracking-tight">{current.title}</h2>
              {current.description && <p className="mt-4 text-16 text-white/80 leading-relaxed">{current.description}</p>}
              {current.meta && <p className="mt-5 text-13 text-white/75">{current.meta}</p>}
              {onOpen && <span className="block mt-9 text-13 font-semibold">Explorar</span>}
            </>}
          </motion.div>
        </GlassCard>
        {items.length > 1 && <nav aria-label={`Navegar ${label.toLowerCase()}`} className="mt-6 flex items-center gap-4 text-white">
          <button type="button" onClick={() => go(-1)} className="flex-1 min-w-0 min-h-11 rounded-[8px] px-2 text-left text-14 font-semibold focus-ring">Anterior<span className="block truncate text-12 font-normal text-white/75">{items[(currentIndex - 1 + items.length) % items.length].title}</span></button>
          <span role="status" className="shrink-0 text-12">{currentIndex + 1} de {items.length}</span>
          <button ref={navigationRef} type="button" onClick={() => go(1)} className="flex-1 min-w-0 min-h-11 rounded-[8px] px-2 text-right text-14 font-semibold focus-ring">Siguiente<span className="block truncate text-12 font-normal text-white/75">{items[(currentIndex + 1) % items.length].title}</span></button>
        </nav>}
      </div>}
    </div>
  </section>;
}
