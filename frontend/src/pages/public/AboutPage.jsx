import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHero from '../../components/layout/PageHero';
import SocialSection from '../../components/sections/SocialSection';
import { Eyebrow } from '../../components/ui/Glass';
import Reveal, { RevealList, RevealItem } from '../../components/ui/Reveal';
import Tilt from '../../components/ui/Tilt';
import PhotoBentoTile from '../../components/ui/PhotoBentoTile';
import PhotoHeaderCard from '../../components/ui/PhotoHeaderCard';
import ParallaxImg from '../../components/ui/ParallaxImg';
import WindowStack from '../../components/ui/WindowStack';
import { useSitePhoto, useApi, groupAlbums } from '../../lib/feed';
import { useVolunteerAreas } from '../../lib/volunteerAreas';

const MotionLink = motion.create(Link);
const PRESS = {
  whileHover: { scale: 1.04 },
  whileTap: { scale: 0.94 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
};

const STATS = [
  { n: '20', label: 'Líderes de célula' },
  { n: '~90', label: 'Voluntarios sirviendo' },
  { n: '10', label: 'Departamentos' },
  { n: '5', label: 'Tipos de célula' },
];

// Mismo fallback (categorías estructurales reales, fotos reales) que ya
// usa Home.jsx -- solo entra en juego si /cell-categories aún no tiene
// nada o falla, nunca pisa datos reales del admin.
const CELL_CATEGORIES_FALLBACK = [
  { name: 'Adolescentes', age_group: '15 a 24 años', description: 'Reuniones dinámicas para adolescentes.', image_url: '/images/celulas/adolescentes.jpg' },
  { name: 'Jóvenes Adultos', age_group: 'Solteros', description: 'Comunidad para jóvenes profesionales y universitarios.', image_url: '/images/celulas/jovenes.jpg' },
  { name: 'Prejuveniles', age_group: '12 a 15 años', description: 'Un espacio seguro y divertido para crecer.', image_url: '/images/celulas/prejuveniles.jpg' },
  { name: 'Varones', age_group: 'Hombres', description: 'Hombres compartiendo la palabra y construyendo familia.', image_url: '/images/celulas/varones.jpg' },
  { name: 'Mujeres', age_group: 'Mujeres', description: 'Un espacio de formación espiritual, apoyo mutuo y hermandad.', image_url: '/images/celulas/mujeres.jpg' },
];
const DEFAULT_CELL_IMAGE = '/images/nosotros/comunidad.jpg';
const cellKey = (c, i) => c.ID ? `cat-${c.ID}` : `cell-fallback-${i}`;

// Bento: mezcla de tamaños real (hero 2x2, tiras 2x1, verticales 1x2,
// cuadros 1x1) en vez de tarjetas uniformes -- mismo lenguaje que ya usa
// GalleryPage.jsx (grid-auto-flow dense + spans variados). Sin caja
// glass-light envolviendo el grid: las fotos ocupan todo el ancho de la
// sección directo sobre el fondo -- Nosotros ya tenía demasiadas cajas
// idénticas seguidas, esto rompe ese patrón a propósito.
const BENTO_SPANS = [
  'col-span-2 row-span-2',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-2',
  'col-span-2 row-span-1',
  'col-span-1 row-span-1',
];

export default function AboutPage() {
  // Fotos administrables (AdminSitePhotos) con fallback local garantizado
  const pastoresImg   = useSitePhoto('about_pastores',   '/images/nosotros/pastores.jpg');
  const servidoresImg = useSitePhoto('about_servidores', '/images/nosotros/servidores.jpg');
  const comunidadImg  = useSitePhoto('about_comunidad',  '/images/nosotros/comunidad.jpg');
  const lideresImg    = useSitePhoto('about_lideres',    '/images/nosotros/lideres.jpg');

  // Fotos para las cards PhotoHeaderCard (franja ancha y corta) --
  // distintas de las de arriba: esas son fondo ambiente de sección (foto
  // completa, cualquier proporción sirve), pero un recorte de ~160px de
  // alto necesita una foto realmente horizontal o se ve mal.
  //
  // Fundadores y Pastores de células: el usuario entregó las fotos reales
  // de las personas nombradas en cada card (antes eran fotos ambiente
  // genéricas, no había retrato real de nadie). fundadores.jpg es
  // retrato (960x1280, la pareja ocupa la mitad superior del encuadre --
  // por eso objectPosition="top" en el card, si no el recorte corto los
  // corta a la altura del pecho) -- pastores-celulas.jpg ya es horizontal
  // (1800x1192) y no necesita ajuste. Comprimidas de sus originales
  // (3.2MB, foto de cámara sin optimizar) a ~200KB c/u antes de subirlas.
  const gallery = useApi('/gallery/?limit=200');
  const galleryPhotos = gallery?.data || gallery;
  const albums = Array.isArray(galleryPhotos) && galleryPhotos.length > 0 ? groupAlbums(galleryPhotos) : {};
  const findPhoto = (album, titleStartsWith) =>
    (albums[album] || []).find(p => p.title?.startsWith(titleStartsWith))?.url;
  const fundadoresCardImg       = '/images/nosotros/fundadores.jpg';
  const pastoresCelulasCardImg  = '/images/nosotros/pastores-celulas.jpg';
  const podcastCardImg          = findPhoto('SABADOS', 'SABADOS - Palis') || comunidadImg;
  const visitanosCardImg        = '/images/bg-ubicacion.jpg'; // misma foto real que ya usa Home.jsx para "Ubicación" -- horizontal, a diferencia de about_lideres (retrato)
  // Misión/Visión eran las únicas cards de toda la página sin ninguna
  // foto -- el usuario lo señaló como falta de concordancia entre
  // formatos. Mismo PhotoHeaderCard que el resto, con fotos reales de
  // la Galería (horizontales, ya verificadas) en vez de dejarlas planas.
  const misionCardImg           = findPhoto('CONFERENCIA UNA VEZ Y PARA SIEMPRE', 'CONFERENCIA UNA VEZ Y PARA SIEMPRE - FF92F933') || servidoresImg;
  const visionCardImg           = findPhoto('Alabanza', 'Alabanza - 8') || servidoresImg;
  // Mismo patrón que VolunteeringPage.jsx: foto real por departamento
  // (con fallback), más una segunda foto opcional (voluntariado_<value>_2)
  // que activa el carrusel en la ventana de detalle si el admin la sube.
  const volunteerAreas = useVolunteerAreas();
  const sitePhotos = useApi('/site-photos') || {};
  const areas = volunteerAreas.map(a => ({ ...a, photo: sitePhotos[`voluntariado_${a.value}`] || a.photoFallback }));
  const windowItems = areas.map(a => ({
    key: a.value,
    image: a.photo,
    images: [a.photo, sitePhotos[`voluntariado_${a.value}_2`]].filter(Boolean),
    title: a.title,
  }));
  const [openKey, setOpenKey] = useState(null);

  // Misma filosofía para células: fotos reales de /cell-categories (el
  // mismo admin-editable que ya usan Home.jsx y CelulasPage.jsx), tira
  // horizontal + ventana de detalle en vez de la caja de texto plano.
  const apiCellCategories = useApi('/cell-categories');
  const cellCategories = Array.isArray(apiCellCategories) && apiCellCategories.length > 0
    ? apiCellCategories.filter(c => c.is_active !== false)
    : CELL_CATEGORIES_FALLBACK;
  const cellWindowItems = cellCategories.map((c, i) => ({
    key: cellKey(c, i),
    image: c.image_url || DEFAULT_CELL_IMAGE,
    badge: c.age_group,
    title: c.name,
  }));
  const [openCellKey, setOpenCellKey] = useState(null);

  return (
    <main className="min-h-screen bg-bg text-white">
      <PageHero
        eyebrow="Nuestra historia"
        title="Somos Casa del Rey."
        subtitle="Una iglesia familiar en Huehuetenango, edificada célula por célula, generación tras generación."
        photoSlot="hero_nosotros"
        photoFallback="/images/nosotros/comunidad.jpg"
      />

      {/* Fundadores + estructura actual — fotografía real de la congregación
          en adoración como ambiente (no atribuida a nadie en particular) */}
      <section className="relative py-16 md:py-24 border-t border-white/5 overflow-hidden">
        <ParallaxImg src={pastoresImg} alt="" className="opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/40 to-bg" />
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <Reveal className="mb-12">
            <Eyebrow>Identidad</Eyebrow>
            <h2 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)' }}>
              Nuestra historia.
            </h2>
          </Reveal>

          <RevealList className="grid md:grid-cols-2 gap-5">
            <RevealItem>
              <PhotoHeaderCard photo={fundadoresCardImg} glass="standard" objectPosition="center 15%">
                <p className="text-13 font-bold text-bg/50 uppercase tracking-tightish mb-2">Pastores fundadores</p>
                <h3 className="text-24 font-bold text-bg tracking-tight leading-tight">
                  José de León y Desidería López
                </h3>
                <p className="mt-4 text-15 text-bg/60 leading-relaxed">
                  Sembraron la visión original de Casa del Rey — los cimientos sobre los que la iglesia sigue edificando hoy.
                </p>
              </PhotoHeaderCard>
            </RevealItem>

            <RevealItem>
              <PhotoHeaderCard photo={pastoresCelulasCardImg} glass="featured">
                <p className="text-13 font-bold text-bg/50 uppercase tracking-tightish mb-2">Pastores</p>
                <h3 className="text-24 font-bold text-bg tracking-tight leading-tight">
                  Leonel de León e Ismeina Castillo
                </h3>
                <p className="mt-4 text-15 text-bg/60 leading-relaxed">
                  Junto a un equipo pastoral, cubren las células de varones, prejuveniles y la red Mujeres de Palabra.
                </p>
              </PhotoHeaderCard>
            </RevealItem>
          </RevealList>
        </div>
      </section>

      {/* Misión y Visión */}
      <section className="relative py-16 md:py-24 border-t border-white/5 overflow-hidden">
        <ParallaxImg src={servidoresImg} alt="" className="opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/50 to-bg" />
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <Reveal className="mb-12">
            <Eyebrow>Propósito</Eyebrow>
            <h2 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)' }}>
              Lo que nos mueve.
            </h2>
          </Reveal>

          <RevealList className="grid md:grid-cols-2 gap-5">
            <RevealItem>
              <PhotoHeaderCard photo={misionCardImg} glass="standard">
                <h3 className="text-20 font-bold text-bg mb-3">Misión</h3>
                <p className="text-16 text-bg/70 leading-relaxed">
                  Somos una iglesia cristiana familiar, enfocada en cumplir la gran comisión de
                  Jesucristo: ir y hacer discípulos a las naciones, formando líderes capaces de
                  reproducir la obra de Dios.
                </p>
              </PhotoHeaderCard>
            </RevealItem>
            <RevealItem>
              <PhotoHeaderCard photo={visionCardImg} glass="featured">
                <h3 className="text-20 font-bold text-bg mb-3">Visión</h3>
                <p className="text-16 text-bg/70 leading-relaxed">
                  Ser una iglesia de restauración familiar, punta de lanza, que proclama la
                  verdad de la Palabra de Dios bajo el poder del Espíritu Santo.
                </p>
              </PhotoHeaderCard>
            </RevealItem>
          </RevealList>
        </div>
      </section>

      {/* Comunidad en números + departamentos de voluntariado */}
      <section className="relative py-16 md:py-24 border-t border-white/5 overflow-hidden">
        <ParallaxImg src={comunidadImg} alt="" className="opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/45 to-bg" />
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <Reveal className="mb-12 text-center">
            <Eyebrow>Comunidad</Eyebrow>
            <h2 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)' }}>
              Una familia que sirve.
            </h2>
            <p className="mt-6 text-17 text-white/70 max-w-2xl mx-auto">
              Cada persona tiene un lugar. Así está organizada nuestra comunidad hoy.
            </p>
          </Reveal>

          <RevealList className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {STATS.map(s => (
              <RevealItem key={s.label}>
                <Tilt max={3} glass="standard" className="glass-light rounded-[20px] p-6 md:p-8 text-center h-full">
                  <div className="text-36 md:text-44 font-extrabold text-bg tracking-tighter leading-none">{s.n}</div>
                  <div className="mt-2 text-13 font-semibold text-bg/60">{s.label}</div>
                </Tilt>
              </RevealItem>
            ))}
          </RevealList>

          <Reveal delay={0.1}>
            <div className="flex items-center justify-between gap-4 mb-6">
              <p className="text-13 font-bold text-white/50 uppercase tracking-tightish">Departamentos de voluntariado</p>
              <Link to="/volunteering" className="shrink-0 text-13 font-semibold text-white/55 hover:text-white underline underline-offset-4 decoration-white/20">
                Ver todos
              </Link>
            </div>

            {/* Bento de fotos reales -- toca una para abrir su ventana
                de detalle (mismo WindowStack de /volunteering, reusado
                tal cual). El tile grande muestra también la descripción. */}
            <div className="grid grid-cols-2 sm:grid-cols-4 auto-rows-[120px] sm:auto-rows-[140px] gap-3 sm:gap-4 [grid-auto-flow:dense] mb-7">
              {areas.map((d, i) => {
                const span = BENTO_SPANS[i % BENTO_SPANS.length];
                const big = span === 'col-span-2 row-span-2';
                return (
                  <motion.div
                    key={d.value}
                    className={span}
                    initial={{ opacity: 0, y: 18, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ type: 'spring', stiffness: 120, damping: 16, delay: (i % 6) * 0.05 }}
                  >
                    <PhotoBentoTile
                      photo={d.photo}
                      title={d.title}
                      desc={d.desc}
                      big={big}
                      onClick={() => setOpenKey(d.value)}
                    />
                  </motion.div>
                );
              })}
            </div>

            <Link
              to="/volunteering"
              className="inline-flex items-center gap-2.5 text-14 font-bold text-white hover:text-white/70 transition-colors"
            >
              Únete como voluntario
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Ventana de detalle por departamento -- mismo WindowStack de
          /volunteering (carrusel de fotos si hay una segunda foto, y el
          testimonio real si el admin cargó uno), para no navegar fuera
          de Nosotros solo para ver de qué se trata un departamento. */}
      <WindowStack
        items={windowItems}
        openKey={openKey}
        onChange={setOpenKey}
        height="min(70vh, 560px)"
        light
        renderContent={(it) => {
          const a = areas.find(x => x.value === it.key);
          if (!a) return null;
          return (
            <div className="grid sm:grid-cols-5 gap-5">
              <div className="sm:col-span-3 flex flex-col gap-4">
                <p className="text-bg/70 text-15 leading-relaxed">{a.desc}</p>
                <Link
                  to="/volunteering"
                  className="mt-auto w-full inline-flex items-center justify-center gap-2.5 rounded-pill bg-bg text-white px-6 py-4 text-15 font-bold shadow-card hover:opacity-90"
                >
                  Aplicar a {a.title}
                </Link>
              </div>
              <div className="sm:col-span-2 flex flex-col gap-4">
                <div className="glass-light-nested rounded-[16px] p-5 h-fit">
                  <p className="text-11 font-bold uppercase tracking-widest text-bg/50 mb-2">¿Por qué aquí?</p>
                  <p className="text-bg/75 text-15 leading-relaxed">{a.why}</p>
                </div>
                {a.testimonial && (
                  <div className="glass-light-nested rounded-[16px] p-5 h-fit">
                    <p className="text-bg/70 text-14 italic leading-relaxed">"{a.testimonial}"</p>
                    {a.testimonialAuthor && <p className="text-bg/45 text-12 font-semibold mt-2">— {a.testimonialAuthor}</p>}
                  </div>
                )}
              </div>
            </div>
          );
        }}
      />

      {/* Separador -- aclara la diferencia entre los dos módulos antes de
          seguir a Células. Se confunden fácil ("¿no es lo mismo?"): una
          es el compromiso semanal de discipulado, la otra es servir en
          un área puntual cuando se necesita. Agrandado a pedido del
          usuario -- la primera versión se sentía perdida en tanto
          espacio oscuro alrededor. */}
      <section className="relative py-20 md:py-28 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <Reveal className="text-center mb-12">
            <Eyebrow>¿Cuál es para mí?</Eyebrow>
          </Reveal>
          <div className="grid sm:grid-cols-2 gap-10 sm:gap-14 sm:divide-x sm:divide-white/10">
            <Reveal from="left" className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6">
              <Tilt max={5} glass className="liquid-glass shrink-0 relative w-24 h-24 md:w-28 md:h-28 rounded-[20px] overflow-hidden">
                {areas[0]?.photo && <img src={areas[0].photo} alt="" className="absolute inset-0 w-full h-full object-cover" />}
              </Tilt>
              <div>
                <p className="text-24 md:text-28 font-bold text-white tracking-tight">Voluntariado</p>
                <p className="text-16 md:text-17 text-white/60 leading-relaxed mt-3 max-w-sm">
                  Apoyas a la iglesia y a los líderes en un área puntual —
                  alabanza, niños, multimedia — cuando se requiere.
                </p>
              </div>
            </Reveal>
            <Reveal from="right" delay={0.06} className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6 sm:pl-14">
              <Tilt max={5} glass className="liquid-glass shrink-0 relative w-24 h-24 md:w-28 md:h-28 rounded-[20px] overflow-hidden">
                {cellCategories[0]?.image_url && <img src={cellCategories[0].image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
              </Tilt>
              <div>
                <p className="text-24 md:text-28 font-bold text-white tracking-tight">Células</p>
                <p className="text-16 md:text-17 text-white/60 leading-relaxed mt-3 max-w-sm">
                  Acompañas a tu líder en las reuniones periódicas de tu
                  grupo — el espacio donde creces en comunidad cada semana.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Células — acceso directo al módulo, misma filosofía que el
          bloque de voluntariado de arriba: bento de fotos reales +
          ventana de detalle en vez de una caja de solo texto. */}
      <section className="relative py-16 md:py-24 border-t border-white/5 overflow-hidden">
        <ParallaxImg src={lideresImg} alt="" className="opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/50 to-bg" />
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <Reveal className="mb-10">
            <div className="flex items-center justify-between gap-4">
              <Eyebrow>Grupos pequeños</Eyebrow>
              <Link to="/celulas" className="shrink-0 text-13 font-semibold text-white/55 hover:text-white underline underline-offset-4 decoration-white/20">
                Ver todas
              </Link>
            </div>
            <h2 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)' }}>
              Encuentra tu célula.
            </h2>
            <p className="mt-4 text-16 text-white/70 max-w-lg">
              Adolescentes, jóvenes adultos, prejuveniles, varones y la red
              Mujeres de Palabra — cada grupo se reúne en casas durante la semana.
            </p>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-4 auto-rows-[120px] sm:auto-rows-[140px] gap-3 sm:gap-4 [grid-auto-flow:dense] mb-9">
            {cellCategories.map((c, i) => {
              const span = BENTO_SPANS[i % BENTO_SPANS.length];
              const big = span === 'col-span-2 row-span-2';
              return (
                <motion.div
                  key={cellKey(c, i)}
                  className={span}
                  initial={{ opacity: 0, y: 18, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ type: 'spring', stiffness: 120, damping: 16, delay: (i % 6) * 0.05 }}
                >
                  <PhotoBentoTile
                    photo={c.image_url || DEFAULT_CELL_IMAGE}
                    title={c.name}
                    desc={c.description}
                    big={big}
                    onClick={() => setOpenCellKey(cellKey(c, i))}
                  />
                </motion.div>
              );
            })}
          </div>

          <MotionLink
            to="/celulas"
            {...PRESS}
            className="inline-flex items-center gap-3 px-7 py-4 rounded-pill bg-bg text-white text-15 font-bold focus-ring shadow-card"
          >
            Ver células
          </MotionLink>
        </div>
      </section>

      {/* Ventana de detalle por categoría de célula -- preview rápido
          (badge de edad + descripción) sin salir de Nosotros; el CTA
          adentro lleva directo a /celulas?tipo=X, que ya sabe abrir esa
          ventana ahí (mismo deep-link que usa Home.jsx). */}
      <WindowStack
        items={cellWindowItems}
        openKey={openCellKey}
        onChange={setOpenCellKey}
        height="min(60vh, 460px)"
        light
        renderContent={(it) => {
          const c = cellCategories.find((x, i) => cellKey(x, i) === it.key);
          if (!c) return null;
          return (
            <div className="flex flex-col gap-4">
              {c.age_group && (
                <span className="self-start inline-flex items-center gap-1.5 bg-bg/6 border border-bg/12 text-bg/60 px-3 py-1 rounded-full text-11 font-bold uppercase tracking-wide">
                  {c.age_group}
                </span>
              )}
              {c.description && <p className="text-bg/70 text-15 leading-relaxed">{c.description}</p>}
              <MotionLink
                {...PRESS}
                to={`/celulas?tipo=${encodeURIComponent(c.name)}`}
                className="mt-auto w-full inline-flex items-center justify-center gap-2.5 rounded-pill bg-bg text-white px-6 py-4 text-15 font-bold shadow-card hover:opacity-90"
              >
                Ver células de {c.name}
              </MotionLink>
            </div>
          );
        }}
      />

      {/* Ubicación + podcast */}
      <section className="relative py-16 md:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-5">
          <Reveal from="left">
            <PhotoHeaderCard photo={visitanosCardImg} glass="standard">
              <h3 className="text-20 font-bold text-bg mb-3">Visítanos</h3>
              <p className="text-15 text-bg/70 leading-relaxed mb-6">
                7ª. Calle 12-66 zona 4,<br />
                carretera a las Ruinas de Zaculeu,<br />
                Huehuetenango
              </p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Casa+del+Rey+7a+Calle+12-66+zona+4+Huehuetenango"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-14 font-bold text-bg hover:text-bg/70 transition-colors"
              >
                Cómo llegar
              </a>
            </PhotoHeaderCard>
          </Reveal>

          <Reveal from="right" delay={0.08}>
            <PhotoHeaderCard photo={podcastCardImg} glass="standard" contentClassName="justify-center">
              <h3 className="text-20 font-bold text-bg mb-3">Podcast Inusual Youth</h3>
              <p className="text-15 text-bg/70 leading-relaxed">
                92.9 FM Radio Stereo Cumbre<br />
                Viernes · 3:00 PM
              </p>
            </PhotoHeaderCard>
          </Reveal>
        </div>
      </section>

      <SocialSection title="Síguenos en redes" />
    </main>
  );
}
