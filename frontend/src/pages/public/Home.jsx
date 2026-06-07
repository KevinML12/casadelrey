import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../lib/apiClient';

// Gradient class map — static strings so Tailwind JIT keeps them
const ENS_GRAD = ['ens-grad-0', 'ens-grad-1', 'ens-grad-2'];

// ─── Hero ─────────────────────────────────────────────────────────────────────

const HERO_STATS = [
  { value: '200+', label: 'FAMILIAS' },
  { value: '20+',  label: 'CÉLULAS ACTIVAS' },
  { value: '10',   label: 'AÑOS SIRVIENDO' },
];

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background photo — avoids inline backgroundImage */}
      <img
        src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1920&q=80"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Navy overlay */}
      <div className="absolute inset-0 bg-navy/80" />
      {/* Dot-grid texture */}
      <div className="hero-grid" />

      <div className="relative z-10 flex-1 flex flex-col justify-between max-w-[1440px] w-full mx-auto px-6 md:px-24 pt-8 pb-10">

        {/* Badge row — animate-hero-1 */}
        <div className="flex items-center justify-between animate-hero-1">
          <div className="flex items-center gap-2 backdrop-blur-apple backdrop-saturate-apple bg-white/10 border border-white/10 rounded-pill px-4 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-celeste shrink-0" />
            <span className="text-mono text-celeste hidden sm:block">
              IGLESIA CRISTIANA · HUEHUETENANGO · DESDE 2016
            </span>
            <span className="text-mono text-celeste sm:hidden">CDR · HUEHUETENANGO</span>
          </div>
          <span className="text-mono text-celeste hidden sm:block backdrop-blur-apple backdrop-saturate-apple bg-white/10 border border-white/10 rounded-pill px-3 py-1.5">
            MATEO 5:14
          </span>
        </div>

        {/* Main content */}
        <div className="mt-auto pt-16 md:pt-0">

          {/* Title — animate-hero-2 */}
          <h1 className="mb-6 animate-hero-2">
            <span className="block text-display-l text-white">LUZ PARA</span>
            <span className="block text-display-l text-outlined pl-4 md:pl-6">LAS NACIONES</span>
          </h1>

          {/* Subtitle — animate-hero-3 */}
          <div className="animate-hero-3">
            <p className="text-body-l text-white/85 mb-2 max-w-[480px]">Empieza tu propósito aquí.</p>
            <p className="text-mono text-white/60 mb-8 uppercase">
              Domingos · 10AM · Zona 1, Huehuetenango
            </p>
          </div>

          {/* CTAs — animate-hero-4 */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12 sm:mb-16 animate-hero-4">
            <Link to="/events" className="btn-pill bg-white text-navy font-semibold">
              Ver próximos eventos
            </Link>
            <Link
              to="/about"
              className="px-2 py-3.5 text-white text-body-l font-normal hover:text-white/70 transition-colors flex items-center gap-1.5"
            >
              Conócenos <span>→</span>
            </Link>
          </div>

          {/* Stats glass container — animate-hero-5 */}
          <div className="animate-hero-5 inline-flex">
            <div className="backdrop-blur-apple backdrop-saturate-apple bg-navy/50 border border-white/10 rounded-xl px-6 py-5 flex items-end gap-10 md:gap-12">
              {HERO_STATS.map((stat, i) => (
                <div key={stat.label} className="flex items-end gap-10 md:gap-12">
                  <div>
                    <div className={`font-black text-white leading-none tracking-tight ${i === 0 ? 'text-headline-l' : 'text-headline-m'}`}>
                      {stat.value}
                    </div>
                    <div className="text-mono text-white/50 mt-1">{stat.label}</div>
                  </div>
                  {i < HERO_STATS.length - 1 && (
                    <div className="self-center h-10 md:h-14 w-px bg-white/25 mb-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <p className="text-center mt-8 text-mono text-white/50 hidden md:block">
          ↓&nbsp;&nbsp;EXPLORAR
        </p>
      </div>
    </section>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label, title, linkText, linkTo }) {
  return (
    <div className="flex justify-between items-end mb-10 md:mb-12">
      <div>
        <p className="text-mono text-outline mb-3">{label}</p>
        <h2 className="text-headline-l whitespace-pre-line text-on-surf">{title}</h2>
      </div>
      {linkText && (
        <Link
          to={linkTo}
          className="text-body-s font-semibold text-on-surf shrink-0 hidden sm:block hover:opacity-70 transition-opacity"
        >
          {linkText}
        </Link>
      )}
    </div>
  );
}

// ─── Ministerios (Bento Grid) ─────────────────────────────────────────────────

const AREAS = [
  { icon: 'menu_book',          label: 'Enseñanzas',   desc: 'Mensajes y series para crecer en la fe.',   to: '/blog' },
  { icon: 'calendar_month',     label: 'Eventos',       desc: 'Cultos, conferencias y noches especiales.', to: '/events' },
  { icon: 'volunteer_activism', label: 'Oración',       desc: 'Envía tu petición y oramos contigo.',       to: '/prayer' },
  { icon: 'handshake',          label: 'Voluntariado',  desc: 'Sirve con tus dones en Casa del Rey.',       to: '/volunteering' },
  { icon: 'favorite',           label: 'Donaciones',    desc: 'Tu generosidad transforma comunidades.',     to: '/donate' },
];

function Ministerios() {
  return (
    <section className="py-20 md:py-28 bg-surf-low">
      <div className="max-w-[1200px] mx-auto px-6">
        <SectionHeader
          label="MINISTERIOS"
          title={'Todo lo que somos\npara ti.'}
          linkText="Ver todo →"
          linkTo="/about"
        />
        {/* Bento: featured spans 2/3 cols on desktop, full-width on tablet */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AREAS.map(({ icon, label, desc, to }, i) => {
            const featured = i === 0;
            return (
              <Link
                key={to}
                to={to}
                className={[
                  'rounded-3xl p-7 flex flex-col gap-5 transition-transform duration-200 hover:-translate-y-1',
                  featured
                    ? 'sm:col-span-2 lg:col-span-2 bg-navy shadow-elev-5'
                    : 'bg-surf-high border border-outline-var shadow-elev-1 state-layer',
                ].join(' ')}
              >
                <span className={`ms text-[32px] leading-none ${featured ? 'text-white' : 'text-pri'}`}>
                  {icon}
                </span>
                <div className={`h-px w-full ${featured ? 'bg-white/10' : 'bg-outline-var'}`} />
                <div className="flex-1">
                  <p className={`text-title-m font-bold mb-2 ${featured ? 'text-white' : 'text-on-surf'}`}>
                    {label}
                  </p>
                  <p className={`text-body-s leading-relaxed ${featured ? 'text-white/65' : 'text-on-surf-var'}`}>
                    {desc}
                  </p>
                </div>
                <span className={`text-label-l font-bold ${featured ? 'text-white' : 'text-on-surf'}`}>
                  → Ver más
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Anuncios ─────────────────────────────────────────────────────────────────

function Anuncios() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/announcements')
      .then(r => setItems((r.data?.data || r.data || []).slice(0, 4)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !items.length) return null;

  return (
    <section className="py-20 md:py-28 bg-surf">
      <div className="max-w-[1200px] mx-auto px-6">
        <SectionHeader label="ANUNCIOS" title="Novedades de la iglesia" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(a => (
            <div
              key={a.ID}
              className="rounded-3xl p-6 flex gap-4 items-start bg-surf-high border border-outline-var"
            >
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-pri-con">
                <span className="ms text-[20px] text-on-pri-con">campaign</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-title-s font-bold mb-1 text-on-surf">{a.title}</p>
                <p className="text-body-s leading-relaxed line-clamp-3 text-on-surf-var">{a.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Últimas enseñanzas (Bento Grid) ─────────────────────────────────────────

function UltimasEnsenanzas() {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/blog/')
      .then(r => setPosts((r.data || []).slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <section className="py-20 md:py-28 bg-surf-low">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="h-8 rounded-xl w-48 mb-10 animate-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[0, 1, 2].map(i => (
            <div key={i} className={`rounded-3xl h-[380px] animate-shimmer ${i === 0 ? 'md:col-span-2' : ''}`} />
          ))}
        </div>
      </div>
    </section>
  );

  if (!posts.length) return null;

  return (
    <section className="py-20 md:py-28 bg-surf-low">
      <div className="max-w-[1200px] mx-auto px-6">
        <SectionHeader
          label="ENSEÑANZAS"
          title={'Para crecer\ncada semana.'}
          linkText="Ver blog →"
          linkTo="/blog"
        />
        {/* Bento: post 0 → 2 cols, post 2 → full-width horizontal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {posts.map((post, i) => {
            const featured = i === 0;
            const wide = posts.length >= 3 && i === 2;
            const excerpt = post.excerpt || post.content?.replace(/<[^>]+>/g, '').substring(0, 110);

            return (
              <Link
                key={post.ID}
                to={`/blog/${post.slug}`}
                className={[
                  'rounded-3xl overflow-hidden transition-transform duration-200 hover:-translate-y-1',
                  featured && 'md:col-span-2 flex flex-col bg-navy shadow-elev-5',
                  wide    && 'md:col-span-3 flex flex-col md:flex-row bg-surf-high border border-outline-var shadow-elev-1',
                  !featured && !wide && 'flex flex-col bg-surf-high border border-outline-var shadow-elev-1',
                ].filter(Boolean).join(' ')}
              >
                {/* Media */}
                <div
                  className={[
                    'shrink-0',
                    wide ? 'w-full md:w-2/5 h-48 md:h-auto' : 'w-full h-48',
                    post.cover_image ? 'overflow-hidden' : ENS_GRAD[i % ENS_GRAD.length],
                  ].join(' ')}
                >
                  {post.cover_image && (
                    <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
                  )}
                </div>
                {/* Body */}
                <div className="p-6 flex flex-col gap-2.5 flex-1">
                  <p className={`text-mono ${featured ? 'text-white/60' : 'text-outline'}`}>
                    {(post.category || 'ENSEÑANZA').toUpperCase()}
                  </p>
                  <p className={`text-title-l font-bold leading-snug line-clamp-2 ${featured ? 'text-white' : 'text-on-surf'}`}>
                    {post.title}
                  </p>
                  {excerpt && (
                    <p className={`text-body-s leading-relaxed line-clamp-2 ${featured ? 'text-white/65' : 'text-on-surf-var'}`}>
                      {excerpt}
                    </p>
                  )}
                  <span className={`text-label-l font-bold mt-1 ${featured ? 'text-white' : 'text-on-surf'}`}>
                    Leer →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Próximos eventos ─────────────────────────────────────────────────────────

function ProximosEventos() {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/events/')
      .then(r => setEvents((r.data || []).slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !events.length) return null;

  return (
    <section className="py-20 md:py-28 bg-surf">
      <div className="max-w-[1200px] mx-auto px-6">
        <SectionHeader
          label="PRÓXIMOS EVENTOS"
          title={'Encuéntrate con\ntu comunidad.'}
          linkText="Ver todos →"
          linkTo="/events"
        />
        <div className="flex flex-col">
          {events.map((ev, i) => {
            const d = ev.date ? new Date(ev.date + 'T12:00:00') : null;
            const weekday = d
              ? d.toLocaleDateString('es-ES', { weekday: 'long' }).toUpperCase()
              : 'EVENTO';
            const details = [
              d ? d.toLocaleDateString('es-ES', { weekday: 'long' }) : null,
              ev.time,
              ev.location,
            ].filter(Boolean).map(s => s[0].toUpperCase() + s.slice(1)).join(' · ');

            return (
              <div key={ev.ID}>
                <div className="flex items-center justify-between py-7 gap-4">
                  <div className="flex items-center gap-6 md:gap-8 min-w-0">
                    {d && (
                      <div className="text-center shrink-0 w-[72px]">
                        <div className="text-display-s font-black leading-none text-navy">
                          {d.getDate()}
                        </div>
                        <div className="text-mono text-on-surf-var mt-1">
                          {d.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}
                        </div>
                      </div>
                    )}
                    <div className="w-px h-16 shrink-0 bg-outline-var" />
                    <div className="min-w-0">
                      <p className="text-mono text-outline mb-1.5">{weekday}</p>
                      <p className="text-headline-s font-bold tracking-tight truncate text-on-surf">
                        {ev.title}
                      </p>
                      <p className="text-body-s mt-1 truncate text-on-surf-var">{details}</p>
                    </div>
                  </div>
                  <Link
                    to="/events"
                    className="text-body-s font-semibold text-navy shrink-0 hidden sm:block hover:opacity-70 transition-opacity"
                  >
                    Ver detalles →
                  </Link>
                </div>
                {i < events.length - 1 && <div className="h-px w-full bg-outline-var" />}
              </div>
            );
          })}
        </div>
        <div className="flex justify-center mt-12">
          <Link to="/events" className="btn-pill bg-navy text-white font-semibold">
            Ver todos los eventos
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── CTA Oración — sin violeta, botón celeste ─────────────────────────────────

function OracionCTA() {
  return (
    <section className="relative overflow-hidden bg-navy">
      {/* Atmospheric photo — right half */}
      <div className="absolute inset-y-0 right-0 w-1/2 hidden md:block overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1200&q=80"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover"
        />
      </div>
      {/* Gradient fade — defined in index.css to avoid inline style */}
      <div className="absolute inset-0 oracion-overlay" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-24 md:py-32">
        <div className="max-w-[600px]">
          <p className="font-serif italic text-body-l text-white/50 mb-6">
            «No se inquieten por nada.»
          </p>
          <h2 className="text-display-s text-white mb-5 whitespace-pre-line">
            {'¿Tienes una\npetición de oración?'}
          </h2>
          <p className="text-body-l text-white/60 mb-4 max-w-[520px] leading-[1.65]">
            No tienes que enfrentarlo solo. Nuestro equipo ora cada semana por las peticiones de nuestra comunidad.
          </p>
          <p className="text-mono text-white/40 mb-8">FILIPENSES 4:6</p>
          <div className="flex items-center gap-5">
            <Link to="/prayer" className="btn-pill bg-celeste text-white font-semibold">
              Enviar petición →
            </Link>
            <Link
              to="/about"
              className="text-body-s font-medium text-white/50 hover:text-white transition-colors"
            >
              Saber más
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Donaciones ───────────────────────────────────────────────────────────────

const DON_AMOUNTS = ['Q50', 'Q100', 'Q250'];

function Donaciones() {
  const [active, setActive] = useState('Q100');

  return (
    <section className="py-20 md:py-28 bg-surf">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="rounded-2xl p-10 md:p-16 flex flex-col lg:flex-row gap-12 lg:items-center bg-navy">

          {/* Left */}
          <div className="flex-1">
            <p className="text-mono text-white/30 mb-5">SIEMBRA Y OFRENDA</p>
            <h2 className="text-display-s text-white mb-5 whitespace-pre-line">
              {'Tu generosidad\ntransforma vidas.'}
            </h2>
            <p className="text-body-l text-white/60 max-w-[460px] mb-9 leading-[1.7]">
              Cada semilla impacta familias, financia misiones y sostiene el ministerio de Casa del Rey en Huehuetenango y más allá.
            </p>
            <div className="flex gap-12 md:gap-16">
              {[
                { v: 'Q48,000', l: 'recaudados este año' },
                { v: '1,284',   l: 'donadores activos' },
              ].map(s => (
                <div key={s.l}>
                  <div className="text-headline-l font-extrabold text-white leading-none tracking-tight">
                    {s.v}
                  </div>
                  <div className="text-body-s text-white/50 mt-2">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — amounts + donate */}
          <div className="flex flex-col gap-4 w-full lg:w-auto lg:min-w-[320px]">
            <p className="text-mono text-white/40">ELIGE UN MONTO</p>
            <div className="flex gap-3">
              {DON_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  onClick={() => setActive(amt)}
                  className={[
                    'flex-1 h-14 rounded-xl font-bold transition-all duration-150 text-title-s',
                    active === amt
                      ? 'bg-white text-navy shadow-elev-3'
                      : 'backdrop-blur-apple backdrop-saturate-apple bg-white/10 border border-white/10 text-white hover:bg-white/15',
                  ].join(' ')}
                >
                  {amt}
                </button>
              ))}
            </div>
            <Link
              to="/donate"
              className="btn-pill bg-celeste text-white font-semibold mt-2"
            >
              Donar {active}
            </Link>
            <p className="text-mono text-white/30 text-center">PAGO SEGURO · BANRURAL / TIGO MONEY</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      <Hero />
      <Ministerios />
      <Anuncios />
      <UltimasEnsenanzas />
      <ProximosEventos />
      <OracionCTA />
      <Donaciones />
    </>
  );
}
