import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import SectionBg from '../ui/SectionBg';
import LayeredPanel from '../ui/LayeredPanel';
import CrossfadePhoto from '../ui/CrossfadePhoto';
import CollectionNavigation from '../ui/CollectionNavigation';
import { DUR } from '../../lib/motion';

export default function ChurchStory({ items, background }) {
  const [selected, setSelected] = useState(null);
  const reduced = useReducedMotion();
  const index = Math.max(0, items.findIndex(item => item.key === selected));
  const current = items[index];
  if (!current) return null;
  const go = direction => setSelected(items[(index + direction + items.length) % items.length].key);
  return <section aria-label="Nuestra iglesia" className="relative isolate overflow-clip py-16 md:py-24">
    <SectionBg src={background} opacity="opacity-100" scrimClassName="bg-gradient-to-r from-bg/65 via-bg/20 to-bg/55" />
    <div className="relative z-10 max-w-6xl mx-auto px-6">
      <LayeredPanel className="liquid-glass rounded-[16px] overflow-hidden max-w-5xl" onKeyDown={event => {
        if (event.key === 'ArrowRight') { event.preventDefault(); go(1); }
        if (event.key === 'ArrowLeft') { event.preventDefault(); go(-1); }
      }}>
        <div className={`grid ${current.portrait ? 'md:grid-cols-[minmax(240px,0.85fr)_minmax(0,1.2fr)]' : ''}`}>
          {current.portrait && <div className="relative h-[380px] md:h-[490px] bg-bg/15" data-pastor-photo>
            <CrossfadePhoto src={current.image} fallbackSrc={current.fallbackImage} fit="contain" alt={current.title} sizes="(max-width: 767px) 100vw, 480px" />
          </div>}
          <div className={`flex flex-col justify-center p-7 sm:p-10 ${current.portrait ? '' : 'min-h-[360px] max-w-3xl'}`}>
            <motion.div key={current.key} initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : DUR.base }}>
              {current.meta && <p className="mb-4 text-13 font-semibold text-white/75">{current.meta}</p>}
              <h2 className="text-28 sm:text-36 font-bold leading-tight tracking-tight">{current.title}</h2>
              {current.description && <p className="mt-5 text-16 sm:text-18 text-white/85 leading-relaxed">{current.description}</p>}
            </motion.div>
          </div>
        </div>
        {items.length > 1 && <CollectionNavigation className="flex items-center gap-3 border-t border-white/15 px-5 py-3" aria-label="Nuestra historia">
          <button type="button" onClick={() => go(-1)} className="flex-1 min-w-0 min-h-11 px-3 rounded-[8px] text-left text-14 font-semibold focus-ring">Anterior<span className="block truncate text-12 font-normal text-white/75">{items[(index - 1 + items.length) % items.length].title}</span></button>
          <span role="status" className="text-12 shrink-0">{index + 1} de {items.length}</span>
          <button type="button" onClick={() => go(1)} className="flex-1 min-w-0 min-h-11 px-3 rounded-[8px] text-right text-14 font-semibold focus-ring">Siguiente<span className="block truncate text-12 font-normal text-white/75">{items[(index + 1) % items.length].title}</span></button>
        </CollectionNavigation>}
      </LayeredPanel>
    </div>
  </section>;
}
