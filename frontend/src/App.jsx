import { Toaster } from 'react-hot-toast';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { SiteConfigProvider } from './context/SiteConfigContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import useDarkMode from './hooks/useDarkMode';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

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

function AppShell() {
  useDarkMode(); // inicializa clase `dark` en <html> desde localStorage
  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink">
      <Header />
      <main className="flex-1 w-full">
        <PageWrapper />
      </main>
      <Footer />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--card)',
            color: 'var(--ink)',
            border: '1px solid var(--line)',
            borderRadius: '10px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
          },
          success: { iconTheme: { primary: '#10B981', secondary: 'white' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: 'white' } },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SiteConfigProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </SiteConfigProvider>
    </QueryClientProvider>
  );
}
