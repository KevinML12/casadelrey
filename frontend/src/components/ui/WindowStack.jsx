import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PhotoImage from './PhotoImage';

const FOCUSABLE = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Shared flat glass dialog. Previous/next changes the content in the same
// plane. The legacy name remains so existing page integrations stay intact.
export default function WindowStack({ items, openKey, onChange, renderContent, height = 'min(80svh, 640px)', light = false, sobrepuesto = null, onCerrarSobrepuesto }) {
  const dialogRef = useRef(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const active = items.find(it => it.key === openKey);
  const index = items.findIndex(it => it.key === openKey);
  const photos = active?.images?.length ? active.images : active?.image ? [active.image] : [];
  const close = () => sobrepuesto ? onCerrarSobrepuesto?.() : onChange(null);
  const go = direction => onChange(items[(index + direction + items.length) % items.length].key);

  useEffect(() => { setPhotoIdx(0); }, [openKey]);
  const actions = useRef({ close, go });
  useEffect(() => { actions.current = { close, go }; });

  useEffect(() => {
    if (!openKey) return;
    const previousFocus = document.activeElement;
    const root = document.getElementById('root');
    const previousInert = root?.inert;
    const previousOverflow = document.body.style.overflow;
    if (root) root.inert = true;
    document.body.style.overflow = 'hidden';
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
        else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      const editing = event.target.matches('input, textarea, select, [contenteditable="true"]');
      if (!sobrepuesto && !editing && items.length > 1) {
        if (event.key === 'ArrowRight') { event.preventDefault(); actions.current.go(1); }
        if (event.key === 'ArrowLeft') { event.preventDefault(); actions.current.go(-1); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      if (root) root.inert = previousInert;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [openKey, sobrepuesto, items.length]);

  return createPortal(
    <AnimatePresence>
      {active && (
        <motion.div
          ref={dialogRef} role="dialog" aria-modal="true" aria-label={active.title} tabIndex={-1}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 outline-none"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
        >
          <div className="absolute inset-0 bg-bg/65 backdrop-blur-lg" onClick={close} />
          <div className={`relative w-full max-w-[780px] ${light ? 'glass-light' : 'liquid-glass'} rounded-[28px] flex flex-col overflow-hidden`} style={{ height, maxHeight: 'calc(100svh - 48px)' }}>
            <div className={`shrink-0 flex items-center justify-between gap-4 px-5 py-3 border-b ${light ? 'border-bg/10 text-bg' : 'border-white/15 text-white'}`}>
              {sobrepuesto ? (
                <button type="button" onClick={onCerrarSobrepuesto} className="text-13 font-bold focus-ring rounded-full min-h-11 px-2">Volver a {active.title}</button>
              ) : <p className="text-13 font-semibold truncate">{active.title}</p>}
              <button type="button" onClick={close} className={`shrink-0 rounded-full min-h-11 px-4 text-13 font-bold focus-ring ${light ? 'bg-bg/8' : 'bg-white/10'}`}>Cerrar</button>
            </div>
            {sobrepuesto ? (
              <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7" data-lenis-prevent>{sobrepuesto}</div>
            ) : (
              <>
                <div className="relative h-32 sm:h-40 shrink-0 bg-bg">
                  {photos.length > 0 && <PhotoImage key={photos[photoIdx % photos.length]} src={photos[photoIdx % photos.length]} alt="" loading="eager" sizes="(max-width: 640px) 100vw, 780px" className="absolute inset-0 w-full h-full object-cover" />}
                  <div className="scrim-card" />
                  <div className="absolute bottom-0 left-0 p-5 sm:p-6">
                    {active.badge && <p className="text-12 font-semibold text-white/80 mb-2">{active.badge}</p>}
                    <h2 className="text-26 sm:text-32 font-bold text-white tracking-tight leading-none">{active.title}</h2>
                  </div>
                  {photos.length > 1 && <div className="absolute top-2 right-2 flex gap-1">
                    {photos.map((_, i) => <button key={i} type="button" onClick={() => setPhotoIdx(i)} aria-current={i === photoIdx} className="liquid-glass rounded-full px-3 min-h-11 text-12 text-white focus-ring">Foto {i + 1}</button>)}
                  </div>}
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 flex flex-col" data-lenis-prevent>
                  <div className="m-auto w-full">{renderContent(active)}</div>
                </div>
                {items.length > 1 && <div className={`shrink-0 flex items-center justify-between gap-3 px-4 py-2 border-t ${light ? 'border-bg/10 text-bg' : 'border-white/15 text-white'}`}>
                  <button type="button" onClick={() => go(-1)} className="min-h-11 px-3 rounded-full text-13 font-bold focus-ring">Anterior</button>
                  <span className="text-12 opacity-70">{index + 1} / {items.length}</span>
                  <button type="button" onClick={() => go(1)} className="min-h-11 px-3 rounded-full text-13 font-bold focus-ring">Siguiente</button>
                </div>}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>, document.body
  );
}
