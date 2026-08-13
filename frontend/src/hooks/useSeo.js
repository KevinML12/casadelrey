import { useEffect } from 'react';

/**
 * Hook para inyectar dinámicamente el título y la meta descripción de la página
 * sin depender de React Helmet u otras librerías pesadas. 
 * Esto mejora la accesibilidad, usabilidad (pestañas con nombres claros) 
 * y provee una base de SEO estático en el DOM.
 * 
 * @param {string} title Título de la página (ej: "Galería | Casa del Rey")
 * @param {string} description Descripción corta para la meta etiqueta
 */
export default function useSeo(title, description) {
  useEffect(() => {
    // 1. Actualizar el título de la pestaña
    const previousTitle = document.title;
    if (title) {
      document.title = title.includes('Casa del Rey') ? title : `${title} | Casa del Rey`;
    }

    // 2. Actualizar el meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    let previousDescription = '';
    
    if (description) {
      if (metaDescription) {
        previousDescription = metaDescription.getAttribute('content');
        metaDescription.setAttribute('content', description);
      } else {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        metaDescription.content = description;
        document.head.appendChild(metaDescription);
      }
    }

    // Cleanup: restaurar al desmontar para evitar que la descripción de una página
    // se quede pegada cuando el usuario navega de vuelta al Home (que usa el index.html original).
    return () => {
      document.title = previousTitle;
      if (description && metaDescription) {
        metaDescription.setAttribute('content', previousDescription);
      }
    };
  }, [title, description]);
}
