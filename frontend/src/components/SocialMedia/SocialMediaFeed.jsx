import { motion } from 'framer-motion';
import GalleryGrid from './GalleryGrid';
import YouTubeFeatured from './YouTubeFeatured';

/**
 * SocialMediaFeed - Componente contenedor para integración de redes sociales
 * 
 * Este componente orquesta la visualización de contenido de redes sociales:
 * - YouTube: Video destacado más reciente
 * - Instagram: Galería de fotos del feed
 * 
 * Puede ser usado en diferentes partes de la aplicación para mostrar
 * contenido social de manera consistente.
 */
const SocialMediaFeed = ({ showYouTube = true, showInstagram = true }) => {
  return (
    <div className="space-y-16">
      {showYouTube && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="container mx-auto px-4">
            <YouTubeFeatured />
          </div>
        </motion.section>
      )}

      {showInstagram && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <GalleryGrid />
        </motion.section>
      )}
    </div>
  );
};

export default SocialMediaFeed;
