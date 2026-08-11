import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Reveal, { RevealList, RevealItem } from '../../components/ui/Reveal';
import apiClient from '../../lib/apiClient';
import { useApi, useSitePhoto, groupAlbums, fetchOnce } from '../../lib/feed';
import { useAuth } from '../../context/AuthContext';
import { saludo } from '../../lib/greeting';
// Vocabulario de movimiento compartido: la amplitud del press la decide el
// ROL del botón (primario / apoyo / micro-control), no el archivo. Antes
// vivía aquí como un `const PRESS` local que le daba la MISMA física al CTA
// blanco del hero y a los chips de redes del pie de Ubicación.
import { EASE_OUT, EASE_IN, PRESS_PRIMARY, PRESS_SECONDARY, PRESS_MICRO } from '../../lib/motion';

// 3D — chunk aparte, solo se descarga si el dispositivo califica
// (el campo de partículas global vive en App.jsx, vía StarField)
const GlobeHero = lazy(() => import('../../components/three/GlobeHero'));
import use3D from '../../components/three/use3D';
import Tilt from '../../components/ui/Tilt';
import ParallaxImg from '../../components/ui/ParallaxImg';
import SocialSection from '../../components/sections/SocialSection';

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

function HeroCarousel({ onPlan }) {
  const { user } = useAuth();
  const [slides, setSlides] = useState([SLIDE_FALLBACK]);
  const [idx, setIdx] = useState(0);
  // null = sin evento real que mostrar (la tarjeta oculta ese bloque);
  // nunca un evento inventado como placeholder — regla "nada estático".
  const [nextEvent, setNextEvent] = useState(null);
  const [eventLabel, setEventLabel] = useState('Próximo evento');
  const [failed, setFailed] = useState({});
  // El globo 3D solo en desktop con mouse y sin reduced-motion
  const show3D = use3D();
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
    <section ref={heroRef} id="inicio" className="relative h-[100svh] overflow-hidden bg-bg">
      {/* Carril horizontal REAL: cada slide es una ventana de 100vw que se
          navega deslizando (touch, trackpad, scrollbar) — no solo con los
          dots. El wrapper externo lleva el parallax de scroll de página
          (Ken Burns al bajar); el carril interno es scroll-snap propio. */}
      <motion.div style={{ y: bgY, scale: bgScale }} className="absolute inset-0">
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
      {/* Scrim en banda: el hero es una composición de dos columnas — texto a
          la izquierda, foto entera respirando a la derecha (donde además cae
          la tarjeta de cristal). Antes eran dos degradados escritos a mano
          aquí mismo; ahora es la misma clase que usa cualquier otra banda del
          sitio, así que el hero y la Agenda por fin oscurecen igual. */}
      <div className="scrim-band" />

      {/* Globo 3D — "Luz para las Naciones" girando detrás del contenido */}
      {show3D && (
        <Suspense fallback={null}>
          <div className="absolute z-[5] top-[6%] right-[-14%] w-[780px] h-[780px] mix-blend-screen opacity-70 pointer-events-none">
            <GlobeHero />
          </div>
        </Suspense>
      )}

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 h-full flex items-center pt-28 pb-20">
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
            style={{ y: cardY, opacity: cardFade }}
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
function Agenda({ bg }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Sin fallback inventado: si la API falla o no hay eventos, la sección
    // no existe (return null abajo) — regla "nada estático" de la guía.
    // Los eventos de mentira que vivían aquí venían del mockup de Figma.
    apiClient.get('/events/')
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : [];
        // Fecha local (no UTC -- toISOString() se adelanta un dia cerca de
        // medianoche en Guatemala, UTC-6), misma logica que EventsPage.jsx.
        // Sin esto, un evento que ya paso se quedaba pegado como
        // "Destacado" indefinidamente (bug real: is_featured nunca lo
        // marca ningun admin -- no hay control en el panel -- asi que
        // este siempre caia al primer evento de la lista, sin importar
        // si ya habia ocurrido).
        const now = new Date(); now.setHours(0, 0, 0, 0);
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const upcoming = list.filter(ev => !ev.date || ev.date >= todayStr);
        setEvents(upcoming.map(ev => {
          const date = new Date(ev.date + 'T12:00:00');
          return {
            id: ev.ID,
            day: date.getDate().toString(),
            month: date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase(),
            title: ev.title,
            time: ev.time || 'Por definir',
            loc: ev.location,
          };
        }));
      })
      .catch(() => {});
  }, []);

  if (events.length === 0) return null;

  // El mas proximo (el backend ya ordena ASC por fecha) es el destacado.
  const featured = events[0];
  const others = events.slice(1, 4);

  return (
    <section id="agenda" className="relative min-h-[80svh] bg-bg overflow-hidden flex items-center border-t border-white/5">
      {/* La foto va a plena fuerza: el contraste lo pone el scrim en banda,
          que oscurece la columna izquierda (donde vive el texto) y deja la
          foto entera a la derecha, debajo del panel. Antes la imagen llegaba
          al 60% y encima un degradado propio: la congregación se leía gris. */}
      <ParallaxImg src={bg} alt="Eventos" />
      <div className="scrim-band" />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 py-20">
        <div className="flex flex-col justify-center">
          {/* El titular NO se revela: es el punto fijo contra el que llegan
              las cards de abajo. Si también entra animado, no queda nada
              quieto en pantalla y el scroll se siente gelatinoso. */}
          <h2 className="text-d2 text-white mb-8">
            PRÓXIMOS<br />EVENTOS
          </h2>
          <MotionLink
            to="/events"
            {...PRESS_SECONDARY}
            className="mb-12 inline-flex items-center gap-3 self-start px-6 py-3.5 rounded-pill liquid-glass text-white text-14 font-bold focus-ring"
          >
            Ver calendario completo
          </MotionLink>
          
          <Reveal delay={0.1}>
          <Tilt as={Link} to={`/events?id=${featured.id}`} max={4} glass="featured" className="rounded-[22px] p-8 md:p-10 liquid-glass flex flex-col md:flex-row items-center gap-8 block">
            <div className="text-center shrink-0">
              {/* Uno de los cuatro trabajos del acento en todo el sitio: el
                  día del evento destacado. Es el único número que necesita
                  gritar, y gritarlo con color pesa menos que con tamaño. */}
              <div className="text-72 font-bold text-acento leading-none tracking-tighter">{featured.day}</div>
              <div className="text-14 font-bold text-white tracking-widest mt-2">{featured.month}</div>
            </div>
            <div className="flex-1 w-full text-center md:text-left">
              {/* Sin chip "Destacado": que sea el primero, el más grande y el
                  único con el día en acento ya lo dice. La etiqueta encima
                  del titular era la misma fórmula del eyebrow que se eliminó. */}
              <h3 className="text-28 font-bold text-white tracking-tight mb-3">{featured.title}</h3>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-14 text-white/60">
                <span>{featured.time}</span>
                <span>{featured.loc}</span>
              </div>
            </div>
          </Tilt>
          </Reveal>
        </div>

        <Reveal from="right">
        {/* Panel (contiene cards), no card: por eso el radio mayor. Y sin
            Tilt: no navega a ningún lado — navegan las filas de adentro. */}
        <div className="liquid-glass liquid-shine rounded-[28px] p-8 md:p-12 border border-white/10">
          <div className="text-white/50 text-14 font-semibold mb-8">
            También este mes
          </div>
          <RevealList className="space-y-4">
            {others.map((ev) => (
              <RevealItem key={ev.id}>
                <Link to={`/events?id=${ev.id}`} className="group rounded-[22px] bg-transparent border border-white/5 p-6 flex flex-col sm:flex-row items-center sm:items-center gap-6 cursor-pointer hover:bg-white/10 transition-colors btn-spring">
                  <div className="text-center sm:text-left shrink-0">
                    <div className="text-32 font-bold text-white leading-none">{ev.day}</div>
                    <div className="text-10 text-white font-bold tracking-widest mt-1">{ev.month}</div>
                  </div>
                  <div className="hidden sm:block w-px h-12 bg-white/10" />
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-18 font-bold text-white mb-1">{ev.title}</h3>
                    <div className="flex items-center justify-center sm:justify-start gap-4 text-13 text-white/50 font-medium">
                      <span>{ev.time}</span>
                    </div>
                  </div>
                </Link>
              </RevealItem>
            ))}
          </RevealList>
        </div>
        </Reveal>
      </div>
    </section>
  );
}

