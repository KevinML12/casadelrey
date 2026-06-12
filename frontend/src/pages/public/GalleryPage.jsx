import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import PageHero from '../../components/layout/PageHero';
import Paginator from '../../components/ui/Paginator';
import { Icon, Halos } from '../../components/ui/Glass';

export default function GalleryPage() {
  const [photos,   setPhotos]   = useState([]);
  const [meta,     setMeta]     = useState(null);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
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
    <main className="min-h-screen bg-bg text-ink">
      <PageHero
        icon="photo_library"
        eyebrow="GalerÃ­a"
        title="Momentos vivos."
        subtitle="Lo que pasa cuando una generaciÃ³n se reÃºne con luces encendidas."
      />

      <section className="relative py-16 md:py-24 overflow-hidden">
        <Halos variant="soft" />
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 rounded-full border-2 border-ink-soft border-t-celeste animate-spin" />
            </div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center py-24 gap-5 text-center">
              <span className="text-celeste text-[11px] font-extrabold uppercase tracking-widest">GalerÃ­a</span>
              <h2 className="display-mega text-ink" style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)' }}>
                No hay fotos aÃºn.
              </h2>
              <p className="text-[15.5px] text-ink-2">Pronto subiremos los mejores momentos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photos.map(p => (
                <button
                  key={p.ID}
                  onClick={() => setSelected(p)}
                  className="group relative rounded-card overflow-hidden glass aspect-square focus-ring"
                >
                  <img
                    src={p.thumbnail_url || p.url}
                    alt={p.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={e => { e.target.src = 'https://placehold.co/400x400/06102A/3FA9FF?text=Foto'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {p.title && (
                    <div className="absolute left-3 right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[12.5px] font-extrabold tracking-tightish text-ink line-clamp-1">{p.title}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          <Paginator meta={meta} onPage={p => { setPage(p); window.scrollTo(0, 0); }} />
        </div>
      </section>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-md"
          onClick={() => setSelected(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <img
              src={selected.url}
              alt={selected.title}
              className="w-full rounded-card max-h-[80vh] object-contain"
              onError={e => { e.target.src = 'https://placehold.co/800x600/06102A/3FA9FF?text=Foto'; }}
            />
            {(selected.title || selected.description) && (
              <div className="mt-5 text-center">
                {selected.title && (
                  <p className="display-mega text-ink" style={{ fontSize: '1.4rem' }}>{selected.title}</p>
                )}
                {selected.description && (
                  <p className="text-[14px] text-ink-2 mt-2">{selected.description}</p>
                )}
              </div>
            )}
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 grid place-items-center w-10 h-10 rounded-full glass text-ink hover:bg-white/15 transition-colors focus-ring"
              aria-label="Cerrar"
            >
              <Icon name="close" className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
