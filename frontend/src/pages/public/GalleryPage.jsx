import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../lib/apiClient';
import { Icon, Eyebrow } from '../../components/ui/Glass';
import Reveal, { RevealList, RevealItem } from '../../components/ui/Reveal';
import Tilt from '../../components/ui/Tilt';
import ParallaxImg from '../../components/ui/ParallaxImg';

export default function GalleryPage() {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12);

  // Agrupar fotos de la galería por álbum (nombre de la carpeta extraído del título)
  const albums = useMemo(() => {
    const grouped = {};
    gallery.forEach(photo => {
      let albumName = "Otros";
      if (photo.title && photo.title.includes(" - ")) {
        albumName = photo.title.split(" - ")[0].trim();
      }
      if (!grouped[albumName]) grouped[albumName] = [];
      grouped[albumName].push(photo);
    });
    return grouped;
  }, [gallery]);

  useEffect(() => {
    apiClient.get('/gallery/')
      .then(res => setGallery(res.data?.data || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-[100svh] bg-bg flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
    </div>
  );

  return (
    <main className="min-h-[100svh] bg-bg relative overflow-hidden flex flex-col">
      <ParallaxImg src="/images/bg-eventos.jpg" alt="Galería" className="opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/40" />

      <Reveal className="relative z-10 pt-32 pb-12 px-6 max-w-6xl mx-auto w-full text-center flex flex-col items-center">
        <Eyebrow>Momentos vivos</Eyebrow>
        <h1 className="display-mega text-white mb-4 mt-4" style={{ fontSize: 'clamp(3rem, 8vw, 5rem)' }}>GALERÍA</h1>
        <p className="text-[18px] text-white/70 max-w-2xl mx-auto font-medium mb-10">
          Momentos capturados de lo que Dios está haciendo en nuestra casa.
        </p>
      </Reveal>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-32 w-full flex-1">
        {gallery.length === 0 ? (
          <div className="py-32 flex flex-col items-center gap-5">
            <p className="font-bold leading-[1.05] tracking-[-0.02em] text-center whitespace-pre-line text-white/50"
              style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
              {'Sin fotos\npublicadas aún.'}
            </p>
          </div>
        ) : (
          <RevealList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.entries(albums).map(([albumName, photos]) => (
              <RevealItem key={albumName}>
              <Tilt
                max={5}
                onClick={() => { setSelectedAlbum({ name: albumName, photos }); setVisibleCount(12); }}
                className="w-full aspect-[3/4] rounded-[24px] overflow-hidden relative group cursor-pointer liquid-glass hover:border-white/25"
              >
                <img src={photos[0].url} alt={albumName} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/20 to-transparent" />

                <div className="absolute bottom-5 inset-x-5 flex justify-between items-end">
                  <div>
                    <p className="text-white font-bold text-[18px] leading-tight line-clamp-1">{albumName}</p>
                    <p className="text-white/60 text-[13px] font-medium mt-1">{photos.length} fotografías</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 group-hover:text-white group-hover:bg-white/20 transition-all shrink-0 backdrop-blur-md">
                    <Icon name="arrow" className="w-4 h-4" />
                  </div>
                </div>
              </Tilt>
              </RevealItem>
            ))}
          </RevealList>
        )}
      </div>

      {/* Album Modal (Ventana emergente de la Galería) */}
      <AnimatePresence>
        {selectedAlbum && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          >
            {/* Fondo desenfocado */}
            <div className="absolute inset-0 bg-bg/90 backdrop-blur-xl" onClick={() => setSelectedAlbum(null)} />
            
            {/* Contenedor principal del modal */}
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative w-full max-w-6xl max-h-[90vh] liquid-glass rounded-[32px] overflow-hidden flex flex-col"
            >
              {/* Encabezado fijo */}
              <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedAlbum.name}</h3>
                  <p className="text-white/50 text-sm font-medium">{selectedAlbum.photos.length} fotografías</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setSelectedAlbum(null)}
                  className="w-11 h-11 rounded-full liquid-glass flex items-center justify-center text-white/70 hover:text-white"
                >
                  <Icon name="close" className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Cuadrícula de fotos con scroll */}
              <div className="p-8 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                <RevealList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  {selectedAlbum.photos.slice(0, visibleCount).map((photo, idx) => (
                    <RevealItem key={photo.ID}>
                    <Tilt max={6} className="rounded-[16px] overflow-hidden aspect-[4/5] relative group liquid-glass block">
                      <img src={photo.url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Icon name="search" className="w-6 h-6 text-white" />
                      </div>
                    </Tilt>
                    </RevealItem>
                  ))}
                </RevealList>

                {/* Botón Cargar Más */}
                {visibleCount < selectedAlbum.photos.length && (
                  <div className="flex justify-center mt-10">
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.94 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      onClick={() => setVisibleCount(prev => prev + 12)}
                      className="px-8 py-3.5 rounded-pill liquid-glass text-white font-bold flex items-center gap-2"
                    >
                      Cargar más fotos
                      <Icon name="arrow" className="w-4 h-4" stroke={2} />
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
