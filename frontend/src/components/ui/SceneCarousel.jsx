import { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import SectionBg from './SectionBg';
import CollectionNavigation from './CollectionNavigation';
import GlassCard from './GlassCard';
import { DUR, EASE_OUT } from '../../lib/motion';

const FALLBACK = '/images/backgrounds/congregacion.webp';

// One stationary glass surface over the current admin-owned photograph.
// Identity (rather than position) survives insertions, filtering and reordering.
export default function SceneCarousel({ items, label, onOpen, renderContent, empty = 'Sin contenido publicado aún.', initialKey, className = '', photoPreview = Boolean(onOpen), panelClassName = 'h-[310px]' }) {
  const navigationRef = useRef(null);
  const [selected, setSelected] = useState(initialKey);
  const [shown, setShown] = useState(initialKey);
  const reducedMotion = useReducedMotion();
  const requestedIndex = Math.max(0, items.findIndex(item => item.key === selected));
  const currentIndex = Math.max(0, items.findIndex(item => item.key === shown));
  const requested = items[requestedIndex];
  const current = items[currentIndex];
  const go = direction => setSelected(items[(requestedIndex + direction + items.length) % items.length].key);

  return <section className={`relative isolate overflow-clip ${photoPreview ? 'pt-56 pb-10 md:pt-64 md:pb-12' : 'py-16 md:py-20'} ${className}`} aria-label={label}>
    <SectionBg sceneKey={requested?.key} src={requested?.image || FALLBACK} fallbackSrc={FALLBACK} opacity={photoPreview ? "opacity-100" : "opacity-70"} scrimClassName={photoPreview ? "bg-gradient-to-t from-bg/90 via-bg/25 to-bg/5" : "bg-bg/60"} animate onReady={() => setShown(requested?.key)} />
    <div className="relative z-10 max-w-4xl mx-auto px-6">
      {!current ? <p className="py-12 text-20 text-white/75">{empty}</p> : <div role="region" aria-roledescription="carrusel" aria-label={label} className="max-w-xl" onKeyDown={event => {
        if (event.target.closest('input, select, textarea, [role="tablist"], a[href], [contenteditable="true"]') || event.defaultPrevented) return;
        if (items.length > 1 && event.key === 'ArrowRight') { event.preventDefault(); navigationRef.current?.focus(); go(1); }
        if (items.length > 1 && event.key === 'ArrowLeft') { event.preventDefault(); navigationRef.current?.focus(); go(-1); }
      }}>
        <GlassCard as={onOpen ? 'button' : 'div'} {...(onOpen ? { type: 'button', onClick: () => onOpen(current.key), 'aria-haspopup': 'dialog' } : {})} glass data-lenis-prevent style={photoPreview ? { '--glass-dark-blur': 'blur(5px) saturate(115%)' } : undefined} className={`liquid-glass block w-full ${photoPreview ? 'h-[264px] p-5 sm:p-6' : `${panelClassName} p-7 sm:p-9`} overflow-y-auto [overflow-wrap:anywhere] rounded-[16px] text-left text-white focus-ring`}>
          <motion.div key={current.key} initial={{ opacity: reducedMotion ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: reducedMotion ? 0 : DUR.base, ease: EASE_OUT }}>
            {renderContent ? renderContent(current) : <>
              <h2 className={photoPreview ? "text-24 sm:text-28 font-bold tracking-tight line-clamp-2" : "text-28 sm:text-32 font-bold tracking-tight"}>{current.title}</h2>
              {current.description && <p className={`mt-3 text-16 text-white/85 leading-relaxed ${photoPreview ? "line-clamp-2" : ""}`}>{current.description}</p>}
              {current.meta && <p className="mt-3 text-13 text-white/80">{current.meta}</p>}
              {onOpen && <span className="block mt-5 text-13 font-semibold">Explorar</span>}
            </>}
          </motion.div>
        </GlassCard>
        {items.length > 1 && <CollectionNavigation aria-label={`Navegar ${label.toLowerCase()}`} className="mt-6 flex items-center gap-4 text-white">
          <button type="button" onClick={() => go(-1)} className="flex-1 min-w-0 min-h-11 rounded-[8px] px-2 text-left text-14 font-semibold focus-ring">Anterior<span className="block truncate text-12 font-normal text-white/75">{items[(currentIndex - 1 + items.length) % items.length].title}</span></button>
          <span role="status" className="shrink-0 text-12">{currentIndex + 1} de {items.length}</span>
          <button ref={navigationRef} type="button" onClick={() => go(1)} className="flex-1 min-w-0 min-h-11 rounded-[8px] px-2 text-right text-14 font-semibold focus-ring">Siguiente<span className="block truncate text-12 font-normal text-white/75">{items[(currentIndex + 1) % items.length].title}</span></button>
        </CollectionNavigation>}
      </div>}
    </div>
  </section>;
}
