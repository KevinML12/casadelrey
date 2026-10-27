// ============================================================
//  ModalWrapper — modal glass-light compartido (Voluntariado, Células).
//  Cerrar vive FUERA del contenido scrolleable a propósito: reportado
//  por el usuario en EventsPage -- la X adentro del área con
//  overflow-y-auto desaparecía al hacer scroll dentro del modal.
// ============================================================
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { DUR, EASE_OUT } from '../../lib/motion';
import { lockDialogBackground, restoreParentDialogFocus } from '../../lib/dialogBackground';

export default function ModalWrapper({ children, onClose, ariaLabel = 'Formulario' }) {
  const reducedMotion = useReducedMotion();
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const releaseBackground = lockDialogBackground();
    const dialog = dialogRef.current;
    const focusable = () => [...dialog.querySelectorAll('button, input, select, textarea, a[href], [tabindex]')]
      .filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length > 0);
    (focusable()[0] || dialog).focus();
    const onKeyDown = (event) => {
      if ([...document.querySelectorAll('[role="dialog"]')].at(-1) !== dialog) return;
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current?.(); }
      if (event.key === 'Tab') {
        const elements = focusable();
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (!first) { event.preventDefault(); dialog.focus(); }
        else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement) || document.activeElement === dialog)) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement) || document.activeElement === dialog)) {
          event.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      releaseBackground();
      restoreParentDialogFocus(previousFocus);
    };
  }, []);
  return createPortal(
    <motion.div
      className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : DUR.base }}
    >
      <motion.div
        ref={dialogRef} role="dialog" aria-modal="true" aria-label={ariaLabel} tabIndex={-1}
        className="glass-light relative w-full max-w-md max-h-[calc(100svh-32px)] rounded-[16px] flex flex-col overflow-hidden text-bg [overflow-wrap:anywhere]"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reducedMotion ? 0 : DUR.base, ease: EASE_OUT }}
      >
        <div className="shrink-0 flex justify-end px-4 py-2 border-b border-bg/10">
          <button type="button" onClick={onClose} className="min-h-11 px-4 rounded-[8px] bg-bg/8 text-13 font-bold focus-ring">Cerrar</button>
        </div>
        <div className="min-h-0 overflow-y-auto p-6" data-lenis-prevent>
          {children}
        </div>
      </motion.div>
    </motion.div>, document.body
  );
}
