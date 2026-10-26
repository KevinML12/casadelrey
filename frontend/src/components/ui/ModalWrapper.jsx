// ============================================================
//  ModalWrapper — modal glass-light compartido (Voluntariado, Células).
//  Cerrar vive FUERA del contenido scrolleable a propósito: reportado
//  por el usuario en EventsPage -- la X adentro del área con
//  overflow-y-auto desaparecía al hacer scroll dentro del modal.
// ============================================================
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

export default function ModalWrapper({ children, onClose, ariaLabel = 'Formulario' }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const root = document.getElementById('root');
    const previousInert = root?.inert;
    document.body.style.overflow = 'hidden';
    if (root) root.inert = true;
    const dialog = dialogRef.current;
    const focusable = () => [...dialog.querySelectorAll('button, input, select, textarea, a[href], [tabindex]')]
      .filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length > 0);
    (focusable()[0] || dialog).focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current?.(); }
      if (event.key === 'Tab') {
        const elements = focusable();
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (!first) { event.preventDefault(); dialog.focus(); }
        else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
          event.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (root) root.inert = previousInert;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);
  return createPortal(
    <motion.div
      className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        ref={dialogRef} role="dialog" aria-modal="true" aria-label={ariaLabel} tabIndex={-1}
        className="relative w-full max-w-md max-h-[90vh]"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      >
        <div
          className="glass-light w-full h-full max-h-[90vh] p-6 overflow-y-auto rounded-[32px] text-bg"
          data-lenis-prevent
        >
          {children}
        </div>
        <button
          type="button" onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-bg text-white shadow-card flex items-center justify-center hover:opacity-85 transition-opacity text-18 leading-none"
        >
          ×
        </button>
      </motion.div>
    </motion.div>, document.body
  );
}
