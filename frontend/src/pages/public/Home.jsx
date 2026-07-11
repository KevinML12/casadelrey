import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Icon, Eyebrow } from '../../components/ui/Glass';
import Reveal, { RevealList, RevealItem } from '../../components/ui/Reveal';
import apiClient from '../../lib/apiClient';
import { useApi, useBackdrops, groupAlbums, fetchOnce } from '../../lib/feed';

// 3D — chunk aparte, solo se descarga si el dispositivo califica
// (el campo de partículas global vive en App.jsx, vía StarField)
const GlobeHero = lazy(() => import('../../components/three/GlobeHero'));
import use3D from '../../components/three/use3D';
import Tilt from '../../components/ui/Tilt';
import ParallaxImg from '../../components/ui/ParallaxImg';

const MotionLink = motion.create(Link);

// Física de resorte compartida para botones (hundir al presionar, rebotar al soltar)
const PRESS = {
  whileHover: { scale: 1.04 },
  whileTap: { scale: 0.94 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
};

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
  ctaText: 'Planifica tu visita', ctaUrl: '#',
};

const fmtEventDate = (d) =>
  new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

// ── Coreografía del carrusel ──────────────────────────────────────
// Entrada en cascada (label → título → subtítulo → CTA) con las líneas
// del título emergiendo desde una máscara; salida rápida hacia arriba.
const EASE_OUT = [0.16, 1, 0.3, 1];   // expo-out: llega suave
const EASE_IN  = [0.6, 0, 0.8, 1];    // salida decidida

const SLIDE_ANIM = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
  exit:   { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
};
const RISE = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.6,  ease: EASE_OUT } },
  exit:   { opacity: 0, y: -24, transition: { duration: 0.28, ease: EASE_IN } },
};
// Máscara de línea: el texto sube desde detrás de un overflow-hidden
const LINE = {
  hidden: { y: '115%' },
  show:   { y: '0%',   transition: { duration: 0.9,  ease: EASE_OUT } },
  exit:   { y: '-115%', transition: { duration: 0.35, ease: EASE_IN } },
};

// Fallback si /events no responde — mismo shape que el mapeo de la API
const NEXT_EVENT_DEFAULT = {
  day: '15', month: 'AGO', title: 'Noche de Jóvenes',
  time: 'Viernes · 7:30 PM', loc: 'Auditorio Central',
};

