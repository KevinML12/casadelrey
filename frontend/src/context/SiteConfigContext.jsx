import { createContext, useState, useContext, useEffect } from 'react';

export const SiteConfigContext = createContext();

export function SiteConfigProvider({ children }) {
  const [config, setConfig] = useState({
    appId: import.meta.env.VITE_APP_ID || 'casa-del-rey',
    appTitle: import.meta.env.VITE_APP_TITLE || 'Casa del Rey',
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
    stripePublicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY || '',
  });

  useEffect(() => {
    // Aquí puedes cargar configuración desde un endpoint si es necesario
    console.log('App Config loaded:', config);
  }, [config]);

  return (
    <SiteConfigContext.Provider value={config}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  const context = useContext(SiteConfigContext);
  if (!context) {
    throw new Error('useSiteConfig debe ser usado dentro de SiteConfigProvider');
  }
  return context;
}
