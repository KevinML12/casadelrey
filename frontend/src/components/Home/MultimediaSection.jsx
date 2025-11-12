import { motion } from 'framer-motion';
import { PlayCircleIcon, PhotoIcon } from '@heroicons/react/24/outline';

const MultimediaSection = () => {
  const videos = [
    {
      id: 1,
      title: 'Último Servicio Dominical',
      thumbnail: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=600&h=400&fit=crop',
      duration: '1:45:00'
    },
    {
      id: 2,
      title: 'Testimonio: Una Vida Transformada',
      thumbnail: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=400&fit=crop',
      duration: '12:30'
    },
    {
      id: 3,
      title: 'Alabanza y Adoración en Vivo',
      thumbnail: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=400&fit=crop',
      duration: '25:15'
    }
  ];

  const gallery = [
    'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=300&fit=crop'
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Multimedia
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explora nuestros servicios, testimonios y momentos especiales
          </p>
        </motion.div>

        {/* Videos Section */}
        <div className="mb-16">
          <motion.h3
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl font-bold text-gray-900 mb-6 flex items-center"
          >
            <PlayCircleIcon className="h-8 w-8 mr-2 text-blue-600" />
            Videos Recientes
          </motion.h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {videos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="relative rounded-lg overflow-hidden shadow-lg">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                    <PlayCircleIcon className="h-16 w-16 text-white opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                </div>
                <h4 className="mt-3 font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {video.title}
                </h4>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Gallery Section */}
        <div>
          <motion.h3
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl font-bold text-gray-900 mb-6 flex items-center"
          >
            <PhotoIcon className="h-8 w-8 mr-2 text-blue-600" />
            Galería de Fotos
          </motion.h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gallery.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="aspect-square rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
              >
                <img
                  src={image}
                  alt={`Galería ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MultimediaSection;
