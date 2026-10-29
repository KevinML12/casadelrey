import SceneCarousel from '../../components/ui/SceneCarousel';
import PhotoImage from '../../components/ui/PhotoImage';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Reveal from '../../components/ui/Reveal';
import { useApi, useApiResource, groupAlbums, fetchOnce } from '../../lib/feed';
import { useAuth } from '../../context/AuthContext';
import { saludo } from '../../lib/greeting';
// Vocabulario de movimiento compartido: la amplitud del press la decide el
// ROL del botón (primario / apoyo / micro-control), no el archivo. Antes
// vivía aquí como un `const PRESS` local que le daba la MISMA física al CTA
// blanco del hero y a los chips de redes del pie de Ubicación.
import { EASE_OUT, EASE_IN, PRESS_PRIMARY, PRESS_SECONDARY, PRESS_MICRO } from '../../lib/motion';

import VisitExperience from '../../components/sections/VisitExperience';
import SocialSection from '../../components/sections/SocialSection';
import SectionBg from '../../components/ui/SectionBg';
import CollectionStatus from '../../components/ui/CollectionStatus';

const MotionLink = motion.create(Link);

// ════════════════════════════════════════════════════════════════════
// 1 · HERO CAROUSEL — slides reales: los heroes que el admin activa en
// AdminHero + los próximos eventos con su foto. El fallback local solo
// aparece si la API no responde (el backend ya trae su hero default).
// ════════════════════════════════════════════════════════════════════
const LOCAL_MEDIA = '/images/bg-hero.jpg';

// Neutro y solo hechos confirmados: nada de lemas inventados
const SLIDE_FALLBACK = {
  type: 'hero',
  label: 'Iglesia cristiana · Huehuetenango',
  l1: 'CASA', l2: 'DEL REY',
  subtitle: '',
  schedule: '',
  media: LOCAL_MEDIA,
  ctaText: 'Conéctate', ctaUrl: '/conectate',
};

const fmtEventDate = (d) =>
  new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

// ── Coreografía del carrusel ──────────────────────────────────────
// Entrada en cascada (label → título → subtítulo → CTA) con las líneas
// del título emergiendo desde una máscara; salida rápida hacia arriba.
// Las curvas ya no se declaran aquí: EASE_OUT nació en este hero y por eso
// mismo se adoptó como el acento de movimiento del sitio entero — vive en
// lib/motion.js y desde ahí la usan todas las páginas.

const SLIDE_ANIM = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.025, delayChildren: 0 } },
  exit:   { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
};
const RISE = {
  hidden: { opacity: 0, y: 6 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.18, ease: EASE_OUT } },
  exit:   { opacity: 0, y: -4, transition: { duration: 0.12, ease: EASE_IN } },
};
// Máscara de línea: el texto sube desde detrás de un overflow-hidden
const LINE = {
  hidden: { opacity: 0, y: 6 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE_OUT } },
  exit:   { opacity: 0, y: -4, transition: { duration: 0.12, ease: EASE_IN } },
};

