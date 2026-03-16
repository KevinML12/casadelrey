import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

function PageWrapper() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}

// Shell público: Header + contenido animado + Footer.
// Solo se usa para rutas públicas. El panel admin tiene su propio layout.
export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink">
      <Header />
      <main className="flex-1 w-full">
        <PageWrapper />
      </main>
      <Footer />
    </div>
  );
}
