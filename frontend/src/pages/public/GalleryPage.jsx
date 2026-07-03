import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHero from '../../components/layout/PageHero';
import apiClient from '../../lib/apiClient';
import { Halos } from '../../components/ui/Glass';

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
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-white/5 rounded-full mix-blend-screen filter blur-[150px] opacity-40 animate-blob" />
      <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-white/5 rounded-full mix-blend-screen filter blur-[150px] opacity-30 animate-blob" style={{ animationDelay: '2s' }} />
      <img src="/images/bg-eventos.jpg" alt="Galería" className="absolute inset-0 w-full h-full object-cover opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-bg/40" />

      <div className="relative z-10 pt-32 pb-12 px-6 max-w-6xl mx-auto w-full text-center flex flex-col items-center">
        <h1 className="display-mega text-white mb-4" style={{ fontSize: 'clamp(3rem, 8vw, 5rem)' }}>GALERÍA</h1>
        <p className="text-[18px] text-white/70 max-w-2xl mx-auto font-medium mb-10">
          Momentos capturados de lo que Dios está haciendo en nuestra casa. 
        </p>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-32 w-full flex-1">
        {gallery.length === 0 ? (
          <div className="py-32 flex flex-col items-center gap-5">
            <p className="font-mono text-[11px] tracking-[2px] text-white/40 uppercase">Álbumes</p>
            <p className="font-bold leading-[1.05] tracking-[-0.02em] text-center whitespace-pre-line text-white/50"
              style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
              {'Sin fotos\npublicadas aún.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.entries(albums).map(([albumName, photos]) => (
              <div 
                key={albumName} 
                onClick={() => { setSelectedAlbum({ name: albumName, photos }); setVisibleCount(12); }}
                className="w-full aspect-[3/4] rounded-[32px] overflow-hidden relative group shadow-2xl cursor-pointer border border-white/5 hover:border-white/20 transition-all duration-500"
              >
                {/* Cover image */}
                <img src={photos[0].url} alt={albumName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                
                {/* Gradiente sutil para texto */}
                <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/20 to-transparent opacity-90" />

                {/* Panel flotante Liquid Glass */}
                <div className="absolute bottom-5 inset-x-5 flex flex-col justify-end">
                  <div className="liquid-glass bg-white/10 border border-white/20 backdrop-blur-md p-5 rounded-[24px] transform translate-y-2 group-hover:translate-y-0 transition-all duration-500 flex justify-between items-center shadow-lg">
                    <div>
                      <p className="text-white font-bold text-[20px] leading-tight line-clamp-1">{albumName}</p>
                      <p className="text-white/60 text-[13px] font-medium mt-1">{photos.length} fotografías</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 group-hover:text-white group-hover:bg-white/20 transition-all shrink-0">
                      <span className="material-symbols-rounded">arrow_forward</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
              className="relative w-full max-w-6xl max-h-[90vh] liquid-glass bg-white/5 border border-white/10 rounded-[32px] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Encabezado fijo */}
              <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedAlbum.name}</h3>
                  <p className="text-white/50 text-sm font-medium">{selectedAlbum.photos.length} fotografías</p>
                </div>
                <button
                  onClick={() => setSelectedAlbum(null)}
                  className="w-12 h-12 rounded-full liquid-glass bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <span className="material-symbols-rounded">close</span>
                </button>
              </div>
              
              {/* Cuadrícula de fotos con scroll */}
              <div className="p-8 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  {selectedAlbum.photos.slice(0, visibleCount).map((photo, idx) => (
                    <div key={photo.ID} className="rounded-[20px] overflow-hidden aspect-[4/5] relative group bg-black/20 shadow-lg border border-white/5">
                      <img src={photo.url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="material-symbols-rounded text-white text-3xl">zoom_in</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Botón Cargar Más */}
                {visibleCount < selectedAlbum.photos.length && (
                  <div className="flex justify-center mt-10">
                    <button 
                      onClick={() => setVisibleCount(prev => prev + 12)}
                      className="px-8 py-3 rounded-full liquid-glass bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors flex items-center gap-2 btn-spring"
                    >
                      <span className="material-symbols-rounded text-[18px]">add</span>
                      Cargar más fotos
                    </button>
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
