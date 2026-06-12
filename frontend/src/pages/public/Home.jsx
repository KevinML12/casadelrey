import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, Halos, Eyebrow, GlassButton, Field, Surface } from '../../components/ui/Glass';

// ─── Photos ────────────────────────────────────────────────────────
const IMG = (id, w = 1600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
const PHOTOS = {
  heroCrowd: IMG('photo-1438232992991-995b7058bbb3', 2000),
  jovenes:   IMG('photo-1529156069898-49953e39b3ac', 1100),
  adoracion: IMG('photo-1470229722913-7c0e2dbbafd3', 1100),
  celulas:   IMG('photo-1523580494863-6f3031224c94', 1100),
  ninos:     IMG('photo-1503454537195-1dcabb73ffb9', 1100),
  stage:     IMG('photo-1429962714451-bb934ecdc4ec', 1400),
  baptism:   IMG('photo-1505118380757-91f5f5632de0', 1100),
  community: IMG('photo-1523580494863-6f3031224c94', 1100),
  city:      IMG('photo-1519677100203-a0e668c92439', 1400),
  worship:   IMG('photo-1510590337019-5ef8d3d32116', 1400),
  series:    IMG('photo-1485561222814-e6c50477491b', 1200),
};

const SERVICES = [
  { day: 'Domingo', time: '10:00 AM', note: 'Servicio General' },
  { day: 'Domingo', time: '12:30 PM', note: 'Servicio General' },
  { day: 'Viernes', time: '7:30 PM',  note: 'Noche de Jóvenes' },
];

// ════════════════════════════════════════════════════════════════════
// 1 · HERO — Liquid Glass Light. Lienzo blanco luminoso · halos celeste
//     · título Deep Navy + acento sapphire · tarjeta squircle glass
// ════════════════════════════════════════════════════════════════════
function Hero({ onPlan }) {
  return (
    <section id="inicio" className="relative min-h-[100svh] overflow-hidden bg-bg pt-28 pb-16">
      {/* Halos — única "luz" ambiental sobre el blanco */}
      <Halos variant="hero" />
      <div className="hero-grid" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 grid lg:grid-cols-[1.25fr_1fr] gap-12 lg:gap-16 items-center min-h-[calc(100svh-7rem)]">

        {/* ── Columna editorial ─────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3 mb-6 animate-hero-1">
            <span className="h-px w-12 bg-gradient-to-r from-celeste to-transparent" />
            <span className="text-celeste text-[11px] font-bold uppercase tracking-widest">
              Casa del Rey · Huehuetenango
            </span>
          </div>

          <h1
            className="display-mega text-ink animate-hero-2"
            style={{ fontSize: 'clamp(3.5rem, 10vw, 8.5rem)' }}
          >
            Luz para
            <br />
            <span className="text-grad-celeste">las naciones</span>
            <span className="text-celeste">.</span>
          </h1>

          <p className="mt-8 max-w-xl text-[18px] md:text-[20px] leading-relaxed text-ink-2 font-medium animate-hero-3">
            Una generación encendida que adora, sirve y lleva esperanza
            a cada rincón de la ciudad.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3 animate-hero-4">
            <button
              onClick={onPlan}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-sm bg-celeste text-white text-[15.5px] font-bold tracking-tightish shadow-pri btn-spring hover:bg-celeste-hov hover:shadow-pri-lg focus-ring"
            >
              Planifica tu visita
              <Icon name="arrow" className="w-[18px] h-[18px]" stroke={2} />
            </button>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-sm glass glass-sheen text-ink text-[15.5px] font-bold tracking-tightish btn-spring hover:bg-white focus-ring"
            >
              <Icon name="play" className="w-4 h-4" />
              Ver el último mensaje
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl animate-hero-5">
            {SERVICES.map((s, i) => (
              <div key={i} className="bg-bg border border-ink-soft shadow-whisper rounded-sm px-4 py-3.5 card-spring">
                <div className="flex items-center gap-2 text-celeste">
                  <Icon name="clock" className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">{s.day}</span>
                </div>
                <div className="mt-1.5 text-[22px] font-extrabold tracking-tightish text-ink">{s.time}</div>
                <div className="text-[12.5px] text-ink-2 font-medium">{s.note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tarjeta flotante "Próximo servicio" ─────────────────── */}
        <aside className="hidden lg:block relative">
          <div
            className="absolute -inset-6 rounded-2xl -z-10 opacity-50"
            style={{
              background:
                'radial-gradient(ellipse at 30% 30%, rgba(59,130,246,0.30), transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(124,212,255,0.25), transparent 60%)',
              filter: 'blur(40px)',
            }}
          />

          <Surface className="p-8 animate-hero-3 card-spring">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-10 bg-celeste" />
              <span className="text-celeste text-[10.5px] font-extrabold uppercase tracking-widest">
                Próximo servicio
              </span>
            </div>

            <div className="flex items-baseline gap-2.5">
              <span className="display-mega text-grad-celeste" style={{ fontSize: 72 }}>10:00</span>
              <span className="text-[18px] font-extrabold text-celeste/80">AM</span>
            </div>
            <div className="text-[15px] font-bold text-ink mt-1 tracking-tightish">
              Domingo · Servicio General
            </div>

            <div className="h-px bg-ink-soft my-6" />

            <div className="space-y-2 mb-6">
              {SERVICES.slice(1).map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-sm bg-bg-soft px-4 py-3">
                  <span className="text-[12px] font-bold uppercase tracking-widest text-ink-2">{s.day}</span>
                  <span className="text-[14px] font-extrabold text-ink tracking-tightish">{s.time}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onPlan}
              className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-ink text-white py-3.5 text-[14.5px] font-bold tracking-tightish btn-spring hover:bg-celeste hover:shadow-pri focus-ring"
            >
              Planifica tu visita
              <Icon name="arrow" className="w-4 h-4" stroke={2} />
            </button>
            <Link
              to="/blog"
              className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-sm bg-bg-soft text-ink py-3 text-[13.5px] font-bold tracking-tightish btn-spring hover:bg-celeste-soft hover:text-celeste-hov focus-ring"
            >
              <Icon name="play" className="w-4 h-4" />
              Último mensaje
            </Link>
          </Surface>
        </aside>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// 2 · NOSOTROS — stat band sobre lienzo blanco
// ════════════════════════════════════════════════════════════════════
const STATS = [
  { k: '+200', v: 'Familias cada domingo' },
  { k: '20',   v: 'Células activas' },
  { k: '10',   v: 'Años sirviendo' },
  { k: '∞',    v: 'Espacio para ti' },
];

function Nosotros() {
  return (
    <section id="nosotros" className="relative py-28 md:py-36 overflow-hidden bg-bg">
      <Halos variant="soft" />
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <Eyebrow>Nosotros</Eyebrow>
            <h2
              className="display-mega text-ink"
              style={{ fontSize: 'clamp(2.6rem, 6vw, 4.6rem)' }}
            >
              No es un edificio.<br />
              Es una familia con{' '}
              <span className="text-grad-celeste">luces encendidas</span>
              <span className="text-celeste">.</span>
            </h2>
            <p className="mt-7 text-[17px] md:text-[19px] leading-relaxed text-ink-2 max-w-lg">
              Casa del Rey nació para que una generación entera tenga un lugar al cual
              pertenecer. Adoración fuerte, mensajes reales y gente que te recibe por tu nombre.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {STATS.map((s, i) => (
              <Surface key={i} className="p-7 card-spring">
                <div
                  className="display-mega text-grad-celeste"
                  style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.4rem)' }}
                >
                  {s.k}
                </div>
                <div className="mt-2 text-[13.5px] text-ink-2 font-semibold leading-snug">
                  {s.v}
                </div>
              </Surface>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// 3 · MINISTERIOS — asymmetric bento. Fotos full-bleed con panel
//     translucido blanco (glass-bright = white/30 + blur)
// ════════════════════════════════════════════════════════════════════
function MinTile({ photo, eyebrow, title, desc, meta, big = false }) {
  return (
    <div className="relative rounded-card overflow-hidden h-full card-spring">
      <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
      {/* darken bottom for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/15 to-transparent" />
      {/* glass-bright panel — translucido blanco refracta el color de la foto */}
      <div
        className={`absolute left-4 right-4 bottom-4 rounded-2xl ${big ? 'p-6 md:p-7' : 'p-4 md:p-5'}`}
        style={{
          background: 'rgba(255,255,255,0.78)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 8px 24px rgba(10,21,38,0.18), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="h-px w-6 bg-celeste" />
          <span className="text-celeste-hov text-[10px] font-extrabold uppercase tracking-widest">
            {eyebrow}
          </span>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3
              className="display-mega text-ink"
              style={{ fontSize: big ? 'clamp(2rem, 3.5vw, 2.8rem)' : '1.45rem' }}
            >
              {title}
            </h3>
            {big && desc && (
              <p className="mt-2.5 text-[14px] text-ink-2 leading-snug max-w-[24ch] font-medium">
                {desc}
              </p>
            )}
            <div className="text-[11.5px] font-extrabold uppercase tracking-widest text-celeste-hov mt-2.5">
              {meta}
            </div>
          </div>
          <span className="grid place-items-center w-10 h-10 rounded-full bg-ink text-white shrink-0">
            <Icon name="arrow" className="w-4 h-4" stroke={2} />
          </span>
        </div>
      </div>
    </div>
  );
}

function Ministerios() {
  return (
    <section id="ministerios" className="relative py-28 md:py-36 overflow-hidden bg-bg-tint">
      <Halos variant="soft" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="max-w-3xl mb-12">
          <Eyebrow>Ministerios</Eyebrow>
          <h2
            className="display-mega text-ink"
            style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}
          >
            Hay un lugar<br />
            <span className="text-grad-celeste">para ti</span>
            <span className="text-celeste">.</span>
          </h2>
        </div>

        <div
          className="grid gap-4 md:gap-5"
          style={{
            gridTemplateColumns: 'minmax(0, 1.55fr) minmax(0, 1fr) minmax(0, 1fr)',
            gridAutoRows: 'minmax(260px, 1fr)',
          }}
        >
          <div className="md:row-span-2 min-h-[420px] md:min-h-[560px]">
            <MinTile
              big
              photo={PHOTOS.jovenes}
              eyebrow="Viernes · 7:30 PM"
              title="Jóvenes"
              desc="Una noche encendida de adoración, palabra y comunidad. El corazón de la Casa late aquí."
              meta="+1.200 cada semana"
            />
          </div>
          <div className="min-h-[260px]">
            <MinTile photo={PHOTOS.adoracion} eyebrow="Equipo" title="Adoración" meta="Audiciones abiertas" />
          </div>
          <div className="md:row-span-2 min-h-[260px] md:min-h-[560px]">
            <MinTile
              big
              photo={PHOTOS.ninos}
              eyebrow="Domingos"
              title="Niños"
              desc="Un espacio seguro y divertido donde los pequeños conocen a Jesús."
              meta="0 – 10 años"
            />
          </div>
          <div className="min-h-[260px]">
            <MinTile photo={PHOTOS.celulas} eyebrow="En casas" title="Células" meta="20 grupos activos" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// 4 · ENSEÑANZAS — featured + series cards
// ════════════════════════════════════════════════════════════════════
const SERIES = [
  { tag: 'Serie', title: 'Sin Filtros', sub: 'Fe real para una vida real',    img: PHOTOS.series, n: '6 mensajes' },
  { tag: 'Serie', title: 'Identidad',   sub: 'Quién eres antes de qué haces', img: PHOTOS.celulas, n: '4 mensajes' },
  { tag: 'Serie', title: 'Noche & Día', sub: 'Constancia en lo secreto',      img: PHOTOS.stage,  n: '5 mensajes' },
];

const photoPanelStyle = {
  background: 'rgba(255,255,255,0.78)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.7)',
  boxShadow: '0 12px 36px rgba(10,21,38,0.22), inset 0 1px 0 rgba(255,255,255,0.9)',
};

function Ensenanzas() {
  return (
    <section id="ensenanzas" className="relative py-28 md:py-36 overflow-hidden bg-bg">
      <Halos variant="soft" />
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <Eyebrow>Enseñanzas</Eyebrow>
            <h2
              className="display-mega text-ink"
              style={{ fontSize: 'clamp(2.6rem, 6vw, 4.6rem)' }}
            >
              Mensajes que<br />
              <span className="text-grad-celeste">se quedan</span>
              <span className="text-celeste">.</span>
            </h2>
          </div>
          <Link
            to="/blog"
            className="group inline-flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-widest text-celeste hover:text-celeste-hov transition-colors"
          >
            Toda la biblioteca
            <Icon name="arrow" className="w-4 h-4 transition-transform group-hover:translate-x-1" stroke={2} />
          </Link>
        </div>

        {/* Featured */}
        <div className="relative rounded-card overflow-hidden group cursor-pointer min-h-[480px] md:min-h-[560px] card-spring shadow-card-lg">
          <img
            src={PHOTOS.worship}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-[1.2s]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
          <div
            className="absolute left-6 right-6 md:left-10 md:right-auto md:max-w-2xl bottom-6 md:bottom-10 rounded-card p-7 md:p-9"
            style={photoPanelStyle}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="h-px w-8 bg-celeste" />
              <span className="text-celeste-hov text-[10.5px] font-extrabold uppercase tracking-widest">
                Último mensaje · Serie Sin Filtros
              </span>
            </div>
            <h3 className="display-mega text-ink" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
              Cuando todo se sacude, la Casa permanece.
            </h3>
            <div className="mt-4 flex items-center gap-3 text-[13.5px] font-bold text-ink-2 tracking-tightish">
              <span className="grid place-items-center w-8 h-8 rounded-full bg-ink text-white text-[12px] font-extrabold">R</span>
              Ps. Roberto Méndez · 42 min
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-sm bg-ink text-white px-5 py-3 text-[14px] font-bold tracking-tightish btn-spring hover:bg-celeste focus-ring">
                <Icon name="play" className="w-4 h-4" /> Reproducir
              </button>
              <button className="inline-flex items-center gap-2 rounded-sm bg-bg text-ink px-5 py-3 text-[14px] font-bold tracking-tightish border border-ink-soft btn-spring hover:bg-bg-soft focus-ring">
                Notas del mensaje
              </button>
            </div>
          </div>
        </div>

        {/* Series row */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mt-5">
          {SERIES.map((s, i) => (
            <article key={i} className="group relative rounded-card overflow-hidden cursor-pointer aspect-[4/5] card-spring shadow-card">
              <img
                src={s.img}
                alt=""
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-ink/15 to-transparent" />
              <div className="absolute left-4 right-4 bottom-4 rounded-2xl p-5" style={photoPanelStyle}>
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-celeste-hov mb-1.5">
                  {s.tag} · {s.n}
                </div>
                <h4 className="display-mega text-ink" style={{ fontSize: '1.7rem' }}>
                  {s.title}
                </h4>
                <p className="mt-1.5 text-[13.5px] text-ink-2 font-medium">{s.sub}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// 5 · EVENTOS — bento sobre lienzo blanco · panel translúcido blanco
// ════════════════════════════════════════════════════════════════════
const EVENTS = [
  { d: '13', m: 'JUN', day: 'Viernes', title: 'Noche de Jóvenes', sub: 'Adoración + palabra',                time: '7:30 PM',     img: PHOTOS.stage,     big: true,  tag: 'Semanal' },
  { d: '15', m: 'JUN', day: 'Domingo', title: 'Bautismos',        sub: 'Da el siguiente paso',               time: '12:30 PM',    img: PHOTOS.baptism,               tag: 'Especial' },
  { d: '21', m: 'JUN', day: 'Sábado',  title: 'Servir la Ciudad', sub: 'Voluntariado urbano',                time: '9:00 AM',     img: PHOTOS.city,                  tag: 'Misión' },
  { d: '27', m: 'JUN', day: 'Viernes', title: 'Encuentro',        sub: 'Un fin de semana para reiniciar',    time: 'Todo el día', img: PHOTOS.community, big: true,  tag: 'Retiro' },
];

function EventCard({ e }) {
  return (
    <article
      className={`group relative rounded-card overflow-hidden cursor-pointer card-spring shadow-card ${
        e.big ? 'md:row-span-2 min-h-[420px] md:min-h-[600px]' : 'min-h-[300px]'
      }`}
    >
      <img
        src={e.img}
        alt=""
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-ink/15 to-transparent" />

      <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
        <span
          className="rounded-pill px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest"
          style={{
            background: 'rgba(255,255,255,0.85)',
            color: '#0A1526',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {e.day}
        </span>
        <span
          className="rounded-pill px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white"
          style={{
            background: 'rgba(10,21,38,0.78)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
          }}
        >
          {e.tag}
        </span>
      </div>

      <div className="absolute left-4 right-4 bottom-4 rounded-2xl p-5 flex items-center gap-5" style={photoPanelStyle}>
        <div className="text-center shrink-0">
          <div className="display-mega text-ink" style={{ fontSize: e.big ? 54 : 42 }}>{e.d}</div>
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-celeste mt-0.5">{e.m}</div>
        </div>
        <div className="w-px self-stretch bg-ink-soft" />
        <div className="min-w-0 flex-1">
          <h4
            className="display-mega text-ink"
            style={{ fontSize: e.big ? 'clamp(1.5rem, 2.6vw, 2.2rem)' : '1.2rem' }}
          >
            {e.title}
          </h4>
          <p className="mt-1 text-[13px] font-medium text-ink-2 leading-snug">{e.sub}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[12px] font-bold text-celeste-hov tracking-tightish">
            <Icon name="clock" className="w-3.5 h-3.5" /> {e.time}
          </div>
        </div>
        <span className="grid place-items-center w-10 h-10 rounded-full bg-ink text-white shrink-0">
          <Icon name="arrow" className="w-4 h-4" stroke={2} />
        </span>
      </div>
    </article>
  );
}

function Eventos() {
  return (
    <section id="eventos" className="relative py-28 md:py-36 overflow-hidden bg-bg-tint">
      <Halos variant="soft" />
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <Eyebrow>Agenda · Junio</Eyebrow>
            <h2
              className="display-mega text-ink"
              style={{ fontSize: 'clamp(2.6rem, 6vw, 4.6rem)' }}
            >
              Pasa algo<br />
              <span className="text-grad-celeste">cada semana</span>
              <span className="text-celeste">.</span>
            </h2>
          </div>
          <Link
            to="/events"
            className="group inline-flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-widest text-celeste hover:text-celeste-hov transition-colors"
          >
            Calendario completo
            <Icon name="arrow" className="w-4 h-4 transition-transform group-hover:translate-x-1" stroke={2} />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-5 auto-rows-[auto]">
          {EVENTS.map((e, i) => <EventCard key={i} e={e} />)}
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// 6 · CONÉCTATE — lienzo blanco · card glass-strong squircle
// ════════════════════════════════════════════════════════════════════
function Conectate() {
  const [form, setForm] = useState({ nombre: '', email: '', interes: 'Mi primera visita', mensaje: '' });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const submit = (e) => {
    e.preventDefault();
    const err = {};
    if (!form.nombre.trim()) err.nombre = 'Cuéntanos tu nombre';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) err.email = 'Escribe un correo válido';
    setErrors(err);
    if (Object.keys(err).length === 0) setSent(true);
  };

  return (
    <section id="conectate" className="relative py-28 md:py-36 overflow-hidden bg-bg">
      <Halos variant="soft" />
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-stretch">
          <div className="flex flex-col justify-center">
            <Eyebrow>Conéctate</Eyebrow>
            <h2
              className="display-mega text-ink"
              style={{ fontSize: 'clamp(2.6rem, 6vw, 4.6rem)' }}
            >
              Demos el primer paso{' '}
              <span className="text-grad-celeste">juntos</span>
              <span className="text-celeste">.</span>
            </h2>
            <p className="mt-7 text-[17px] md:text-[19px] leading-relaxed text-ink-2 max-w-md">
              Déjanos tus datos y alguien de nuestro equipo te escribe esta semana.
              Sin presión — solo queremos conocerte.
            </p>

            <div className="mt-10 space-y-3 max-w-md">
              {[
                { icon: 'pin',   t: '7a. Calle 12-66, zona 4', s: 'Huehuetenango, Guatemala' },
                { icon: 'phone', t: '+502 4760-0636',         s: 'Lun a Vie · 10am – 6pm' },
                { icon: 'mail',  t: 'hola@casadelrey.org',    s: 'Te respondemos en 24h' },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-4 bg-bg border border-ink-soft shadow-whisper rounded-md p-4 card-spring">
                  <span className="grid place-items-center w-11 h-11 rounded-sm bg-celeste-soft text-celeste shrink-0">
                    <Icon name={c.icon} className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="text-[15px] font-bold tracking-tightish text-ink">{c.t}</div>
                    <div className="text-[13px] text-ink-2">{c.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Surface className="p-7 md:p-9 shadow-card-lg">
            {sent ? (
              <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center">
                <span className="grid place-items-center w-16 h-16 rounded-full bg-celeste text-white mb-5 shadow-pri">
                  <Icon name="check" className="w-8 h-8" stroke={2.4} />
                </span>
                <h3 className="display-mega text-ink" style={{ fontSize: '1.8rem' }}>
                  ¡Listo, {form.nombre.split(' ')[0]}!
                </h3>
                <p className="mt-3 text-[16px] text-ink-2 max-w-xs">
                  Recibimos tu mensaje. Nos vemos pronto en la Casa.
                </p>
                <GlassButton
                  variant="glass"
                  className="mt-7"
                  onClick={() => {
                    setSent(false);
                    setForm({ nombre: '', email: '', interes: 'Mi primera visita', mensaje: '' });
                  }}
                >
                  Enviar otro
                </GlassButton>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="space-y-5">
                <Field label="Nombre"  name="nombre" value={form.nombre} onChange={onChange} error={errors.nombre} placeholder="¿Cómo te llamas?" />
                <Field label="Correo" type="email" name="email" value={form.email} onChange={onChange} error={errors.email} placeholder="tu@correo.com" />
                <Field label="Me interesa" name="interes" value={form.interes} onChange={onChange} as="select">
                  <option>Mi primera visita</option>
                  <option>Unirme a una célula</option>
                  <option>Servir como voluntario</option>
                  <option>Hablar con un pastor</option>
                </Field>
                <Field label="Mensaje (opcional)" name="mensaje" value={form.mensaje} onChange={onChange} as="textarea" placeholder="Cuéntanos algo de ti…" />
                <GlassButton variant="primary" icon="arrow" className="w-full" type="submit">
                  Conéctate con nosotros
                </GlassButton>
                <p className="text-[12px] text-ink-3 text-center">
                  Cuidamos tus datos. Nada de spam, lo prometemos.
                </p>
              </form>
            )}
          </Surface>
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// MODAL: Planifica tu visita — squircle white card sobre backdrop ink
// ════════════════════════════════════════════════════════════════════
function PlanModal({ open, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    if (open) { document.body.style.overflow = 'hidden'; window.addEventListener('keydown', onKey); }
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fade-in">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-bg rounded-t-modal sm:rounded-2xl p-7 md:p-9 shadow-card-lg border border-ink-soft animate-rise max-h-[92svh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 grid place-items-center w-9 h-9 rounded-full bg-bg-soft text-ink-2 hover:bg-celeste-soft hover:text-celeste-hov transition-colors focus-ring"
          aria-label="Cerrar"
        >
          <Icon name="close" className="w-[18px] h-[18px]" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <span className="h-px w-10 bg-celeste" />
          <span className="text-celeste text-[10.5px] font-extrabold uppercase tracking-widest">
            Casa del Rey · Huehuetenango
          </span>
        </div>
        <h3 className="display-mega text-ink" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)' }}>
          Planifica tu visita.
        </h3>
        <p className="mt-3 text-[15.5px] text-ink-2 leading-relaxed">
          Te guardamos lugar y te recibimos en la entrada. Esto es lo que puedes esperar:
        </p>

        <div className="mt-6 space-y-2.5">
          {[
            { icon: 'clock', t: 'Llega 15 min antes',    s: 'El café corre por nuestra cuenta' },
            { icon: 'music', t: 'Adoración en vivo',     s: 'Banda y mucha presencia' },
            { icon: 'users', t: 'Equipo de bienvenida',  s: 'Alguien te acompaña toda la mañana' },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-4 rounded-md bg-bg-soft p-3.5">
              <span className="grid place-items-center w-10 h-10 rounded-sm bg-celeste-soft text-celeste shrink-0">
                <Icon name={c.icon} className="w-5 h-5" />
              </span>
              <div>
                <div className="text-[15px] font-bold tracking-tightish text-ink">{c.t}</div>
                <div className="text-[13px] text-ink-2">{c.s}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-7 grid grid-cols-3 gap-2.5">
          {SERVICES.map((s, i) => (
            <button
              key={i}
              className="rounded-md bg-bg-soft border border-ink-soft hover:border-celeste hover:bg-celeste-soft transition-all p-3 text-left focus-ring btn-spring"
            >
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-celeste">{s.day}</div>
              <div className="text-[18px] mt-1 font-extrabold tracking-tightish text-ink">{s.time}</div>
            </button>
          ))}
        </div>

        <GlassButton variant="primary" icon="arrow" className="w-full mt-7" onClick={onClose}>
          Confirmar mi visita
        </GlassButton>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// HOME
// ════════════════════════════════════════════════════════════════════
export default function Home() {
  const [planOpen, setPlanOpen] = useState(false);
  const onPlan = () => setPlanOpen(true);

  return (
    <div className="bg-bg text-ink">
      <Hero onPlan={onPlan} />
      <Nosotros />
      <Ministerios />
      <Ensenanzas />
      <Eventos />
      <Conectate />
      <PlanModal open={planOpen} onClose={() => setPlanOpen(false)} />
    </div>
  );
}
