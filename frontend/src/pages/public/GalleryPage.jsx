// ============================================================
//  GalleryPage — hero de fondo + álbumes como recortes de cristal en
//  COLLAGE. Al abrir un álbum, sus fotos aparecen en una VENTANA
//  sobrepuesta (WindowStack); los demás álbumes asoman apilados detrás
//  y se salta entre ellos. Lenguaje de diseño: docs/DISENO_LIQUID_GLASS.md
// ============================================================
import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../../lib/apiClient';
import { Icon, Eyebrow } from '../../components/ui/Glass';
import Reveal, { RevealList, RevealItem } from '../../components/ui/Reveal';
import ParallaxImg from '../../components/ui/ParallaxImg';
import WindowStack from '../../components/ui/WindowStack';

// Collage: tamaños/inclinaciones variados que se repiten por índice.
// grid-auto-flow: dense rellena los huecos → recortes sin espacios.
const SPANS = [
  'col-span-2 row-span-2', 'col-span-1 row-span-1', 'col-span-1 row-span-1',
  'col-span-2 row-span-1', 'col-span-1 row-span-2', 'col-span-1 row-span-1',
];
const ROT = [-2.2, 1.8, -1.4, 2.4, -2.6, 1.2];

// Apartados CURADOS (fotos reales de la iglesia, DOMINGOS 2026) — el
// módulo siempre tiene contenido con cara propia, no depende solo de lo
// que suba el admin. Se combinan con los álbumes de la API (más abajo).
const LOCAL_APARTADOS = [
  { name: 'Alabanza',  slug: 'alabanza',  count: 8 },
  { name: 'Danza',     slug: 'danza',     count: 8 },
  { name: 'Niños',     slug: 'ninos',     count: 8 },
  { name: 'Miembros',  slug: 'miembros',  count: 8 },
  { name: 'Jóvenes',   slug: 'jovenes',   count: 8 },
  { name: 'Mujeres',   slug: 'mujeres',   count: 8 },
  { name: 'Liderazgo', slug: 'liderazgo', count: 7 },
].map(a => ({
  name: a.name,
  photos: Array.from({ length: a.count }, (_, i) => ({
    ID: `${a.slug}-${i}`,
    url: `/images/gallery/${a.slug}/${i + 1}.jpg`,
  })),
}));

export default function GalleryPage() {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openKey, setOpenKey] = useState(null);

  const albums = useMemo(() => {
    const grouped = {};
    gallery.forEach(photo => {
      let name = 'Otros';
      if (photo.title && photo.title.includes(' - ')) name = photo.title.split(' - ')[0].trim();
      (grouped[name] ||= []).push(photo);
    });
    const apiAlbums = Object.entries(grouped).map(([name, photos]) => ({ name, photos }));
    // Los apartados curados van siempre; si el admin sube un álbum con el
    // mismo nombre (p.ej. otra tanda de "Danza"), sus fotos se suman a las
    // curadas en vez de crear un álbum duplicado.
    const merged = LOCAL_APARTADOS.map(local => {
      const fromApi = apiAlbums.find(a => a.name.toLowerCase() === local.name.toLowerCase());
      return fromApi ? { name: local.name, photos: [...local.photos, ...fromApi.photos] } : local;
    });
    const extra = apiAlbums.filter(a => !LOCAL_APARTADOS.some(l => l.name.toLowerCase() === a.name.toLowerCase()));
    return [...merged, ...extra];
  }, [gallery]);

  const windowItems = useMemo(
    () => albums.map(a => ({ key: a.name, image: a.photos[0]?.url, badge: `${a.photos.length} fotos`, title: a.name })),
    [albums]
  );

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
    <main className="relative bg-bg w-full min-h-screen overflow-hidden">
      {/* Hero de fondo presente en toda la página */}
      <ParallaxImg src="/images/bg-galeria.jpg" alt="" className="opacity-45" />
      <div className="absolute inset-0 bg-gradient-to-b from-bg/75 via-bg/55 to-bg pointer-events-none" />

      <div className="relative z-10">
        <section className="pt-40 pb-8 max-w-6xl mx-auto px-6">
          <Reveal>
            <Eyebrow>Momentos vivos</Eyebrow>
            <h1 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)' }}>
              Galería
            </h1>
            <p className="mt-6 text-[18px] text-white/70 max-w-2xl">
              Lo que Dios está haciendo en nuestra casa. Abre un álbum y recórrelo.
            </p>
          </Reveal>
        </section>

        <section className="max-w-6xl mx-auto px-6 pt-6 pb-28">
          {albums.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-bold text-white/50" style={{ fontSize: 'clamp(24px,4vw,36px)' }}>
                Sin fotos publicadas aún.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[150px] sm:auto-rows-[165px] gap-x-5 gap-y-9 [grid-auto-flow:dense]">
              {albums.map((a, i) => {
                const big = SPANS[i % SPANS.length].includes('row-span-2');
                return (
                  <motion.button
                    key={a.name}
                    onClick={() => setOpenKey(a.name)}
                    initial={{ opacity: 0, y: 24, rotate: ROT[i % ROT.length] }}
                    whileInView={{ opacity: 1, y: 0, rotate: ROT[i % ROT.length] }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ type: 'spring', stiffness: 120, damping: 16, delay: (i % 8) * 0.05 }}
                    whileHover={{ rotate: 0, scale: 1.05, y: -6, zIndex: 30 }}
                    className={`liquid-glass liquid-shine group relative ${SPANS[i % SPANS.length]} rounded-[22px] overflow-hidden text-left focus-ring ring-1 ring-white/10`}
                    style={{ transformOrigin: 'center' }}
                  >
                    <img src={a.photos[0]?.url} alt="" loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:opacity-75 transition-all duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/35 to-transparent" />
                    <div className="relative z-10 h-full w-full flex flex-col justify-end p-4 sm:p-5">
                      <span className="self-start bg-white/12 border border-white/20 text-white/90 px-2.5 py-0.5 rounded-full text-[11px] font-semibold mb-auto backdrop-blur-md">
                        {a.photos.length} fotos
                      </span>
                      <h3 className={`font-bold text-white tracking-tight leading-none ${big ? 'text-[24px] sm:text-[30px]' : 'text-[16px] sm:text-[18px]'}`}>
                        {a.name}
                      </h3>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
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
                  <div className="rounded-[14px] overflow-hidden aspect-[4/5] relative group liquid-glass">
                    <img src={photo.url} alt={`Foto ${idx + 1}`} loading="lazy"
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
