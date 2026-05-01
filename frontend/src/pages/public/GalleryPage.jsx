import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import PageHero from '../../components/layout/PageHero';
import Paginator from '../../components/ui/Paginator';

export default function GalleryPage() {
  const [photos,  setPhotos]  = useState([]);
  const [meta,    setMeta]    = useState(null);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = (p) => {
    setLoading(true);
    apiClient.get(`/gallery/?page=${p}&limit=24`)
      .then(r => { setPhotos(r.data.data || []); setMeta(r.data.meta); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(page); }, [page]);

  return (
    <div className="min-h-screen">
      <PageHero title="Galería" subtitle="Momentos especiales de nuestra comunidad" icon="photo_library" />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-4 text-on-surf-var">
            <span className="ms" style={{ fontSize: 56 }}>photo_library</span>
            <p className="text-body-l text-on-surf font-medium">No hay fotos aún</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map(p => (
              <button
                key={p.ID}
                onClick={() => setSelected(p)}
                className="group relative rounded-xl overflow-hidden bg-surf-low border border-outline-var aspect-square hover:shadow-lg transition-shadow"
              >
                <img
                  src={p.thumbnail_url || p.url}
                  alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => { e.target.src = 'https://placehold.co/200x200?text=Foto'; }}
                />
                {p.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-sm text-white font-medium line-clamp-1">{p.title}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <Paginator meta={meta} onPage={p => { setPage(p); window.scrollTo(0, 0); }} />
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <img
              src={selected.url}
              alt={selected.title}
              className="w-full rounded-2xl max-h-[80vh] object-contain"
              onError={e => { e.target.src = 'https://placehold.co/600x400?text=Foto'; }}
            />
            {(selected.title || selected.description) && (
              <div className="mt-4 text-center text-white">
                {selected.title && <p className="text-lg font-semibold">{selected.title}</p>}
                {selected.description && <p className="text-sm opacity-80 mt-1">{selected.description}</p>}
              </div>
            )}
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <span className="ms" style={{ fontSize: 18 }}>close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