// Inclinaciones cíclicas para el collage de categorías — mismo lenguaje
// que CelulasPage/GalleryPage/PostCollage (COLLAGE/ROT determinístico).
const HOME_COLLAGE_ROT = [-2.0, 1.6, -1.4, 2.2, -1.8, 1.2];

// ════════════════════════════════════════════════════════════════════
// 3 · CÉLULAS Y COMUNIDAD
// ════════════════════════════════════════════════════════════════════
function CelulasSection() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    apiClient.get('/cell-categories')
      .then(res => {
        if (res.data && res.data.length > 0) setCategories(res.data);
        else throw new Error("No categories");
      })
      .catch(() => {
        // Fallback PERMITIDO por la guía: categorías estructurales reales
        // de la iglesia (no contenido inventado), con fotos reales.
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
    // Sin foto ambiental: el collage de abajo YA es puro material fotográfico.
    // Una foto de fondo detrás de una grilla de fotos no suma atmósfera, le
    // compite. El ritmo de la página lo hace la alternancia "sección CON foto
    // entera / sección sobre canvas limpio" — cuando todas llevan foto al 50%,
    // ninguna significa nada.
    <section id="celulas" className="relative py-28 md:py-36 bg-bg border-t border-white/5 overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* El titular es el ancla fija; lo que se revela al entrar son las
            cards de abajo, que llegan por debajo de él. */}
        <div className="mb-16 text-center">
          <h2 className="text-d2 text-white">
            Células
          </h2>
          <p className="mt-6 text-18 text-white/70 max-w-2xl mx-auto">
            Grupos que se reúnen en casas durante la semana. Cada clasificación
            tiene sus propias células — entra y encuentra la tuya.
          </p>
          <MotionLink
            to="/celulas"
            {...PRESS_SECONDARY}
            className="mt-8 inline-flex items-center gap-3 px-6 py-3.5 rounded-pill liquid-glass text-white text-14 font-bold focus-ring"
          >
            Encuentra tu célula
          </MotionLink>
        </div>

        {/* Collage (mismo lenguaje que Células/Galería/Blog): recortes
            inclinados que se enderezan al pasar el cursor, en vez de un
            grid parejo repetido. Cada card sigue enlazando directo a su
            tipo en /celulas (abre esa ventana ahí). */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 auto-rows-[minmax(180px,auto)]">
          {categories.map((cat, i) => {
            let gridSpan = 'md:col-span-1';
            if (i === 0) gridSpan = 'md:col-span-2 md:row-span-2 lg:col-span-2';
            else if (i === categories.length - 1 && categories.length % 2 !== 0) gridSpan = 'md:col-span-2 lg:col-span-2';
            const rot = HOME_COLLAGE_ROT[i % HOME_COLLAGE_ROT.length];

            return (
              <motion.div
                key={i}
                className={gridSpan}
                initial={{ opacity: 0, rotateX: 16, scale: 0.92 }}
                whileInView={{ opacity: 1, rotateX: 0, scale: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ type: 'spring', stiffness: 120, damping: 16, delay: (i % 6) * 0.06 }}
                style={{ transformPerspective: 1000, transformOrigin: 'center' }}
              >
                <Tilt
                  as={Link}
                  max={4}
                  scrollMax={3}
                  to={`/celulas?tipo=${encodeURIComponent(cat.name)}`}
                  whileHover={{ rotate: 0, scale: 1.03, zIndex: 30 }}
                  glass
                  className="liquid-glass group relative w-full h-full rounded-[22px] flex flex-col overflow-hidden ring-1 ring-white/10"
                  style={{ rotate: rot, transformOrigin: 'center' }}
                >
                  {/* Foto a plena fuerza: son las caras de la congregación, lo
                      único irrepetible que tiene el sitio. El texto se lee por
                      el scrim anclado abajo, no por apagar la imagen. */}
                  <div className="absolute inset-0 rounded-[22px] overflow-hidden">
                    <img src={cat.image_url} alt={cat.name} className="parallax-layer w-full h-full object-cover" />
                    <div className="scrim-card" />
                  </div>
                  <div className="relative z-10 w-full h-full p-8 flex flex-col justify-end text-left min-h-[200px]">
                    <div>
                      {/* El rango de edad va DEBAJO del nombre: encima era una
                          etiqueta de categoría sobre el titular, la misma
                          fórmula del eyebrow. El dato es real (viene de la
                          API) así que se conserva, solo cambia de lugar y
                          pierde la píldora decorativa. */}
                      <h3 className={`font-bold text-white mb-2 tracking-tight ${i === 0 ? 'text-40' : 'text-24'}`}>{cat.name}</h3>
                      <p className={`text-white/80 ${i === 0 ? 'text-16 max-w-sm' : 'text-14 max-w-xs'}`}>{cat.description}</p>
                      {cat.age_group && (
                        <p className="mt-3 text-13 font-semibold text-white/60">{cat.age_group}</p>
                      )}
                    </div>
                  </div>
                </Tilt>
              </motion.div>
            );
          })}
        </div>
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

function MensajesCarousel() {
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
    // Sobre canvas limpio, igual que Células y por la misma razón: el carril
    // de abajo ya son puras portadas fotográficas. La foto ambiental detrás
    // solo restaba contraste a las que sí importan.
    <section id="mensajes" className="relative py-20 md:py-32 bg-bg border-t border-white/5 overflow-hidden">
      {/* El titular queda quieto; lo que entra al hacer scroll es el carril. */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-d2 text-white">
            Alimenta tu espíritu.
          </h2>
        </div>
        <MotionLink
          to="/blog"
          {...PRESS_SECONDARY}
          className="inline-flex items-center gap-3 self-start md:self-auto px-6 py-3.5 rounded-pill liquid-glass text-white text-14 font-bold focus-ring shrink-0"
        >
          Ver todas las enseñanzas
        </MotionLink>
      </div>

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
            className="group relative shrink-0 w-[300px] md:w-[400px] aspect-[4/5] md:aspect-video rounded-[22px] liquid-glass hover:border-white/30 snap-start overflow-hidden"
          >
            {/* Portada a plena fuerza: el título se lee por el scrim anclado
                abajo, no porque la foto esté a media luz. */}
            <img src={s.image} alt={s.title} className="absolute inset-0 w-full h-full object-cover" />
            <div className="scrim-card" />

            <div className="absolute bottom-0 left-0 p-8 w-full z-10">
              <div className="text-13 font-semibold text-white/70 mb-2">{s.date}</div>
              <h3 className="text-20 md:text-24 font-bold text-white leading-tight">{s.title}</h3>
            </div>
          </Tilt>
        ))}
        <div className="w-6 shrink-0" />
      </div>
    </section>
  );
}

