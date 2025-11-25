import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const GalleryGrid = () => {
  const { data: photos = [], isLoading, isError } = useQuery({
    queryKey: ['instagram-feed'],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/instagram/feed`);
      
      if (!response.ok) {
        throw new Error('Error al cargar el feed de Instagram');
      }
      
      return response.json();
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
    retry: 2
  });

  // Skeleton Loader
  const SkeletonCard = () => (
    <div className="border border-gray-200/50 dark:border-gray-800/50 overflow-hidden rounded-lg transition-colors">
      <div className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse transition-colors"></div>
    </div>
  );

  if (isError) {
    return (
      <section className="py-16 sm:py-24 bg-white dark:bg-gray-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-dark-text dark:text-white mb-6 tracking-tight transition-colors">
              Nuestra Galería
            </h2>
            <p className="text-lg md:text-xl font-normal text-dark-text/70 dark:text-gray-400 max-w-3xl mx-auto transition-colors">
              Momentos especiales de nuestra comunidad
            </p>
          </div>
          <div className="text-center py-12">
            <p className="text-dark-text/60 dark:text-gray-500 transition-colors text-sm">No se pudo cargar la galería. Intenta de nuevo más tarde.</p>
          </div>
        </div>
      </section>
    );
  }

  // Limitar a 6 fotos como en el diseño original
  const displayPhotos = photos.slice(0, 6);

  return (
    <section id="galeria" className="py-24 sm:py-32 bg-white dark:bg-gray-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-dark-text dark:text-white mb-4 tracking-tight transition-colors">
            Nuestra Galería
          </h2>
          <p className="text-base md:text-lg font-normal text-dark-text/70 dark:text-gray-400 max-w-2xl mx-auto transition-colors">
            Momentos especiales de nuestra comunidad
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Mostrar 6 skeletons mientras carga
            Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))
          ) : displayPhotos.length > 0 ? (
            displayPhotos.map((photo, index) => (
              <motion.a
                key={photo.id}
                href={photo.permalink || photo.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="relative group cursor-pointer overflow-hidden border border-gray-200/50 dark:border-gray-800/50 hover:border-accent-blue/50 dark:hover:border-accent-blue/50 rounded-xl transition-all duration-300 hover:shadow-lg"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={photo.media_url || photo.image_url}
                    alt={photo.caption || 'Foto de Instagram'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col items-center justify-center">
                  <ArrowTopRightOnSquareIcon className="w-8 h-8 text-white mb-3" />
                  <p className="text-white font-semibold text-xs uppercase tracking-wide text-center px-6 line-clamp-2">
                    {photo.caption || 'Ver en Instagram'}
                  </p>
                </div>
              </motion.a>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-dark-text/60 dark:text-gray-500 text-sm transition-colors">
                No hay fotos disponibles en este momento
              </p>
            </div>
          )}
        </div>

        {photos.length > 6 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-12"
          >
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm uppercase tracking-widest rounded-lg hover:from-purple-700 hover:to-pink-700 hover:shadow-lg transition-all duration-300"
            >
              Ver más en Instagram
              <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-2" />
            </a>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default GalleryGrid;
