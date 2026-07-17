import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SiteConfigProvider } from './context/SiteConfigContext';
import useDarkMode from './hooks/useDarkMode';
import { router } from './router';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

// Tras un deploy a Vercel, los chunks lazy (rutas admin/leader/volunteer)
// cambian de hash. Una pestaña abierta desde antes del deploy intenta pedir
// un archivo que ya no existe → "Failed to fetch dynamically imported
// module". Vite dispara este evento en ese caso; recargamos para traer el
// build nuevo (sessionStorage evita loop si el fallo es de red real).
window.addEventListener('vite:preloadError', () => {
  const key = 'vite-reload-on-preload-error';
  const last = Number(sessionStorage.getItem(key) || 0);
  if (Date.now() - last < 10_000) return; // ya recargamos hace poco, evita loop si el fallo persiste
  sessionStorage.setItem(key, String(Date.now()));
  window.location.reload();
});

// Wrapper global: inicializa dark mode y monta el router con todos los providers.
function AppRoot() {
  useDarkMode();
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--card)',
            color: 'var(--ink)',
            border: '1px solid var(--line)',
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10B981', secondary: 'white' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: 'white' } },
        }}
      />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SiteConfigProvider>
        <AuthProvider>
          {/* reducedMotion="user": framer desactiva transforms si el SO lo pide */}
          <MotionConfig reducedMotion="user">
            <AppRoot />
          </MotionConfig>
        </AuthProvider>
      </SiteConfigProvider>
    </QueryClientProvider>
  </StrictMode>,
);
