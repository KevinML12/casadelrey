// ============================================================
//  ModalWrapper — modal glass-light compartido (Voluntariado, Células).
//  Cerrar vive FUERA del contenido scrolleable a propósito: reportado
//  por el usuario en EventsPage -- la X adentro del área con
//  overflow-y-auto desaparecía al hacer scroll dentro del modal.
// ============================================================
import { motion } from 'framer-motion';

export default function ModalWrapper({ children, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
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
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-bg text-white shadow-card flex items-center justify-center hover:opacity-85 transition-opacity text-18 leading-none"
        >
          ×
        </button>
      </motion.div>
    </motion.div>
  );
}