function HeroCarousel({ onPlan }) {
  const { user } = useAuth();
  const [slides, setSlides] = useState([SLIDE_FALLBACK]);
  const [idx, setIdx] = useState(0);
  // null = sin evento real que mostrar (la tarjeta oculta ese bloque);
  // nunca un evento inventado como placeholder — regla "nada estático".
  const [nextEvent, setNextEvent] = useState(null);
  const [eventLabel, setEventLabel] = useState('Próximo evento');
  const [failed, setFailed] = useState({});
  // Carril horizontal real: las fotos viven aquí, se navegan con
  // swipe/scroll/trackpad — no solo con los dots. El texto (abajo)
  // se mantiene fijo y solo cambia de contenido según qué slide
  // quedó centrado, sincronizado por scroll listener.
  const trackRef = useRef(null);
  // Espejo de `idx` para que la autorotación lea el índice actual sin
  // recrear el intervalo en cada cambio de slide, y sin meter efectos
  // secundarios dentro del updater de setIdx (ver la nota del intervalo).
  const idxRef = useRef(0);
  useEffect(() => { idxRef.current = idx; }, [idx]);

  useEffect(() => {
    Promise.all([fetchOnce('/hero/active'), fetchOnce('/events/')]).then(([heroData, events]) => {
      const s = [];

      // Heroes del panel — el endpoint nuevo devuelve array; el viejo, objeto
      const heroes = Array.isArray(heroData) ? heroData : heroData ? [heroData] : [];
      heroes.forEach(h => {
        if (!h.title_line_1) return;
        s.push({
          type: 'hero',
          label: (h.label_top || '').replace(/^●\s*/, '') || 'Casa del Rey · Huehuetenango',
          l1: h.title_line_1, l2: h.title_line_2,
          subtitle: h.subtitle,
          schedule: [h.schedule_text, h.verse_reference].filter(Boolean).join(' · '),
          media: h.background_image_url || h.fallback_image_url || LOCAL_MEDIA,
          ctaText: h.cta_primary_text, ctaUrl: h.cta_primary_url,
        });
      });

      // Eventos como slides: próximos primero; si no hay ninguno por venir,
      // los más recientes con etiqueta honesta (nunca el carrusel vacío)
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const sorted = (Array.isArray(events) ? events : [])
        .filter(e => e.is_active !== false)
        .sort((a, b) => a.date.localeCompare(b.date));
      const upcoming = sorted.filter(e => new Date(e.date + 'T12:00:00') >= today);
      const pool = upcoming.length > 0 ? upcoming.slice(0, 3) : sorted.slice(-2).reverse();
      const isUpcoming = upcoming.length > 0;

      pool.forEach(e => {
        s.push({
          type: 'event',
          label: isUpcoming ? 'Próximo evento' : 'Evento reciente',
          l1: e.title.toUpperCase(), l2: '',
          subtitle: e.description ? `${e.description.slice(0, 140)}${e.description.length > 140 ? '…' : ''}` : '',
          schedule: [fmtEventDate(e.date), e.time, e.location].filter(Boolean).join(' · '),
          media: e.cover_image || LOCAL_MEDIA,
          ctaText: isUpcoming ? 'Reservar mi lugar' : 'Ver calendario',
          ctaUrl: '/events',
        });
      });

      if (s.length > 0) setSlides(s);

      // La tarjeta de cristal: el evento más próximo, o el último realizado
      const ev = upcoming[0] || sorted[sorted.length - 1];
      if (!isUpcoming && ev) setEventLabel('Último evento');
      if (ev) {
        const date = new Date(ev.date + 'T12:00:00');
        setNextEvent({
          day: date.getDate().toString(),
          month: date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase(),
          title: ev.title,
          time: ev.time || 'Por definir',
          loc: ev.location,
        });
      }
    });
  }, []);

  // Lleva el carril a un slide dado — scroll real, no solo estado.
  const goTo = (i) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
    setIdx(i);
  };

  // El usuario desliza/hace scroll con el trackpad o el dedo → detecta
  // qué slide quedó centrado y sincroniza el texto + los dots.
  //
  // Se espera a que el carril DEJE de moverse (140ms sin un solo evento
  // de scroll) y recién ahí se sincroniza, una sola vez. Antes el guard
  // contra el scroll programático era un `setTimeout` de 700ms adivinado
  // a ojo: un `scrollTo({behavior:'smooth'})` sobre un carril de ~1400px
  // puede tardar más, y los eventos residuales llegaban con el guard ya
  // levantado, pudiendo redondear a un índice distinto del que se acababa
  // de pedir. Cada cambio de índice cambia el `key` del bloque de texto y
  // lo remonta, así que el precio de esa carrera era un parpadeo del
  // titular. Esperar a que el scroll se asiente no adivina nada: tras un
  // scroll programático el índice calculado coincide con el que ya está,
  // `setIdx` no dispara render y el bloque no se remonta.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let settle;
    const onScroll = () => {
      clearTimeout(settle);
      settle = setTimeout(() => {
        const i = Math.round(track.scrollLeft / track.clientWidth);
        setIdx(prev => (prev === i ? prev : i));
      }, 140);
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => { track.removeEventListener('scroll', onScroll); clearTimeout(settle); };
  }, []);

  // Autorotación cada 8s — programa el scroll real (no solo el índice),
  // así el carril y los dots siempre concuerdan con lo que se ve.
  //
  // El índice siguiente sale de un ref, no del updater de setIdx. Antes
  // era `setIdx(i => { goTo(i + 1); return i + 1 })`: un efecto
  // secundario DENTRO de una función de actualización. React exige que
  // esas funciones sean puras y en StrictMode las invoca dos veces, así
  // que el carril recibía dos `scrollTo` por tick y `goTo` volvía a
  // llamar a `setIdx` desde dentro de otro `setIdx`.
  useEffect(() => {
    if (slides.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => {
      goTo((idxRef.current + 1) % slides.length);
    }, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  const slide = slides[Math.min(idx, slides.length - 1)];
  // El titulo de un HERO lo redacta el admin como frase editorial corta
  // ("SOMOS/CASA DEL REY"); el de un EVENTO es prosa normal (el titulo del
  // evento tal cual, "Noche de Alabanza y Adoracion") -- al tamaño gigante
  // de display una frase larga envuelve en 3-4 lineas y la seccion (de alto
  // FIJO, h-[100svh]) la corta. Se sigue achicando segun el largo real en vez
  // de truncar con "…", pero ya no con tres `clamp()` inventados aqui: los
  // tres escalones caen sobre los tres tokens de display del sistema
  // (d1/d2/d3), que ademas traen peso, tracking e interlineado horneados.
  const longestLine = Math.max(slide.l1?.length || 0, slide.l2?.length || 0);
  const titleSize = longestLine > 20
    ? 'text-d3'
    : longestLine > 12
      ? 'text-d2'
      : 'text-d1';
  // Subtítulo del hero: si el admin no puso uno propio, saludo dinámico
  // por hora del día (mismo lenguaje que "Buenos días, Pastor" del
  // Dashboard) -- personalizado con el nombre si hay sesión iniciada.
  // Los slides de evento ya traen su propio subtitle real (descripción),
  // ese nunca se reemplaza.
  const displaySubtitle = slide.subtitle
    || (slide.type === 'hero' ? `${saludo()}${user?.name ? `, ${user.name.split(' ')[0]}` : ''}` : '');
  // Si el media remoto falla, la foto local sostiene el liquid glass
  const mediaFor = (s) => failed[s.media] ? LOCAL_MEDIA : (s.media || LOCAL_MEDIA);
  const markFailed = (url) => setFailed(f => ({ ...f, [url]: true }));

  return (
    <section id="inicio" className="relative h-[100svh] overflow-hidden">
      {/* Carril horizontal REAL: cada slide es una ventana de 100vw que se
          navega deslizando (touch, trackpad, scrollbar) — no solo con los
          dots. El wrapper externo lleva el parallax de scroll de página
          (Ken Burns al bajar); el carril interno es scroll-snap propio. */}
      <motion.div className="absolute inset-0">
        <div
          ref={trackRef}
          className="h-full w-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar"
          // touchAction: sin esto, el navegador a veces duda si un gesto de
          // dedo debe hacer scroll horizontal aca o vertical en la pagina
          // (mas aun con Lenis manejando el scroll suave de toda la pagina) y
          // termina ignorando el swipe -- pan-x le dice explicitamente que
          // ESTE elemento es quien maneja el paneo horizontal nativo.
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', touchAction: 'pan-x' }}
        >
          <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
          {slides.map((s, i) => {
            const url = mediaFor(s);
            return (
              <div key={i} className="relative h-full w-full shrink-0 snap-center">
                {url.endsWith('.mp4') ? (
                  <video
                    src={url} autoPlay loop muted playsInline
                    onError={() => markFailed(s.media)}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <PhotoImage
                    src={url} alt="" sizes="100vw" loading={i === idx ? 'eager' : 'lazy'} fetchPriority={i === idx ? 'high' : 'auto'}
                    onError={() => markFailed(s.media)}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
      {/* Scrim en banda: el hero es una composición de dos columnas — texto a
          la izquierda, foto entera respirando a la derecha (donde además cae
          la tarjeta de cristal). Antes eran dos degradados escritos a mano
          aquí mismo; ahora es la misma clase que usa cualquier otra banda del
          sitio, así que el hero y la Agenda por fin oscurecen igual. */}
      <div className="scrim-band" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 h-full flex items-center pt-28 pb-20">
        <div className="grid lg:grid-cols-[1fr_340px] gap-12 lg:gap-16 items-center w-full">

          {/* Texto editorial — izquierda. Cambia con cada slide del carrusel.
              min-height fija + contenido centrado: cada slide mide distinto
              y sin esto el bloque (y la card vecina) brincan sin animación */}
          <motion.div className="text-left">
            <div className="min-h-[340px] md:min-h-[420px] lg:min-h-[460px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                variants={SLIDE_ANIM}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <motion.div variants={RISE} className="mb-6 text-white/80 text-15 font-semibold">
                  {slide.label}
                </motion.div>
                <h1 className={`${titleSize} text-white`}>
                  {[slide.l1, slide.l2].filter(Boolean).map((line, li) => (
                    // pb/-mb: deja respirar los descendentes (g, j, p)
                    // dentro de la máscara sin abrir el interlineado
                    <span key={li} className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
                      <motion.span variants={LINE} className="block">
                        {line}
                      </motion.span>
                    </span>
                  ))}
                </h1>
                {displaySubtitle && (
                  <motion.p variants={RISE} className="mt-8 max-w-xl text-17 md:text-20 leading-relaxed text-white/80 font-medium line-clamp-2">
                    {displaySubtitle}
                  </motion.p>
                )}
                {slide.schedule && (
                  <motion.p variants={RISE} className="mt-4 text-14 font-semibold text-white/60">
                    {slide.schedule}
                  </motion.p>
                )}
                {slide.ctaText && (
                <motion.div variants={RISE}>
                  {slide.ctaUrl?.startsWith('http') ? (
                    <motion.a
                      href={slide.ctaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      {...PRESS_PRIMARY}
                      className="mt-9 inline-flex items-center gap-3 px-7 py-4 rounded-pill liquid-glass text-white text-15 font-bold focus-ring"
                    >
                      {slide.ctaText}
                    </motion.a>
                  ) : slide.ctaUrl?.startsWith('/') ? (
                    <MotionLink
                      to={slide.ctaUrl}
                      {...PRESS_PRIMARY}
                      className="mt-9 inline-flex items-center gap-3 px-7 py-4 rounded-pill liquid-glass text-white text-15 font-bold focus-ring"
                    >
                      {slide.ctaText}
                    </MotionLink>
                  ) : (
                    <motion.button
                      onClick={onPlan}
                      {...PRESS_PRIMARY}
                      className="mt-9 inline-flex items-center gap-3 px-7 py-4 rounded-pill liquid-glass text-white text-15 font-bold focus-ring"
                    >
                      {slide.ctaText}
                    </motion.button>
                  )}
                </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
            </div>

            {/* Dots + anterior/siguiente — saltar a cualquier slide, o deslizar/hacer
                scroll horizontal directo sobre las fotos (touch, trackpad) */}
            {slides.length > 1 && (
              <div className="mt-10 flex items-center gap-4">
                <div className="flex gap-2.5" role="tablist" aria-label="Slides del hero">
                  {slides.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      aria-label={`Ir a slide ${i + 1}: ${s.l1}`}
                      className={`h-1.5 rounded-full transition-all duration-500 focus-ring ${
                        i === idx ? 'w-9 bg-white' : 'w-3.5 bg-white/30 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <motion.button
                    {...PRESS_MICRO}
                    onClick={() => goTo((idx - 1 + slides.length) % slides.length)}
                    className="px-4 h-8 rounded-full liquid-glass flex items-center justify-center text-white/70 hover:text-white text-12 font-bold"
                  >
                    Anterior
                  </motion.button>
                  <motion.button
                    {...PRESS_MICRO}
                    onClick={() => goTo((idx + 1) % slides.length)}
                    className="px-4 h-8 rounded-full liquid-glass flex items-center justify-center text-white/70 hover:text-white text-12 font-bold"
                  >
                    Siguiente
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Tarjeta de cristal claro — próximo evento real de /events (Frame 1).
              El wrapper lleva la coreografía de scroll de la sección. */}
          <motion.div
            className="animate-hero-4 max-w-[340px] w-full justify-self-start lg:justify-self-end"
          >
          {/* Sin `glass`: esta card es glass-light (blanco/crema) — el
              vidrio WebGL está afinado en tono azul para el liquid-glass
              oscuro, chocaría aquí en la tarjeta más visible del sitio.
              Sin Tilt tampoco: el Tilt es la señal de "esto se puede tocar" y
              esta tarjeta no navega a ningún lado — navegan los dos botones
              de adentro. El bisel del cristal vive en .glass-light, no en Tilt. */}
          <div className="glass-light rounded-[22px] p-7 md:p-8">
            {/* El bloque de evento solo existe con un evento REAL de la API;
                sin datos, la tarjeta queda solo con sus CTAs (que sí son
                reales) en vez de mostrar un evento de mentira. */}
            {nextEvent && (
              <>
                <div className="text-13 font-semibold text-bg/60 mb-3">
                  {eventLabel}
                </div>
                <div className="flex items-center gap-4 text-bg">
                  <div className="text-center shrink-0">
                    <div className="text-44 font-bold leading-none tracking-tighter">{nextEvent.day}</div>
                    <div className="text-11 font-bold tracking-widest mt-1">{nextEvent.month}</div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-17 font-bold leading-tight">{nextEvent.title}</p>
                    <p className="mt-1 text-13 font-semibold text-bg/70">{nextEvent.time}</p>
                    {nextEvent.loc && <p className="text-13 font-semibold text-bg/70">{nextEvent.loc}</p>}
                  </div>
                </div>
              </>
            )}

            <div className={`${nextEvent ? 'mt-6' : ''} flex flex-col gap-2.5`}>
              <MotionLink
                to="/conectate"
                {...PRESS_PRIMARY}
                className="w-full inline-flex items-center justify-center gap-2 rounded-pill bg-white text-bg px-5 py-3.5 text-14 font-bold focus-ring shadow-card"
              >
                Conéctate
              </MotionLink>
              {/* De apoyo: el blanco de arriba es la acción principal de la
                  tarjeta, así que este confirma el tap pero no se levanta. */}
              <MotionLink
                to="/events"
                {...PRESS_SECONDARY}
                className="w-full inline-flex items-center justify-center gap-2 rounded-pill bg-bg/10 text-bg px-5 py-3.5 text-14 font-bold focus-ring hover:bg-bg/15 transition-colors"
              >
                Ver todos los eventos
              </MotionLink>
            </div>
          </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// 1.5 · ANUNCIOS — lo que los admins publican en el panel aparece aquí.
// Sin anuncios activos la franja no existe (feed 100% curado).
// ════════════════════════════════════════════════════════════════════
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
  const gallery = useApi('/gallery/?limit=200');
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
        <MotionLink to="/gallery" {...PRESS_SECONDARY} className="inline-flex items-center justify-center gap-3 px-6 py-4 rounded-full liquid-glass text-white font-bold hover:bg-white/10 transition-colors border border-white/20 shrink-0">
          Explorar Galería
        </MotionLink>
      </div>

      <SceneCarousel items={topAlbums.map(([title, photos]) => ({ key: title, title, image: photos[0].url, count: photos.length }))} label="Álbumes de la comunidad" photoPreview empty="Sin álbumes publicados aún." renderContent={album => <>
        <h3 className="text-24 sm:text-28 font-bold line-clamp-2">{album.title}</h3><p className="mt-4 text-14 text-white/80">Explora las fotografías de este álbum.</p>
        <Link to={`/gallery?album=${encodeURIComponent(album.title)}`} className="btn-spring inline-flex mt-6 min-h-11 items-center rounded-pill bg-white px-6 text-14 font-bold text-bg focus-ring">Explorar álbum</Link>
      </>} />
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════
export default function Home() {
  // The location keeps its administrator-owned background slot.
  const navigate = useNavigate();
  // Fallback del CTA del hero (si un slide del backend trae un ctaUrl no
  // navegable): la acción de primer contacto es Conéctate, no un scroll.
  const handlePlan = () => navigate('/conectate');

  return (
    <main className="w-full">
      <HeroCarousel onPlan={handlePlan} />
      <AnnouncementsBar />
      <Agenda />
      <CelulasSection />
      <MensajesCarousel />
      <GalleryPreviewSection />
      <SocialSection title="Lo que está pasando." />
      <VisitExperience home />
    </main>
  );
}
