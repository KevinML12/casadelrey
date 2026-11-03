import SceneCarousel from '../../components/ui/SceneCarousel';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import Reveal from '../../components/ui/Reveal';
import { useApi, useApiResource, groupAlbums } from '../../lib/feed';
import HomeHero from '../../components/sections/HomeHero';
import VisitExperience from '../../components/sections/VisitExperience';
import SocialSection from '../../components/sections/SocialSection';
import SectionBg from '../../components/ui/SectionBg';
import CollectionStatus from '../../components/ui/CollectionStatus';

const fmtEventDate = date => new Date(date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

function AnnouncementsBar() {
  const data = useApi('/announcements');
  const [now] = useState(() => Date.now());
  const list = (Array.isArray(data) ? data : [])
    .filter(a => !a.expires_at || new Date(a.expires_at).getTime() > now)
    .slice(0, 2);

  if (list.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-t border-white/5 py-10">
      <SectionBg src="/images/public_bg_home.jpg" />
      <div className="relative z-10 max-w-6xl mx-auto px-6 flex flex-col gap-4">
        {list.map((a, i) => (
          <Reveal key={a.ID} delay={i * 0.08}>
            {/* Un anuncio se lee, no se toca: sin destino al que ir, el Tilt
                prometía una interacción que no existe. Queda el cristal (la
                clase) y su reflejo (liquid-shine, que antes agregaba la prop
                `glass` del Tilt); se pierde solo la rotación al cursor. */}
            <div className="liquid-glass liquid-shine rounded-[22px] px-6 py-5">
              <p className="text-16 font-bold text-white leading-tight">{a.title}</p>
              <p className="text-14 text-white/70 mt-1 line-clamp-2">{a.content}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// 2 · AGENDA (Eventos)
// ════════════════════════════════════════════════════════════════════
function Agenda() {
  const resource = useApiResource('/events/');
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const events = (Array.isArray(resource.data) ? resource.data : [])
    .filter(event => event.is_active !== false && (!event.date || event.date >= today))
    .map(event => ({ ...event, key: event.ID || event.id, image: event.cover_image || '/images/backgrounds/congregacion.webp' }));
  return <section id="agenda" className="relative border-t border-white/5">
    <div className="max-w-6xl mx-auto px-6 py-12 flex flex-wrap justify-between items-center gap-6">
      <h2 className="text-d2 text-white">Próximos eventos</h2>
      <Link to="/events" className="btn-spring focus-ring inline-flex min-h-11 items-center rounded-pill liquid-glass px-6 py-3 text-14 font-bold text-white">Ver calendario completo</Link>
    </div>
    {resource.loading || resource.error
      ? <div className="px-6 pb-12"><CollectionStatus loading={resource.loading} label="los eventos" onRetry={resource.retry} /></div>
      : <SceneCarousel items={events} label="Agenda de la comunidad" photoPreview empty="Sin próximos eventos publicados." renderContent={event => <>
        <h3 className="text-24 sm:text-28 font-bold line-clamp-2">{event.title}</h3>
        {event.date && <p className="mt-3 text-14 text-white/85">{fmtEventDate(event.date)}{event.time ? ` · ${event.time}` : ''}</p>}
        {event.location && <p className="mt-2 text-14 text-white/80 line-clamp-1">{event.location}</p>}
        <Link to={`/events?id=${event.key}`} className="btn-spring focus-ring inline-flex mt-5 min-h-11 items-center rounded-pill bg-white px-5 py-2 text-14 font-bold text-bg">Ver evento</Link>
      </>} />}
  </section>;
}

// ════════════════════════════════════════════════════════════════════
// 3 · CÉLULAS Y COMUNIDAD
// ════════════════════════════════════════════════════════════════════
function CelulasSection() {
  const resource = useApiResource('/cell-categories');
  const categories = (Array.isArray(resource.data) ? resource.data : []).filter(category => category.is_active !== false);
  const items = categories.map(category => ({
    key: category.ID || category.id,
    title: category.name,
    description: category.description,
    age: category.age_group,
    image: category.image_url || '/images/backgrounds/congregacion.webp',
  }));
  return <section id="celulas" className="relative border-t border-white/5">
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h2 className="text-d2 text-white">Células</h2>
      <p className="mt-4 text-18 text-white/70">Encuentra tu grupo y conoce su comunidad.</p>
    </div>
    {resource.loading || resource.error
      ? <div className="px-6 pb-12"><CollectionStatus loading={resource.loading} label="las categorías de células" onRetry={resource.retry} /></div>
      : <SceneCarousel items={items} label="Células de la comunidad" photoPreview empty="Sin categorías publicadas aún." renderContent={category => <>
        <h3 className="text-24 sm:text-28 font-bold line-clamp-2">{category.title}</h3>
        {category.description && <p className="mt-3 text-16 text-white/85 line-clamp-2">{category.description}</p>}
        {category.age && <p className="mt-2 text-13 text-white/80">{category.age}</p>}
        <Link to={`/celulas?tipo=${encodeURIComponent(category.title)}`} className="btn-spring focus-ring inline-flex mt-5 min-h-11 items-center rounded-pill bg-white px-5 py-2 text-14 font-bold text-bg">Conocer las células</Link>
      </>} />}
  </section>;
}

// ════════════════════════════════════════════════════════════════════
// 4 · MENSAJES (Prédicas en Liquid Glass)
// ════════════════════════════════════════════════════════════════════
// Sin fallback de títulos inventados: la sección solo existe si hay
// posts reales del blog (ver `if (sermons.length === 0) return null`
// más abajo) — mostrar "El Precio del Propósito" como si fuera un
// sermón real cuando la API falla contradice "nada estático".

function MensajesCarousel() {
  const resource = useApiResource('/blog/');
  const posts = (Array.isArray(resource.data) ? resource.data : []).map(post => ({
    key: post.ID || post.id,
    title: post.title,
    excerpt: post.excerpt,
    image: post.cover_image || '/images/backgrounds/congregacion.webp',
    href: post.redirect_url,
    to: post.slug ? `/blog/${post.slug}` : '/blog',
  }));
  return <section id="mensajes" className="relative border-t border-white/5">
    <div className="max-w-6xl mx-auto px-6 py-12 flex flex-wrap items-center justify-between gap-6">
      <h2 className="text-d2 text-white">Alimenta tu espíritu.</h2>
      <Link to="/blog" className="btn-spring focus-ring inline-flex min-h-11 items-center rounded-pill liquid-glass px-6 py-3 text-14 font-bold text-white">Ver todas las enseñanzas</Link>
    </div>
    {resource.loading || resource.error
      ? <div className="px-6 pb-12"><CollectionStatus loading={resource.loading} label="los mensajes" onRetry={resource.retry} /></div>
      : <SceneCarousel items={posts} label="Mensajes de la comunidad" photoPreview empty="Sin mensajes publicados aún." renderContent={post => <>
        <h3 className="text-24 sm:text-28 font-bold line-clamp-2">{post.title}</h3>
        {post.excerpt && <p className="mt-3 text-16 text-white/85 line-clamp-2">{post.excerpt}</p>}
        {post.href
          ? <a href={post.href} target="_blank" rel="noopener noreferrer" className="btn-spring focus-ring inline-flex mt-5 min-h-11 items-center rounded-pill bg-white px-5 py-2 text-14 font-bold text-bg">Leer mensaje</a>
          : <Link to={post.to} className="btn-spring focus-ring inline-flex mt-5 min-h-11 items-center rounded-pill bg-white px-5 py-2 text-14 font-bold text-bg">Leer mensaje</Link>}
      </>} />}
  </section>;
}

// ════════════════════════════════════════════════════════════════════
// 4.5 · GALERÍA (Preview)
// ════════════════════════════════════════════════════════════════════
function GalleryPreviewSection() {
  // Mismo fetch cacheado que usa useBackdrops — un solo GET /gallery/
  const resource = useApiResource('/gallery/?limit=200');
  const gallery = resource.data;
  const photos = gallery?.data || gallery;
  const albums = Array.isArray(photos) && photos.length > 0
    ? groupAlbums(photos)
    : {};

  const topAlbums = Object.entries(albums).slice(0, 4); // Tomar solo los primeros 4 para el preview

  return (
    <section id="galeria-preview" className="relative py-20 md:py-32 border-t border-white/5 overflow-hidden">
      <SectionBg src="/images/components/bg_galeria.jpg" />

      {/* Titular fijo. Y sin el <span text-white> que envolvía "vivos": era el
          fósil de un acento de color que se eliminó -- pintaba blanco sobre un
          h2 que ya es blanco, o sea marcaba una palabra sin marcarla. */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-d2 text-white">
            Momentos vivos.
          </h2>
        </div>
        <Link to="/gallery" className="btn-spring focus-ring inline-flex items-center justify-center gap-3 px-6 py-4 rounded-full liquid-glass text-white font-bold hover:bg-white/10 transition-colors border border-white/20 shrink-0">
          Explorar Galería
        </Link>
      </div>

      <div className="relative z-10">{resource.loading || resource.error ? <div className="max-w-6xl mx-auto px-6"><CollectionStatus loading={resource.loading} label="los álbumes" onRetry={resource.retry} /></div> : <SceneCarousel items={topAlbums.map(([title, photos]) => ({ key: title, title, image: photos[0].url, count: photos.length }))} label="Álbumes de la comunidad" photoPreview empty="Sin álbumes publicados aún." renderContent={album => <>
        <h3 className="text-24 sm:text-28 font-bold line-clamp-2">{album.title}</h3><p className="mt-4 text-14 text-white/80">Explora las fotografías de este álbum.</p>
        <Link to={`/gallery?album=${encodeURIComponent(album.title)}`} className="btn-spring inline-flex mt-6 min-h-11 items-center rounded-pill bg-white px-6 text-14 font-bold text-bg focus-ring">Explorar álbum</Link>
      </>} />}</div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════
export default function Home() {
  return (
    <main className="w-full">
      <HomeHero />
      <AnnouncementsBar />
      <Agenda />
      <CelulasSection />
      <MensajesCarousel />
      <GalleryPreviewSection />
      <SocialSection />
      <VisitExperience home />
    </main>
  );
}
