import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import SectionBg from '../ui/SectionBg';
import LayeredPanel from '../ui/LayeredPanel';
import CollectionStatus from '../ui/CollectionStatus';
import { useApi, useApiResource } from '../../lib/feed';
import { DUR } from '../../lib/motion';

const publicLink = value => {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; }
  catch { return null; }
};
const actionClass = 'inline-flex min-h-11 items-center justify-center rounded-pill px-5 py-3 text-14 font-bold focus-ring';
export default function VisitExperience({ home = false }) {
  const resource = useApiResource('/settings');
  const settings = resource.data || {};
  const photos = useApi('/site-photos') || {};
  const [selected, setSelected] = useState('visit');
  const [copied, setCopied] = useState(null);
  const id = useId();
  const reduced = useReducedMotion();
  const items = [
    { key: 'visit', tab: 'Visítanos', title: 'Te esperamos en casa.', description: settings.about_address, image: (home && photos.home_ubicacion) || photos.about_visitanos || photos.about_comunidad || '/images/backgrounds/comunidad-templo.webp', href: publicLink(settings.about_map_url), action: 'Cómo llegar', copy: 'Copiar dirección' },
    { key: 'podcast', tab: 'Podcast', title: settings.about_podcast_title, description: settings.about_podcast_schedule, image: photos.about_podcast || '/images/backgrounds/vol-multimedia.webp', href: publicLink(settings.about_podcast_url), action: 'Escuchar podcast', copy: 'Copiar horario' },
  ].filter(item => item.description);
  const current = items.find(item => item.key === selected) || items[0];
  const choose = key => { setSelected(key); setCopied(null); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(current.description); setCopied(current.key); }
    catch { setCopied('failed'); }
  };
  if (!current && !resource.loading && !resource.error) return null;
  return <section id={home ? 'ubicacion' : 'visitanos'} aria-label="Visítanos y escucha" className="relative isolate overflow-clip py-20 md:py-28 border-t border-white/10">
    <SectionBg src={current?.image || '/images/backgrounds/comunidad-templo.webp'} opacity="opacity-100" scrimClassName="bg-gradient-to-r from-bg/40 via-bg/15 to-bg/75" animate />
    <div className="relative z-10 max-w-6xl mx-auto px-6">
      {resource.loading || resource.error ? <CollectionStatus loading={resource.loading} label="la información de visita y podcast" onRetry={resource.retry} /> : <div className="grid md:grid-cols-[1fr_1fr] gap-10 md:gap-16 items-end min-h-[480px]">
        <div className="pb-2 md:pb-10"><p className="text-14 font-semibold text-white/85 mb-5">Casa del Rey</p><h2 className="text-d2 max-w-md">{current.key === 'visit' ? 'Nos vemos aquí.' : 'También nos escuchamos.'}</h2></div>
        <LayeredPanel className="liquid-glass rounded-[16px] p-6 sm:p-8 text-white">
          <div role="tablist" aria-label="Visita y podcast" className="flex gap-2 border-b border-white/20 pb-4 mb-7" onKeyDown={event => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const index = items.indexOf(current);
            const next = event.key === 'Home' ? items[0] : event.key === 'End' ? items.at(-1) : items[(index + (event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length];
            choose(next.key); document.getElementById(`${id}-${next.key}`)?.focus();
          }}>
            {items.map(item => <button key={item.key} type="button" role="tab" id={`${id}-${item.key}`} aria-controls={`${id}-panel`} aria-selected={item.key === current.key} tabIndex={item.key === current.key ? 0 : -1} onClick={() => choose(item.key)} className={`min-h-11 px-5 rounded-pill text-14 font-semibold focus-ring ${item.key === current.key ? 'bg-white text-bg' : 'text-white/80 hover:bg-white/10'}`}>{item.tab}</button>)}
          </div>
          <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${current.key}`} tabIndex={0} className="focus-ring rounded-[8px]">
            <motion.div key={current.key} initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : DUR.base }}>
              <h3 className="text-26 sm:text-32 leading-tight font-bold">{current.title}</h3>
              <p className="mt-5 text-16 leading-relaxed text-white/85 whitespace-pre-line">{current.description}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                {current.href && <a href={current.href} target="_blank" rel="noopener noreferrer" className={`${actionClass} bg-white text-bg`}>{current.action}</a>}
                <button type="button" onClick={copy} className={`${actionClass} border border-white/35 text-white`}>{copied === current.key ? 'Copiado' : current.copy}</button>
              </div>
              {current.key === 'visit' && <Link to="/conectate" className="inline-flex items-center min-h-11 mt-5 text-14 font-semibold underline underline-offset-4 focus-ring rounded-[8px]">¿Primera vez? Conéctate</Link>}
              <p role="status" className="mt-3 text-12 text-white/85">{copied === current.key ? 'Información copiada.' : copied === 'failed' ? 'Puedes seleccionar y copiar el texto de arriba.' : ''}</p>
            </motion.div>
          </div>
        </LayeredPanel>
      </div>}
    </div>
  </section>;
}