function HeroCarousel({ onPlan }) {
  const [slides, setSlides] = useState([SLIDE_FALLBACK]);
  const [idx, setIdx] = useState(0);
  const [nextEvent, setNextEvent] = useState(NEXT_EVENT_DEFAULT);
  const [eventLabel, setEventLabel] = useState('Próximo evento');
  const [failed, setFailed] = useState({});
  // El globo 3D solo en desktop con mouse y sin reduced-motion
  const show3D = use3D();
  // Carril horizontal real: las fotos viven aquí, se navegan con
  // swipe/scroll/trackpad — no solo con los dots. El texto (abajo)
  // se mantiene fijo y solo cambia de contenido según qué slide
  // quedó centrado, sincronizado por scroll listener.
  const trackRef = useRef(null);
  const isSyncing = useRef(false);

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
  // isSyncing evita que el listener de scroll (abajo) rebote el idx
  // mientras la animación programática todavía está en camino.
  const goTo = (i) => {
    const track = trackRef.current;
    if (!track) return;
    isSyncing.current = true;
    track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
    setIdx(i);
    setTimeout(() => { isSyncing.current = false; }, 700);
  };

  // El usuario desliza/hace scroll con el trackpad o el dedo → detecta
  // qué slide quedó centrado y sincroniza el texto + los dots.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf;
    const onScroll = () => {
      if (isSyncing.current) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const i = Math.round(track.scrollLeft / track.clientWidth);
        setIdx(prev => (prev === i ? prev : i));
      });
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => { track.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  // Autorotación cada 8s — programa el scroll real (no solo el índice),
  // así el carril y los dots siempre concuerdan con lo que se ve.
  useEffect(() => {
    if (slides.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => {
      setIdx(i => { const next = (i + 1) % slides.length; goTo(next); return next; });
    }, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  const slide = slides[Math.min(idx, slides.length - 1)];
  // Si el media remoto falla, la foto local sostiene el liquid glass
  const mediaFor = (s) => failed[s.media] ? LOCAL_MEDIA : (s.media || LOCAL_MEDIA);
  const markFailed = (url) => setFailed(f => ({ ...f, [url]: true }));

  // Coreografía de scroll: la foto se aleja y agranda lentamente,
  // el contenido sube y se desvanece a otra velocidad (profundidad real)
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const bgY       = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);
  const bgScale   = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const textY     = useTransform(scrollYProgress, [0, 1], [0, -110]);
  const textFade  = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const cardY     = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const cardFade  = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={heroRef} id="inicio" className="relative min-h-[100svh] overflow-hidden bg-bg">
      {/* Carril horizontal REAL: cada slide es una ventana de 100vw que se
          navega deslizando (touch, trackpad, scrollbar) — no solo con los
          dots. El wrapper externo lleva el parallax de scroll de página
          (Ken Burns al bajar); el carril interno es scroll-snap propio. */}
      <motion.div style={{ y: bgY, scale: bgScale }} className="absolute inset-0">
        <div
          ref={trackRef}
          className="h-full w-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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
                  <img
                    src={url} alt=""
                    onError={() => markFailed(s.media)}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
      {/* Scrims: legibilidad del texto sin apagar la foto */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg/70 via-bg/20 to-transparent pointer-events-none" />

      {/* Globo 3D — "Luz para las Naciones" girando detrás del contenido */}
      {show3D && (
        <Suspense fallback={null}>
          <div className="absolute z-[5] top-[6%] right-[-14%] w-[780px] h-[780px] mix-blend-screen opacity-70 pointer-events-none">
            <GlobeHero />
          </div>
        </Suspense>
      )}

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 min-h-[100svh] flex items-center pt-32 pb-24">
        <div className="grid lg:grid-cols-[1fr_340px] gap-12 lg:gap-16 items-center w-full">

          {/* Texto editorial — izquierda. Cambia con cada slide del carrusel.
              min-height fija + contenido centrado: cada slide mide distinto
              y sin esto el bloque (y la card vecina) brincan sin animación */}
          <motion.div style={{ y: textY, opacity: textFade }} className="text-left">
            <div className="min-h-[340px] md:min-h-[420px] lg:min-h-[460px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                variants={SLIDE_ANIM}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <motion.div variants={RISE} className="mb-6 text-white/80 text-[15px] font-semibold">
                  {slide.label}
                </motion.div>
                <h1
                  className="display-mega text-white"
                  style={{ fontSize: 'clamp(3rem, 8vw, 7.5rem)', lineHeight: '1' }}
                >
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
                {slide.subtitle && (
                  <motion.p variants={RISE} className="mt-8 max-w-xl text-[17px] md:text-[20px] leading-relaxed text-white/80 font-medium">
                    {slide.subtitle}
                  </motion.p>
                )}
                {slide.schedule && (
                  <motion.p variants={RISE} className="mt-4 text-[14px] font-semibold text-white/60">
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
                      {...PRESS}
                      className="mt-9 inline-flex items-center gap-3 px-7 py-4 rounded-pill liquid-glass text-white text-[15px] font-bold focus-ring"
                    >
                      {slide.ctaText}
                      <Icon name="arrow" className="w-4 h-4" stroke={2} />
                    </motion.a>
                  ) : slide.ctaUrl?.startsWith('/') ? (
                    <MotionLink
                      to={slide.ctaUrl}
                      {...PRESS}
                      className="mt-9 inline-flex items-center gap-3 px-7 py-4 rounded-pill liquid-glass text-white text-[15px] font-bold focus-ring"
                    >
                      {slide.ctaText}
                      <Icon name="arrow" className="w-4 h-4" stroke={2} />
                    </MotionLink>
                  ) : (
                    <motion.button
                      onClick={onPlan}
                      {...PRESS}
                      className="mt-9 inline-flex items-center gap-3 px-7 py-4 rounded-pill liquid-glass text-white text-[15px] font-bold focus-ring"
                    >
                      {slide.ctaText}
                      <Icon name="arrow" className="w-4 h-4" stroke={2} />
                    </motion.button>
                  )}
                </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
            </div>

            {/* Dots + flechas — saltar a cualquier slide, o deslizar/hacer
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
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => goTo((idx - 1 + slides.length) % slides.length)}
                    aria-label="Slide anterior"
                    className="w-8 h-8 rounded-full liquid-glass flex items-center justify-center text-white/70 hover:text-white"
                  >
                    <Icon name="arrow" className="w-3.5 h-3.5 rotate-180" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => goTo((idx + 1) % slides.length)}
                    aria-label="Siguiente slide"
                    className="w-8 h-8 rounded-full liquid-glass flex items-center justify-center text-white/70 hover:text-white"
                  >
                    <Icon name="arrow" className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Tarjeta de cristal claro — próximo evento real de /events (Frame 1).
              El wrapper lleva la coreografía de scroll; el Tilt interno la
              inclinación 3D al cursor (no pueden compartir elemento). */}
          <motion.div
            style={{ y: cardY, opacity: cardFade }}
            className="animate-hero-4 max-w-[340px] w-full justify-self-start lg:justify-self-end"
          >
          {/* Sin `glass`: esta card es glass-light (blanco/crema) — el
              vidrio WebGL está afinado en tono azul para el liquid-glass
              oscuro, chocaría aquí en la tarjeta más visible del sitio */}
          <Tilt max={7} className="glass-light rounded-[22px] p-7 md:p-8">
            <div className="text-[13px] font-semibold text-bg/60 mb-3">
              {eventLabel}
            </div>
            <div className="flex items-center gap-4 text-bg">
              <div className="text-center shrink-0">
                <div className="text-[44px] font-extrabold leading-none tracking-tighter">{nextEvent.day}</div>
                <div className="text-[11px] font-bold tracking-widest mt-1">{nextEvent.month}</div>
              </div>
              <div className="min-w-0">
                <p className="text-[17px] font-bold leading-tight">{nextEvent.title}</p>
                <p className="mt-1 text-[13px] font-semibold text-bg/70">{nextEvent.time}</p>
                {nextEvent.loc && <p className="text-[13px] font-semibold text-bg/70">{nextEvent.loc}</p>}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <motion.button
                onClick={onPlan}
                {...PRESS}
                className="w-full inline-flex items-center justify-center gap-2 rounded-pill bg-white text-bg px-5 py-3.5 text-[14px] font-bold focus-ring shadow-card"
              >
                Planifica tu visita
                <Icon name="arrow" className="w-4 h-4" stroke={2} />
              </motion.button>
              <MotionLink
                to="/events"
                {...PRESS}
                className="w-full inline-flex items-center justify-center gap-2 rounded-pill bg-bg/10 text-bg px-5 py-3.5 text-[14px] font-bold focus-ring hover:bg-bg/15 transition-colors"
              >
                <Icon name="calendar" className="w-4 h-4" />
                Ver todos los eventos
              </MotionLink>
            </div>
          </Tilt>
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
  const now = Date.now();
  const list = (Array.isArray(data) ? data : [])
    .filter(a => !a.expires_at || new Date(a.expires_at).getTime() > now)
    .slice(0, 2);

  if (list.length === 0) return null;

  return (
    <section className="relative bg-bg border-t border-white/5 py-10">
      <div className="relative z-10 max-w-6xl mx-auto px-6 flex flex-col gap-4">
        {list.map((a, i) => (
          <Reveal key={a.ID} delay={i * 0.08}>
            <Tilt max={3} glass="standard" className="liquid-glass rounded-[18px] px-6 py-5 flex items-start md:items-center gap-5">
              <div className="w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                <Icon name="spark" className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[16px] font-bold text-white leading-tight">{a.title}</p>
                <p className="text-[14px] text-white/70 mt-1 line-clamp-2">{a.content}</p>
              </div>
            </Tilt>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// 2 · AGENDA (Eventos)
// ════════════════════════════════════════════════════════════════════
function Agenda({ bg }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    apiClient.get('/events/')
      .then(res => {
        if (res.data && res.data.length > 0) {
          const formatted = res.data.map(ev => {
            const date = new Date(ev.date + 'T12:00:00');
            return {
              id: ev.ID,
              day: date.getDate().toString(),
              month: date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase(),
              title: ev.title,
              time: ev.time || 'Por definir',
              loc: ev.location,
              isFeatured: ev.is_featured
            };
          });
          setEvents(formatted);
        } else {
          throw new Error("Empty events");
        }
      })
      .catch(err => {
        setEvents([
          { id: 1, day: '15', month: 'AGO', title: 'Noche de Jóvenes', time: 'Viernes · 7:30 PM', loc: 'Auditorio Central', isFeatured: true },
          { id: 2, day: '18', month: 'AGO', title: 'Encuentro de Líderes', time: 'Jueves · 6:00 PM', loc: 'Salón 2', isFeatured: false },
          { id: 3, day: '23', month: 'AGO', title: 'Retiro "Reinicio"', time: 'Sábado · Todo el día', loc: 'Casa de campo', isFeatured: false }
        ]);
      });
  }, []);

  if (events.length === 0) return null;

  const featured = events.find(e => e.isFeatured) || events[0];
  const others = events.filter(e => e.id !== featured.id).slice(0, 3);

  return (
    <section id="agenda" className="relative min-h-[80svh] bg-bg overflow-hidden flex items-center border-t border-white/5">
      <ParallaxImg src={bg} alt="Eventos" className="opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/40 to-bg/10" />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 py-20">
        <div className="flex flex-col justify-center">
          <Reveal>
            <div className="text-white/70 text-[14px] font-semibold mb-4">
              Agenda mensual
            </div>
            <h2 className="display-mega text-white leading-[0.85] tracking-tighter mb-8" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
              PRÓXIMOS<br />EVENTOS
            </h2>
          </Reveal>
          <MotionLink
            to="/events"
            {...PRESS}
            className="mb-12 inline-flex items-center gap-3 self-start px-6 py-3.5 rounded-pill liquid-glass text-white text-[14px] font-bold focus-ring"
          >
            Ver calendario completo
            <Icon name="arrow" className="w-4 h-4" stroke={2} />
          </MotionLink>
          
          <Reveal delay={0.1}>
          <Tilt max={4} glass="featured" className="rounded-[24px] p-8 md:p-10 liquid-glass flex flex-col md:flex-row items-center gap-8">
            <div className="text-center shrink-0">
              <div className="text-[72px] font-extrabold text-white leading-none tracking-tighter">{featured.day}</div>
              <div className="text-[14px] font-bold text-white tracking-widest mt-2">{featured.month}</div>
            </div>
            <div className="flex-1 w-full text-center md:text-left">
              <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[12px] font-semibold mb-3 inline-block">Destacado</span>
              <h3 className="text-[28px] font-bold text-white tracking-tight mb-3">{featured.title}</h3>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-[14px] text-white/60">
                <span className="flex items-center gap-1.5"><Icon name="clock" className="w-4 h-4" /> {featured.time}</span>
                <span className="flex items-center gap-1.5"><Icon name="pin" className="w-4 h-4" /> {featured.loc}</span>
              </div>
            </div>
          </Tilt>
          </Reveal>
        </div>

        <Reveal from="right">
        <Tilt max={3} glass="standard" className="liquid-glass rounded-[24px] p-8 md:p-12 border border-white/10">
          <div className="text-white/50 text-[14px] font-semibold mb-8">
            También este mes
          </div>
          <RevealList className="space-y-4">
            {others.map((ev) => (
              <RevealItem key={ev.id} className="group rounded-[18px] bg-transparent border border-white/5 p-6 flex flex-col sm:flex-row items-center sm:items-center gap-6 cursor-pointer hover:bg-white/10 transition-colors btn-spring">
                <div className="text-center sm:text-left shrink-0">
                  <div className="text-[32px] font-extrabold text-white leading-none">{ev.day}</div>
                  <div className="text-[10px] text-white font-bold tracking-widest mt-1">{ev.month}</div>
                </div>
                <div className="hidden sm:block w-px h-12 bg-white/10" />
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-[18px] font-bold text-white mb-1">{ev.title}</h3>
                  <div className="flex items-center justify-center sm:justify-start gap-4 text-[13px] text-white/50 font-medium">
                    <span className="flex items-center gap-1.5"><Icon name="clock" className="w-3.5 h-3.5" /> {ev.time}</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/40 group-hover:text-white group-hover:bg-white/20 transition-all shrink-0">
                  <Icon name="arrow" className="w-4 h-4" />
                </div>
              </RevealItem>
            ))}
          </RevealList>
        </Tilt>
        </Reveal>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// 3 · CÉLULAS Y COMUNIDAD
// ════════════════════════════════════════════════════════════════════
function CelulasSection({ bg }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    apiClient.get('/cell-categories')
      .then(res => {
        if (res.data && res.data.length > 0) setCategories(res.data);
        else throw new Error("No categories");
      })
      .catch(err => {
        setCategories([
          { name: 'Adolescentes', age_group: '15 a 24 años', description: 'Reuniones dinámicas para adolescentes.', image_url: '/images/celulas/adolescentes.jpg' },
          { name: 'Jóvenes Adultos', age_group: 'Solteros', description: 'Comunidad para jóvenes profesionales y universitarios.', image_url: '/images/celulas/jovenes.jpg' },
          { name: 'Prejuveniles', age_group: '12 a 15 años', description: 'Un espacio seguro y divertido para crecer.', image_url: '/images/celulas/prejuveniles.jpg' },
          { name: 'Varones', age_group: 'Hombres', description: 'Hombres compartiendo la palabra y construyendo familia.', image_url: '/images/celulas/varones.jpg' },
          { name: 'Mujeres', age_group: 'Mujeres', description: 'Un espacio de formación espiritual, apoyo mutuo y hermandad.', image_url: '/images/celulas/mujeres.jpg' }
        ]);
      });
  }, []);

  if (categories.length === 0) return null;

  return (
    <section id="celulas" className="relative py-28 md:py-36 bg-bg border-t border-white/5 overflow-hidden">
      <ParallaxImg src={bg} alt="Comunidad" className="opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <Reveal className="mb-16 text-center">
          <Eyebrow>Comunidad</Eyebrow>
          <h2 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}>
            Células
          </h2>
          <p className="mt-6 text-[18px] text-white/70 max-w-2xl mx-auto">
            Grupos que se reúnen en casas durante la semana. Cada clasificación
            tiene sus propias células — entra y encuentra la tuya.
          </p>
          <MotionLink
            to="/celulas"
            {...PRESS}
            className="mt-8 inline-flex items-center gap-3 px-6 py-3.5 rounded-pill liquid-glass text-white text-[14px] font-bold focus-ring"
          >
            Encuentra tu célula
            <Icon name="arrow" className="w-4 h-4" stroke={2} />
          </MotionLink>
        </Reveal>

        <RevealList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 auto-rows-[minmax(180px,auto)]">
          {categories.map((cat, i) => {
            let gridSpan = 'md:col-span-1';
            if (i === 0) gridSpan = 'md:col-span-2 md:row-span-2 lg:col-span-2';
            else if (i === categories.length - 1 && categories.length % 2 !== 0) gridSpan = 'md:col-span-2 lg:col-span-2';

            return (
            <RevealItem key={i} className={gridSpan}>
            <Tilt
              as={Link}
              to={`/celulas?tipo=${encodeURIComponent(cat.name)}`}
              max={5}
              glass={i === 0 ? 'featured' : 'standard'}
              className="group relative rounded-[24px] flex flex-col liquid-glass h-full"
            >
              <div className="absolute inset-0 rounded-[24px] overflow-hidden opacity-60 group-hover:opacity-100 transition-opacity duration-700">
                <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/40 to-bg/10" />
              </div>
              <div className="relative z-10 w-full h-full p-8 flex flex-col justify-end text-left min-h-[200px]">
                <div>
                  <span className="bg-white/10 border border-white/20 text-white/90 px-3 py-1 rounded-full text-[12px] font-semibold mb-4 inline-block backdrop-blur-md">
                    {cat.age_group}
                  </span>
                  <h3 className={`font-bold text-white mb-2 tracking-tight ${i === 0 ? 'text-[40px]' : 'text-[24px]'}`}>{cat.name}</h3>
                  <p className={`text-white/80 ${i === 0 ? 'text-[16px] max-w-sm' : 'text-[14px] max-w-xs'}`}>{cat.description}</p>
                </div>
              </div>
            </Tilt>
            </RevealItem>
            );
          })}
        </RevealList>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// 4 · MENSAJES (Prédicas en Liquid Glass)
// ════════════════════════════════════════════════════════════════════
// Sin fallback de títulos inventados: la sección solo existe si hay
// posts reales del blog (ver `if (sermons.length === 0) return null`
// más abajo) — mostrar "El Precio del Propósito" como si fuera un
// sermón real cuando la API falla contradice "nada estático".

function MensajesCarousel({ bg }) {
  const [sermons, setSermons] = useState([]);

  useEffect(() => {
    // Preview del BLOG: lo que los admins publican ahí (incluidos los
    // posts que redirigen a redes) es lo que se asoma en el Home
    fetchOnce('/blog/').then(blog => {
      const posts = (Array.isArray(blog) ? blog : [])
        .slice(0, 8)
        .map((p, i) => ({
          id: p.ID || p.id,
          title: p.title,
          date: p.CreatedAt
            ? new Date(p.CreatedAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
            : '',
          image: p.cover_image || `/images/predicas/predica-${(i % 3) + 1}.jpg`,
          ...(p.redirect_url
            ? { href: p.redirect_url }
            : { to: p.slug ? `/blog/${p.slug}` : '/blog' }),
        }));
      if (posts.length > 0) setSermons(posts);
    });
  }, []);

  if (sermons.length === 0) return null;

  return (
    <section id="mensajes" className="relative py-20 md:py-32 bg-bg border-t border-white/5 overflow-hidden">
      <ParallaxImg src={bg} alt="Mensajes Background" className="opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-bg/20" />

      <Reveal className="relative z-10 max-w-6xl mx-auto px-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Eyebrow>Últimas Prédicas</Eyebrow>
          <h2 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}>
            Alimenta tu espíritu.
          </h2>
        </div>
        <MotionLink
          to="/blog"
          {...PRESS}
          className="inline-flex items-center gap-3 self-start md:self-auto px-6 py-3.5 rounded-pill liquid-glass text-white text-[14px] font-bold focus-ring shrink-0"
        >
          Ver todas las enseñanzas
          <Icon name="arrow" className="w-4 h-4" stroke={2} />
        </MotionLink>
      </Reveal>

      <div className="relative z-10 flex overflow-x-auto gap-6 px-6 pb-12 snap-x snap-mandatory scrollbar-hide" style={{ scrollPaddingLeft: '1.5rem', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
        <div className="w-[1px] shrink-0 md:w-[calc((100vw-72rem)/2)] hidden md:block" />
        
        {sermons.map((s) => (
          <Tilt
            key={s.id}
            max={5}
            glass="standard"
            {...(s.href
              ? { as: 'a', href: s.href, target: '_blank', rel: 'noopener noreferrer' }
              : { as: Link, to: s.to })}
            className="group relative shrink-0 w-[300px] md:w-[400px] aspect-[4/5] md:aspect-video rounded-[24px] liquid-glass hover:border-white/30 snap-start overflow-hidden"
          >
            <img src={s.image} alt={s.title} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/20 to-transparent" />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full liquid-glass flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform duration-500 shadow-xl">
                <Icon name="play" className="w-6 h-6 text-white ml-1" />
              </div>
            </div>

            <div className="absolute bottom-0 left-0 p-8 w-full z-10">
              <div className="text-[13px] font-semibold text-white/70 mb-2">{s.date}</div>
              <h3 className="text-[20px] md:text-[24px] font-bold text-white leading-tight">{s.title}</h3>
            </div>
          </Tilt>
        ))}
        <div className="w-6 shrink-0" />
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// 4.7 · FEED SOCIAL — el grid editorial que los admins arman en
// AdminSocial (small 1×1 · medium 2×1 · large 2×2) publicado tal cual.
// Fotos subidas por ellos (image_url), link a la publicación real.
// ════════════════════════════════════════════════════════════════════
const PLATFORM_ICON = { instagram: 'instagram', youtube: 'youtube', facebook: 'heart', tiktok: 'music' };
const FEED_SPAN = {
  small:  'col-span-1 row-span-1',
  medium: 'col-span-2 row-span-1',
  large:  'col-span-2 row-span-2',
};

const NETWORKS = [
  { href: 'https://www.facebook.com/casadelreyhuehue',  label: 'Facebook',  icon: 'heart' },
  { href: 'https://www.instagram.com/ig.casadelrey/',   label: 'Instagram', icon: 'instagram' },
  { href: 'https://www.tiktok.com/@leoneldeleongt',     label: 'TikTok',    icon: 'music' },
];

function FeedSection() {
  const data = useApi('/social/feed');
  const posts = (Array.isArray(data) ? data : []).filter(p => p.is_active !== false);

  return (
    <section id="feed" className="relative py-20 md:py-32 bg-bg border-t border-white/5 overflow-hidden">
      <Reveal className="relative z-10 max-w-6xl mx-auto px-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Eyebrow>Nuestro feed</Eyebrow>
          <h2 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}>
            Lo que está pasando.
          </h2>
        </div>
        <div className="flex gap-3 shrink-0">
          {NETWORKS.map(n => (
            <motion.a
              key={n.label}
              href={n.href}
              target="_blank"
              rel="noopener noreferrer"
              {...PRESS}
              className="w-12 h-12 rounded-full liquid-glass flex items-center justify-center text-white focus-ring"
              aria-label={n.label}
            >
              <Icon name={n.icon} className="w-5 h-5" />
            </motion.a>
          ))}
        </div>
      </Reveal>

      {posts.length > 0 && (
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <RevealList className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 auto-rows-[170px] md:auto-rows-[200px]">
            {posts.map(p => (
              <RevealItem key={p.ID} className={FEED_SPAN[p.featured_size] || FEED_SPAN.small}>
                <Tilt
                  as="a"
                  href={p.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  max={6}
                  glass={p.featured_size === 'large' ? 'featured' : 'standard'}
                  className="group relative block h-full rounded-[18px] overflow-hidden liquid-glass border border-white/5 hover:border-white/25"
                >
                  {p.image_url && (
                    <img
                      src={p.image_url}
                      alt={p.caption || p.platform}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-bg/85 via-bg/15 to-transparent" />
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-bg/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/80">
                    <Icon name={PLATFORM_ICON[p.platform] || 'spark'} className="w-4 h-4" />
                  </div>
                  {p.caption && (
                    <div className="absolute bottom-0 inset-x-0 p-4">
                      <p className="text-[13.5px] font-semibold text-white leading-snug line-clamp-2">{p.caption}</p>
                    </div>
                  )}
                </Tilt>
              </RevealItem>
            ))}
          </RevealList>
        </div>
      )}
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// 5 · UBICACIÓN (Visítanos)
// ════════════════════════════════════════════════════════════════════
function Ubicacion({ bg }) {
  return (
    <section id="ubicacion" className="relative py-24 md:py-36 bg-bg border-t border-white/5 overflow-hidden">
      <ParallaxImg src={bg} alt="Ubicación" className="opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-bg/20" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Titular editorial del cierre */}
        <Reveal className="text-center mb-14">
          <Eyebrow>Visítanos</Eyebrow>
          <h2 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)' }}>
            Te esperamos en casa.
          </h2>
        </Reveal>

        <div className="grid lg:grid-cols-[1.35fr_1fr] gap-6">
          {/* Dirección protagonista */}
          <Reveal from="left">
          <Tilt max={3} glass="featured" className="rounded-[24px] liquid-glass p-10 md:p-14 h-full flex flex-col justify-between gap-10">
            <div>
              <div className="flex items-center gap-3 text-white/60 text-[13px] font-bold mb-6">
                <span className="w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <Icon name="pin" className="w-5 h-5 text-white" />
                </span>
                Huehuetenango, Guatemala
              </div>
              <p className="display-mega text-white leading-[1.15]" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.6rem)' }}>
                7ª. Calle 12-66 zona 4,<br />
                carretera a las Ruinas<br />
                de Zaculeu
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <motion.a
                href="https://www.google.com/maps/search/?api=1&query=Casa+del+Rey+7a+Calle+12-66+zona+4+Huehuetenango"
                target="_blank"
                rel="noopener noreferrer"
                {...PRESS}
                className="inline-flex items-center gap-3 px-6 py-3.5 rounded-pill bg-white text-bg text-[14px] font-bold focus-ring shadow-card"
              >
                Cómo llegar
                <Icon name="arrow" className="w-4 h-4" stroke={2} />
              </motion.a>
              {NETWORKS.map(n => (
                <motion.a
                  key={n.label}
                  href={n.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...PRESS}
                  aria-label={n.label}
                  className="w-12 h-12 rounded-full liquid-glass flex items-center justify-center text-white focus-ring"
                >
                  <Icon name={n.icon} className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </Tilt>
          </Reveal>

          {/* Primera vez + podcast */}
          <div className="flex flex-col gap-6">
            <Reveal from="right" delay={0.05}>
            <Tilt max={4} glass="standard" className="rounded-[24px] liquid-glass p-9 md:p-10">
              <h3 className="text-[26px] font-bold text-white tracking-tight mb-3">¿Es tu primera vez?</h3>
              <p className="text-[15px] text-white/70 font-medium mb-7">
                Queremos conocerte. Escríbenos y te recibimos desde el primer minuto.
              </p>
              <motion.a
                href="https://www.instagram.com/ig.casadelrey/"
                target="_blank"
                rel="noopener noreferrer"
                {...PRESS}
                className="inline-flex items-center gap-3 px-6 py-3.5 rounded-pill liquid-glass text-white text-[14px] font-bold focus-ring hover:border-white/40"
              >
                <Icon name="instagram" className="w-4 h-4" />
                Escríbenos
              </motion.a>
            </Tilt>
            </Reveal>

            <Reveal from="right" delay={0.12}>
            <Tilt max={4} glass="standard" className="rounded-[24px] liquid-glass p-9 md:p-10 flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                <Icon name="music" className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[17px] font-bold text-white leading-tight">Podcast Inusual Youth</p>
                <p className="text-[13.5px] text-white/60 font-semibold mt-1">
                  92.9 FM Radio Stereo Cumbre · Viernes 3:00 PM
                </p>
              </div>
            </Tilt>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// 4.5 · GALERÍA (Preview)
// ════════════════════════════════════════════════════════════════════
// Álbumes reales de la iglesia (DOMINGOS 2026) como fallback sin API
const ALBUMS_FALLBACK = {
  'Alabanza': [{ url: '/images/albums/alabanza.jpg' }],
  'Danza':    [{ url: '/images/albums/danza.jpg' }],
  'Niños':    [{ url: '/images/albums/ninos.jpg' }],
  'Miembros': [{ url: '/images/albums/miembros.jpg' }],
};

function GalleryPreviewSection() {
  // Mismo fetch cacheado que usa useBackdrops — un solo GET /gallery/
  const gallery = useApi('/gallery/?limit=200');
  const photos = gallery?.data || gallery;
  const albums = Array.isArray(photos) && photos.length > 0
    ? groupAlbums(photos)
    : ALBUMS_FALLBACK;

  const topAlbums = Object.entries(albums).slice(0, 4); // Tomar solo los primeros 4 para el preview

  return (
    <section id="galeria-preview" className="relative py-20 md:py-32 bg-bg border-t border-white/5 overflow-hidden">

      <Reveal className="relative z-10 max-w-6xl mx-auto px-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Eyebrow>Galería</Eyebrow>
          <h2 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}>
            Momentos <span className="text-white">vivos</span>.
          </h2>
        </div>
        <MotionLink to="/gallery" {...PRESS} className="inline-flex items-center justify-center gap-3 px-6 py-4 rounded-full liquid-glass text-white font-bold hover:bg-white/10 transition-colors border border-white/20 shrink-0">
          Explorar Galería
          <Icon name="arrow" className="w-4 h-4" />
        </MotionLink>
      </Reveal>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <RevealList className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {topAlbums.map(([albumName, photos]) => (
            <RevealItem key={albumName}>
            <Tilt as={Link} to="/gallery" max={6} glass="standard" className="group relative rounded-[18px] overflow-hidden aspect-[4/5] liquid-glass block border border-white/5 hover:border-white/20">
              <img src={photos[0].url} alt={albumName} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/20 to-transparent" />
              <div className="absolute bottom-5 inset-x-5 flex justify-between items-end">
                <div>
                  <p className="text-white font-bold text-[18px] leading-tight line-clamp-1">{albumName}</p>
                  {photos.length > 1 && (
                    <p className="text-white/60 text-[12px] font-medium mt-1">{photos.length} fotos</p>
                  )}
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 group-hover:text-white group-hover:bg-white/20 transition-all shrink-0 backdrop-blur-md">
                  <Icon name="arrow" className="w-3 h-3" />
                </div>
              </div>
            </Tilt>
            </RevealItem>
          ))}
        </RevealList>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════
export default function Home() {
  // Fondos de sección curados desde la galería del admin (fallback local)
  const backdrops = useBackdrops();
  // "Planifica tu visita" lleva a la sección de ubicación/primera vez
  const handlePlan = () =>
    document.getElementById('ubicacion')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <main className="bg-bg w-full">
      {/* El polvo de luz 3D ("estrellitas") ya vive en App.jsx, global
          para todas las páginas públicas — aquí no hace falta montarlo */}
      <HeroCarousel onPlan={handlePlan} />
      <AnnouncementsBar />
      <Agenda bg={backdrops.agenda} />
      <CelulasSection bg={backdrops.celulas} />
      <MensajesCarousel bg={backdrops.mensajes} />
      <GalleryPreviewSection />
      <FeedSection />
      <Ubicacion bg={backdrops.ubicacion} />
    </main>
  );
}
