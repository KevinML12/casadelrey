import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { SiteConfigProvider } from './context/SiteConfigContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { Toaster } from 'react-hot-toast';

export default function App() {
  useEffect(() => {
    // Inicializar tema desde localStorage o preferencia del sistema
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <SiteConfigProvider>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-bg-light dark:bg-dark-bg text-text-primary dark:text-dark-text-primary transition-colors duration-200">
          <Header />
          <main className="flex-1 w-full py-8">
            <div className="container mx-auto">
              <Outlet />
            </div>
          </main>
          <Footer />
        </div>
        <Toaster position="bottom-right" />
      </AuthProvider>
    </SiteConfigProvider>
  );
}
