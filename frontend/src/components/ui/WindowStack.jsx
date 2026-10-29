import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PhotoImage from './PhotoImage';
import CrossfadePhoto from './CrossfadePhoto';
import { DUR, EASE_OUT } from '../../lib/motion';
import { lockDialogBackground, restoreParentDialogFocus } from '../../lib/dialogBackground';

const FOCUSABLE = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Shared flat glass dialog. Previous/next changes the content in the same
// plane. The legacy name remains so existing page integrations stay intact.
export default function WindowStack({ items, openKey, onChange, renderContent, height = 'min(80svh, 640px)', light = false, photoBackdrop = false, animated = false, neighborTitles = false, contentKey, sobrepuesto = null, onCerrarSobrepuesto }) {
  const dialogRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const [photoSelection, setPhotoSelection] = useState({});
  const nextRef = useRef(null);
  const active = items.find(it => it.key === openKey);
  const isOpen = Boolean(active);
  const index = items.findIndex(it => it.key === openKey);
  const photos = active?.images?.length ? active.images : active?.image ? [active.image] : [];
  const photoOwner = `${openKey}:${active?.image || ''}`;
  if (photoSelection.owner !== photoOwner) setPhotoSelection({ owner: photoOwner, index: 0 });
  const photoIdx = photoSelection.owner === photoOwner ? (photoSelection.index || 0) % Math.max(photos.length, 1) : 0;
  const setPhotoIdx = value => setPhotoSelection({ owner: photoOwner, index: typeof value === 'function' ? value(photoIdx) : value });
  const mediaLayout = photoBackdrop && photos.length > 0 && !sobrepuesto;
  const close = () => sobrepuesto ? onCerrarSobrepuesto?.() : onChange(null);
  const go = direction => onChange(items[(index + direction + items.length) % items.length].key);

  const actions = useRef({ close, go });
  useEffect(() => { actions.current = { close, go }; });

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement;
    const releaseBackground = lockDialogBackground();
    const focusable = () => [...(dialogRef.current?.querySelectorAll(FOCUSABLE) || [])]
      .filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length > 0);
    (focusable()[0] || dialogRef.current)?.focus();
    const onKey = event => {
      const dialogs = [...document.querySelectorAll('[role="dialog"]')];
      if (dialogs.at(-1) !== dialogRef.current) return;
      if (event.key === 'Escape') { event.preventDefault(); actions.current.close(); }
      if (event.key === 'Tab') {
        const nodes = focusable();
        const first = nodes[0], last = nodes.at(-1);
        if (!first) { event.preventDefault(); dialogRef.current?.focus(); }
        else if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement) || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement) || document.activeElement === dialogRef.current)) { event.preventDefault(); first.focus(); }
      }
      const editing = event.target.closest('input, textarea, select, a[href], [contenteditable="true"], [role="tablist"]');
      if (!event.defaultPrevented && !sobrepuesto && !editing && items.length > 1) {
        if (event.key === 'ArrowRight') { event.preventDefault(); nextRef.current?.focus(); actions.current.go(1); }
        if (event.key === 'ArrowLeft') { event.preventDefault(); nextRef.current?.focus(); actions.current.go(-1); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      releaseBackground();
      restoreParentDialogFocus(previousFocus);
    };
  }, [isOpen, sobrepuesto, items.length]);

  return createPortal(
    <AnimatePresence>
      {active && (
        <motion.div
          ref={dialogRef} role="dialog" aria-modal="true" aria-label={active.title} tabIndex={-1}
          className="fixed inset-0 z-[100] flex items-center justify-center px-3 py-4 sm:px-7 sm:py-6 outline-none"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : DUR.base }}
        >
          <div className={`absolute inset-0 ${photoBackdrop ? 'bg-bg' : 'bg-bg/65 backdrop-blur-lg'}`} onClick={close}>
            {photoBackdrop && photos.length > 0 && (animated
              ? <CrossfadePhoto src={photos[photoIdx % photos.length]} fallbackSrc={active.fallbackImage || '/images/backgrounds/congregacion.webp'} className="opacity-90" />
              : <PhotoImage src={photos[photoIdx % photos.length]} alt="" loading="eager" sizes="100vw" className="absolute inset-0 w-full h-full object-cover opacity-90" />)}
            {photoBackdrop && <div className="absolute inset-0 bg-bg/40" />}
          </div>
          <div className={`relative w-full ${mediaLayout ? 'max-w-[1160px]' : 'max-w-[780px]'} ${light ? 'glass-light' : 'liquid-glass'} rounded-[16px] flex flex-col overflow-hidden`} data-photo-window={mediaLayout || undefined} style={{ height: mediaLayout ? 'min(88svh, 800px)' : height, maxHeight: 'calc(100svh - 32px)' }}>
            <div className={`shrink-0 flex items-center justify-between gap-4 px-5 py-3 border-b ${light ? 'border-bg/10 text-bg' : 'border-white/15 text-white'}`}>
              {sobrepuesto ? (
                <button type="button" onClick={onCerrarSobrepuesto} className="min-w-0 [overflow-wrap:anywhere] text-13 font-bold focus-ring rounded-full min-h-11 px-2">Volver a {active.title}</button>
              ) : photoBackdrop ? <h2 className="min-w-0 [overflow-wrap:anywhere] text-26 font-bold tracking-tight">{active.title}</h2> : <p className="text-13 font-semibold truncate">{active.title}</p>}
              <button type="button" onClick={close} className={`shrink-0 rounded-full min-h-11 px-4 text-13 font-bold focus-ring ${light ? 'bg-bg/8' : 'bg-white/10'}`}>Cerrar</button>
            </div>
            {sobrepuesto ? (
              <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7" data-lenis-prevent>{sobrepuesto}</div>
            ) : (
              <>
                {!photoBackdrop && <div className="relative h-32 sm:h-40 shrink-0 bg-bg">
                  {photos.length > 0 && <PhotoImage key={photos[photoIdx % photos.length]} src={photos[photoIdx % photos.length]} alt="" loading="eager" sizes="(max-width: 640px) 100vw, 780px" className="absolute inset-0 w-full h-full object-cover" />}
                  <div className="scrim-card" />
                  <div className="absolute bottom-0 left-0 p-5 sm:p-6">
                    {active.badge && <p className="text-12 font-semibold text-white/80 mb-2">{active.badge}</p>}
                    <h2 className="text-26 sm:text-32 font-bold text-white tracking-tight leading-none">{active.title}</h2>
                  </div>
                  {photos.length > 1 && <div className="absolute top-2 right-2 flex gap-1">
                    {photos.map((_, i) => <button key={i} type="button" onClick={() => setPhotoIdx(i)} aria-current={i === photoIdx} className="liquid-glass rounded-full px-3 min-h-11 text-12 text-white focus-ring">Foto {i + 1}</button>)}
                  </div>}
                </div>}
                <div className={`flex-1 min-h-0 overflow-y-auto ${mediaLayout ? 'photo-window-body md:grid md:overflow-hidden md:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]' : ''}`} data-lenis-prevent>
                  {mediaLayout && <figure className="relative min-w-0 min-h-0 m-0 flex flex-col border-b md:border-b-0 md:border-r border-bg/10 bg-bg/10" aria-label="Fotografía ampliada">
                    <div className="photo-window-frame relative h-[34svh] md:h-auto md:flex-1 min-h-0">
                      <CrossfadePhoto src={photos[photoIdx]} fallbackSrc={active.fallbackImage || '/images/backgrounds/congregacion.webp'} fit="contain" alt={active.photoAlt || active.title} sizes="(max-width: 767px) 100vw, 760px" />
                    </div>
                    <figcaption className={`shrink-0 flex items-center justify-between flex-wrap gap-2 px-4 py-3 text-12 ${light ? 'text-bg' : 'text-white'}`}>
                      <span className="min-w-0 truncate">{active.title}</span>
                      {photos.length > 1 && <div className="flex items-center gap-2" aria-label="Fotografías" onKeyDown={event => {
                        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); setPhotoIdx(value => (value + (event.key === 'ArrowRight' ? 1 : -1) + photos.length) % photos.length); }
                      }}>
                        <button type="button" onClick={() => setPhotoIdx(value => (value - 1 + photos.length) % photos.length)} className="min-h-11 px-3 rounded-[8px] text-12 font-semibold focus-ring border border-current/20">Foto anterior</button>
                        <span className="shrink-0 text-12" role="status">{photoIdx + 1} de {photos.length}</span>
                        <button type="button" onClick={() => setPhotoIdx(value => (value + 1) % photos.length)} className="min-h-11 px-3 rounded-[8px] text-12 font-semibold focus-ring border border-current/20">Foto siguiente</button>
                      </div>}
                    </figcaption>
                  </figure>}
                  <div className={`min-w-0 p-5 sm:p-6 ${mediaLayout ? 'md:overflow-y-auto' : ''}`} data-lenis-prevent>
                    {animated ? <motion.div key={contentKey || active.key} className="w-full" initial={{ opacity: reducedMotion ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: reducedMotion ? 0 : DUR.base, ease: EASE_OUT }}>{renderContent(active, { photoIndex: photoIdx, photoCount: photos.length })}</motion.div> : <div className="w-full">{renderContent(active, { photoIndex: photoIdx, photoCount: photos.length })}</div>}
                  </div>
                </div>
                {items.length > 1 && <div className={`collection-controls shrink-0 flex items-center justify-between gap-3 px-4 py-2 border-t ${light ? 'border-bg/10 text-bg' : 'border-white/15 text-white'}`}>
                  <button type="button" onClick={() => go(-1)} className="min-h-11 min-w-0 flex-1 px-3 rounded-[8px] text-left text-13 font-bold focus-ring">Anterior{neighborTitles && <span className="block truncate text-11 font-normal opacity-70">{items[(index - 1 + items.length) % items.length].title}</span>}</button>
                  <span className="shrink-0 text-12 opacity-70" role="status">{index + 1} / {items.length}</span>
                  <button ref={nextRef} type="button" onClick={() => go(1)} className="min-h-11 min-w-0 flex-1 px-3 rounded-[8px] text-right text-13 font-bold focus-ring">Siguiente{neighborTitles && <span className="block truncate text-11 font-normal opacity-70">{items[(index + 1) % items.length].title}</span>}</button>
                </div>}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>, document.body
  );
}