// Accesos directos a redes -- usados en la fila rápida de Ubicación más
// abajo. Solo nombre y destino: los pictogramas se eliminaron del sitio
// público (identidad del dueño) y el campo `icon` que quedaba aquí ya no
// lo leía nadie.
const NETWORKS = [
  { href: 'https://www.facebook.com/casadelreyhuehue',  label: 'Facebook' },
  { href: 'https://www.instagram.com/ig.casadelrey/',   label: 'Instagram' },
  { href: 'https://www.tiktok.com/@leoneldeleongt',     label: 'TikTok' },
];

// ════════════════════════════════════════════════════════════════════
// 5 · UBICACIÓN (Visítanos)
// ════════════════════════════════════════════════════════════════════
function Ubicacion({ bg }) {
  return (
    <section id="ubicacion" className="relative py-24 md:py-36 bg-bg border-t border-white/5 overflow-hidden">
      {/* Foto entera del templo, con el scrim anclado abajo: el contenido
          (titular + tarjetas) vive en el tercio inferior y ahí es donde
          oscurece. Antes la foto llegaba al 50% y encima un degradado propio. */}
      <ParallaxImg src={bg} alt="Ubicación" />
      <div className="scrim-card" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Titular editorial del cierre. Fijo (sin Reveal) y en una sola
            familia: el acento serif itálico que llevaba "en casa" no tiene
            @font-face propio en el proyecto (public/fonts solo trae Arimo),
            así que renderizaba New York, Georgia o Noto Serif según el
            sistema del visitante -- una firma tipográfica que no controlas
            no es una firma. Vuelve cuando haya serif auto-hospedada. */}
        <div className="text-center mb-14">
          <h2 className="text-d2 text-white">
            Te esperamos en casa.
          </h2>
        </div>

        <div className="grid lg:grid-cols-[1.35fr_1fr] gap-6">
          {/* Dirección protagonista */}
          <Reveal from="left">
          {/* Sin Tilt: la tarjeta no navega, navegan los botones de adentro. */}
          <div className="rounded-[22px] liquid-glass liquid-shine p-10 md:p-14 h-full flex flex-col justify-between gap-10">
            <div>
              <div className="text-white/60 text-13 font-semibold mb-6">
                Huehuetenango, Guatemala
              </div>
              <p className="text-d3 text-white">
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
                {...PRESS_PRIMARY}
                className="inline-flex items-center gap-3 px-6 py-3.5 rounded-pill bg-white text-bg text-14 font-bold focus-ring shadow-card"
              >
                Cómo llegar
              </motion.a>
              {/* Chips terciarios: antes tenían la MISMA física que el botón
                  blanco de al lado, y cuando todo reacciona igual la reacción
                  deja de comunicar jerarquía. */}
              {NETWORKS.map(n => (
                <motion.a
                  key={n.label}
                  href={n.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...PRESS_MICRO}
                  className="inline-flex items-center px-5 h-12 rounded-full liquid-glass text-white text-14 font-bold focus-ring"
                >
                  {n.label}
                </motion.a>
              ))}
            </div>
          </div>
          </Reveal>

          {/* Primera vez + podcast */}
          <div className="flex flex-col gap-6">
            <Reveal from="right" delay={0.05}>
            <div className="rounded-[22px] glass-light liquid-shine p-9 md:p-10">
              <h3 className="text-26 font-bold text-bg tracking-tight mb-3">¿Es tu primera vez?</h3>
              <p className="text-15 text-bg/60 font-medium mb-7">
                Queremos conocerte. Cuéntanos de ti y te recibimos desde el primer minuto.
              </p>
              <MotionLink
                to="/conectate"
                {...PRESS_PRIMARY}
                className="inline-flex items-center gap-3 px-6 py-3.5 rounded-pill bg-white text-bg text-14 font-bold focus-ring shadow-card hover:opacity-90"
              >
                Conéctate
              </MotionLink>
            </div>
            </Reveal>

            {/* Dato puro, sin destino: nunca fue tocable, así que tampoco
                debía inclinarse al cursor. */}
            <Reveal from="right" delay={0.12}>
            <div className="rounded-[22px] glass-light liquid-shine p-9 md:p-10">
              <p className="text-17 font-bold text-bg leading-tight">Podcast Inusual Youth</p>
              <p className="text-14 text-bg/55 font-semibold mt-1">
                92.9 FM Radio Stereo Cumbre · Viernes 3:00 PM
              </p>
            </div>
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

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <RevealList className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {topAlbums.map(([albumName, photos]) => (
            <RevealItem key={albumName}>
            <Tilt as={Link} to="/gallery" max={6} glass="standard" className="group relative rounded-[22px] overflow-hidden aspect-[4/5] liquid-glass block border border-white/5 hover:border-white/20">
              {/* Tile de foto a plena fuerza: el nombre del álbum se sostiene
                  con el scrim de abajo, no bajándole la opacidad a la foto. */}
              <img src={photos[0].url} alt={albumName} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
              <div className="scrim-card" />
              <div className="absolute bottom-5 inset-x-5">
                <p className="text-white font-bold text-18 leading-tight line-clamp-1">{albumName}</p>
                {photos.length > 1 && (
                  <p className="text-white/60 text-12 font-medium mt-1">{photos.length} fotos</p>
                )}
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
  // Fondos de sección — mismo slot directo (AdminSitePhotos) que usa
  // cada otro módulo del sitio, en vez del emparejamiento indirecto por
  // palabra clave de álbum que tenía antes. El admin sube una foto y
  // aparece, igual que en Blog/Galería/Células/Eventos.
  //
  // Solo dos secciones llevan foto ambiental, a propósito: el ritmo de la
  // página es la alternancia entre sección con foto entera y sección sobre
  // canvas limpio. Células y Mensajes ya son collage/carril de fotos, así
  // que sus slots (home_celulas / home_mensajes) quedaron sin consumidor —
  // siguen existiendo en el panel y habría que retirarlos de ahí.
  const agendaBg    = useSitePhoto('home_agenda',    '/images/bg-eventos.jpg');
  const ubicacionBg = useSitePhoto('home_ubicacion', '/images/bg-ubicacion.jpg');
  const navigate = useNavigate();
  // Fallback del CTA del hero (si un slide del backend trae un ctaUrl no
  // navegable): la acción de primer contacto es Conéctate, no un scroll.
  const handlePlan = () => navigate('/conectate');

  return (
    <main className="bg-bg w-full">
      {/* El polvo de luz 3D ("estrellitas") ya vive en App.jsx, global
          para todas las páginas públicas — aquí no hace falta montarlo */}
      <HeroCarousel onPlan={handlePlan} />
      <AnnouncementsBar />
      <Agenda bg={agendaBg} />
      <CelulasSection />
      <MensajesCarousel />
      <GalleryPreviewSection />
      <SocialSection title="Lo que está pasando." />
      <Ubicacion bg={ubicacionBg} />
    </main>
  );
}
