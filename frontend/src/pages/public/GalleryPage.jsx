import PhotoImage from '../../components/ui/PhotoImage';
import CollectionStatus from '../../components/ui/CollectionStatus';
// ============================================================
//  GalleryPage — hero de fondo + álbumes como recortes de cristal en
//  COLLAGE. Al abrir un álbum, sus fotos aparecen en una VENTANA
//  sobrepuesta (WindowStack); los demás álbumes asoman apilados detrás
//  y se salta entre ellos. Lenguaje de diseño: docs/DISENO_LIQUID_GLASS.md
// ============================================================
import { useEffect, useState, useMemo } from 'react';
import apiClient from '../../lib/apiClient';
import { RevealList, RevealItem } from '../../components/ui/Reveal';
import PageHero from '../../components/layout/PageHero';
import WindowStack from '../../components/ui/WindowStack';
import GlassCard from '../../components/ui/GlassCard';
import SectionBg from '../../components/ui/SectionBg';

// Collage: tamaños/inclinaciones variados que se repiten por índice.
// grid-auto-flow: dense rellena los huecos → recortes sin espacios.
const SPANS = [
  'col-span-2 row-span-2', 'col-span-1 row-span-1', 'col-span-1 row-span-1',
  'col-span-2 row-span-1', 'col-span-1 row-span-2', 'col-span-1 row-span-1',
];

export default function GalleryPage() {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [openKey, setOpenKey] = useState(null);

  // Los apartados curados (Alabanza, Danza, Niños...) ya NO viven como
  // archivos locales — se subieron a R2 y son GalleryPhoto reales en la
  // DB (ver backend/scripts/seed_curated_gallery), igual que cualquier
  // foto que suba el admin. Agrupar por álbum es solo leer el título.
  const albums = useMemo(() => {
    const grouped = {};
    gallery.forEach(photo => {
      let name = 'Otros';
      if (photo.title && photo.title.includes(' - ')) name = photo.title.split(' - ')[0].trim();
      (grouped[name] ||= []).push(photo);
    });
    return Object.entries(grouped).map(([name, photos]) => ({ name, photos }));
  }, [gallery]);

  const windowItems = useMemo(
    () => albums.map(a => ({ key: a.name, image: a.photos[0]?.url, badge: `${a.photos.length} fotos`, title: a.name })),
    [albums]
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFeedError(false);
    // limit=200 (el máximo que acepta el backend): con los apartados
    // curados ya son ~75+ fotos, el default de 20 dejaba fuera álbumes
    // enteros (los más viejos, por created_at DESC).
    apiClient.get('/gallery/?limit=200')
      .then(res => { if (active) setGallery(res.data?.data || res.data || []); })
      .catch(() => { if (active) setFeedError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  return (
    <main className="relative w-full min-h-screen overflow-hidden">
      <PageHero
        title="Galería"
        subtitle="Lo que Dios está haciendo en nuestra casa. Abre un álbum y recórrelo."
        photoSlot="hero_galeria"
        photoFallback="/images/bg-galeria.jpg"
      />

      <div className="relative z-10">
        {/* Se sale de la columna `max-w-6xl mx-auto px-6` que usan las otras
            19 secciones del sitio: en una galería el marco natural es el
            borde de la pantalla, no una columna de texto. Cuando TODAS las
            páginas respiran igual, ninguna tiene forma propia -- esta es la
            que tiene motivo real para romper la caja. El grid sube a 6
            columnas en desktop para que el ancho extra sea más collage y no
            solo cards más gordas. */}
        <section className="relative overflow-hidden pt-6 pb-28">
          <SectionBg src="/images/components/bg_galeria.jpg" />
          <div className="relative z-10 px-4 sm:px-8">
          {loading || feedError ? (
            <CollectionStatus loading={loading} label="los álbumes" onRetry={() => setAttempt(v => v + 1)} />
          ) : albums.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-d3 text-white/50">
                Sin fotos publicadas aún.
              </p>
            </div>
          ) : (
            // Dock: la grilla de álbumes son hermanos -- la magnificación
            // por proximidad hace que el grupo responda como una
            // superficie, no como cards sueltas.
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 auto-rows-[150px] sm:auto-rows-[165px] gap-x-5 gap-y-9 [grid-auto-flow:dense]">
              {albums.map((a, i) => {
                const big = SPANS[i % SPANS.length].includes('row-span-2');
                return (
                  <div key={a.name} className={SPANS[i % SPANS.length]} >
                    <GlassCard
                      as="button"
                      onClick={() => setOpenKey(a.name)}

                      glass
                      className="liquid-glass group relative w-full h-full rounded-[22px] overflow-hidden text-left focus-ring ring-1 ring-white/10"

                    >
                      {/* Foto a color pleno (antes llegaba al 55% y subía a
                          75% en hover: la portada del álbum se leía como
                          textura gris hasta que la tocabas). El contraste lo
                          pone .scrim-card, que oscurece solo el tercio bajo
                          donde caen el título y el conteo. */}
                      <PhotoImage src={a.photos[0]?.url} alt={`Portada del álbum ${a.name}`} loading="lazy"
                        className="parallax-layer absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="scrim-card" />
                      <div className="relative z-10 h-full w-full flex flex-col justify-end p-4 sm:p-5">
                        <span className="self-start bg-white/12 border border-white/20 text-white/90 px-2.5 py-0.5 rounded-full text-11 font-semibold mb-auto backdrop-blur-md">
                          {a.photos.length} fotos
                        </span>
                        <h3 className={`font-bold text-white tracking-tight leading-none ${big ? 'text-24 sm:text-30' : 'text-16 sm:text-18'}`}>
                          {a.name}
                        </h3>
                      </div>
                    </GlassCard>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </section>
      </div>

      {/* ═══════ VENTANAS SOBREPUESTAS ═══════ */}
      <WindowStack
        items={windowItems}
        openKey={openKey}
        onChange={setOpenKey}
        renderContent={(it) => {
          const a = albums.find(al => al.name === it.key);
          if (!a) return null;
          return (
            <RevealList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {a.photos.map((photo, idx) => (
                <RevealItem key={photo.ID ?? idx}>

                  <div className="rounded-[22px] overflow-hidden aspect-[4/5] relative group liquid-glass liquid-shine">
                    <PhotoImage src={photo.url} alt={`Foto ${idx + 1}`} loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                </RevealItem>
              ))}
            </RevealList>
          );
        }}
      />
    </main>
  );
}
