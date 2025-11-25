import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';

const SiteConfigContext = createContext(null);

export const SiteConfigProvider = ({ children }) => {
  const { data: config, isLoading, isError, error } = useQuery({
    queryKey: ['site-config'],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/site/config`);

      if (!response.ok) {
        throw new Error('Error al cargar la configuración del sitio');
      }

      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - la configuración no cambia frecuentemente
    cacheTime: 30 * 60 * 1000, // 30 minutos en cache
    retry: 2,
    refetchOnWindowFocus: false
  });

  // Configuración por defecto mientras se carga o si hay error
  const defaultConfig = {
    facebook_url: '',
    instagram_url: '',
    youtube_url: '',
    twitter_url: '',
    address: '',
    phone: '',
    email: '',
    church_name: 'Casa del Rey',
    description: '',
    logo_url: ''
  };

  const value = {
    config: config || defaultConfig,
    isLoading,
    isError,
    error
  };

  return (
    <SiteConfigContext.Provider value={value}>
      {children}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfig = () => {
  const context = useContext(SiteConfigContext);
  if (!context) {
    throw new Error('useSiteConfig debe ser usado dentro de un SiteConfigProvider');
  }
  return context;
};

export default SiteConfigContext;
