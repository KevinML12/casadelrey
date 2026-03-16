import { createContext, useContext } from 'react';

const SiteConfigContext = createContext(null);

const config = {
  appId:           import.meta.env.VITE_APP_ID           || 'casa-del-rey',
  appTitle:        import.meta.env.VITE_APP_TITLE         || 'Casa del Rey',
  apiUrl:          import.meta.env.VITE_API_URL           || 'http://localhost:8080/api/v1',
  stripePublicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY || '',
};

export function SiteConfigProvider({ children }) {
  return <SiteConfigContext.Provider value={config}>{children}</SiteConfigContext.Provider>;
}

export const useSiteConfig = () => useContext(SiteConfigContext);
