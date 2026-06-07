import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../lib/apiClient';

// ─── Hero ────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '200+', label: 'FAMILIAS' },
  { value: '20+',  label: 'CÉLULAS ACTIVAS' },
  { value: '10',   label: 'AÑOS SIRVIENDO' },
];

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">

      {/* Foto de fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1920&q=80')`,
        }}
      />
      {/* Overlay oscuro */}
      <div className="absolute inset-0" style={{ background: '#060D24CC' }} />

      {/* Contenido */}
      <div className="relative z-10 flex-1 flex flex-col justify-between max-w-[1440px] w-full mx-auto px-6 md:px-24 pt-8 pb-10">

        {/* Badge + scripture — top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7FA8D9]" />
            <span className="text-[#7FA8D9] text-[12px] font-semibold tracking-[1.8px] hidden sm:block">
              IGLESIA CRISTIANA · HUEHUETENANGO · DESDE 2016
            </span>
            <span className="text-[#7FA8D9] text-[11px] font-semibold tracking-[1.5px] sm:hidden">
              IGLESIA CRISTIANA · HUEHUETENANGO
            </span>
          </div>
          <span className="text-[#7FA8D9] text-[11px] font-medium tracking-[2.2px] font-mono hidden sm:block">
            MATEO 5:14
          </span>
        </div>

        {/* Título principal */}
        <div className="mt-auto pt-16 md:pt-0">
          <h1
            className="font-black leading-[0.9] tracking-[-0.05em] mb-6"
            style={{ fontSize: 'clamp(64px, 10vw, 120px)' }}
          >
            <span className="block text-white">LUZ PARA</span>
            {/* Segunda línea: texto outlined (sin fill) */}
            <span
              className="block"
              style={{
                color: 'transparent',
                WebkitTextStroke: '2px rgba(255,255,255,0.85)',
                paddingLeft: 'clamp(16px, 2vw, 24px)',
              }}
            >
              LAS NACIONES
            </span>
          </h1>

          <p
            className="mb-2 font-normal"
            style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'clamp(16px, 2vw, 24px)', maxWidth: 480 }}
          >
            Empieza tu propósito aquí.
          </p>
          <p
            className="mb-8 font-medium tracking-[1.5px] uppercase"
            style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(11px, 1.2vw, 14px)' }}
          >
            Domingos · 10AM · Zona 1, Huehuetenango
          </p>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12 sm:mb-16">
            <Link
              to="/events"
              className="px-7 py-3.5 rounded-full font-semibold text-[17px] transition-opacity hover:opacity-90 text-center"
              style={{ background: '#FFFFFF', color: '#060D24' }}
            >
              Ver próximos eventos
            </Link>
            <Link
              to="/about"
              className="px-2 py-3.5 text-white font-normal text-[17px] hover:text-white/70 transition-colors flex items-center gap-1.5"
            >
              Conócenos <span>→</span>
            </Link>
          </div>

          {/* Stats con divisores */}
          <div className="flex items-end gap-10 md:gap-12">
            {STATS.map((stat, i) => (
              <div key={stat.label} className="flex items-end gap-10 md:gap-12">
                <div className="flex flex-col gap-1">
                  <span
                    className="font-black text-white leading-[0.9]"
                    style={{ fontSize: i === 0 ? 'clamp(48px, 6vw, 96px)' : 'clamp(28px, 4vw, 48px)', fontWeight: i === 0 ? 900 : 800 }}
                  >
                    {stat.value}
                  </span>
                  <span
                    className="font-medium tracking-[2px]"
                    style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                  >
                    {stat.label}
                  </span>
                </div>
                {i < STATS.length - 1 && (
                  <div className="self-center h-10 md:h-14 w-px mb-2" style={{ background: 'rgba(255,255,255,0.25)' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint — centrado abajo */}
        <p
          className="text-center mt-8 font-semibold tracking-[3.5px] hidden md:block"
          style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}
        >
          ↓&nbsp;&nbsp;EXPLORAR
        </p>
      </div>
    </section>
  );
}

// ─── Section header reutilizable ──────────────────────────────────────────────

function SectionHeader({ label, title, linkText, linkTo }) {
  return (
    <div className="flex justify-between items-end mb-10 md:mb-12">
      <div>
        <p className="text-[12px] font-semibold tracking-[2px] mb-3" style={{ color: 'var(--outline)' }}>
          {label}
        </p>
        <h2
          className="font-bold leading-[1.05] tracking-[-0.02em] whitespace-pre-line"
          style={{ color: 'var(--on-surf)', fontSize: 'clamp(30px, 4.5vw, 44px)' }}
        >
          {title}
        </h2>
      </div>
      {linkText && (
        <Link
          to={linkTo}
          className="text-[15px] font-semibold shrink-0 hidden sm:block hover:opacity-70 transition-opacity"
          style={{ color: 'var(--on-surf)' }}
        >
          {linkText}
        </Link>
      )}
    </div>
  );
}

// ─── Ministerios ─────────────────────────────────────────────────────────────

const AREAS = [
  { icon: 'menu_book',          label: 'Enseñanzas',   desc: 'Mensajes y series para crecer en la fe.',            to: '/blog' },
  { icon: 'calendar_month',     label: 'Eventos',       desc: 'Cultos, conferencias y noches especiales.',          to: '/events' },
  { icon: 'volunteer_activism', label: 'Oración',       desc: 'Envía tu petición y oramos contigo.',                to: '/prayer' },
  { icon: 'handshake',          label: 'Voluntariado',  desc: 'Sirve con tus dones en Casa del Rey.',               to: '/volunteering' },
  { icon: 'favorite',           label: 'Donaciones',    desc: 'Tu generosidad transforma comunidades.',             to: '/donate' },
];

function Ministerios() {
  return (
    <section className="py-20 md:py-28" style={{ background: 'var(--surf-low)' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <SectionHeader
          label="MINISTERIOS"
          title={'Todo lo que somos\npara ti.'}
          linkText="Ver todo →"
          linkTo="/about"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {AREAS.map(({ icon, label, desc, to }, i) => {
            const featured = i === 0;
            return (
              <Link
                key={to}
                to={to}
                className="rounded-3xl p-7 flex flex-col gap-5 transition-transform duration-200 hover:-translate-y-1"
                style={
                  featured
                    ? { background: '#060D24', boxShadow: '0 12px 32px rgba(6,13,36,0.22)' }
                    : { background: 'var(--surf-high)', border: '1px solid var(--outline-var)' }
                }
              >
                <span className="ms" style={{ fontSize: 32, color: featured ? '#FFFFFF' : '#060D24' }}>
                  {icon}
                </span>
                <div className="h-px w-full" style={{ background: featured ? 'rgba(255,255,255,0.14)' : 'var(--outline-var)' }} />
                <div className="flex-1">
                  <p className="text-[18px] font-bold mb-2" style={{ color: featured ? '#FFFFFF' : 'var(--on-surf)' }}>
                    {label}
                  </p>
                  <p className="text-[13px] leading-relaxed" style={{ color: featured ? 'rgba(255,255,255,0.65)' : 'var(--on-surf-var)' }}>
                    {desc}
                  </p>
                </div>
                <span className="text-[14px] font-semibold" style={{ color: featured ? '#FFFFFF' : 'var(--on-surf)' }}>
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

// ─── Anuncios públicos ────────────────────────────────────────────────────────

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
    <section className="py-20 md:py-28" style={{ background: 'var(--surf)' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <SectionHeader label="ANUNCIOS" title="Novedades de la iglesia" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(a => (
            <div
              key={a.ID}
              className="rounded-3xl p-6 flex gap-4 items-start"
              style={{ background: 'var(--surf-high)', border: '1px solid var(--outline-var)' }}
            >
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'var(--pri-con)' }}>
                <span className="ms" style={{ fontSize: 20, color: '#060D24' }}>campaign</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-bold mb-1" style={{ color: 'var(--on-surf)' }}>{a.title}</p>
                <p className="text-[13px] leading-relaxed line-clamp-3" style={{ color: 'var(--on-surf-var)' }}>{a.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Últimas enseñanzas ───────────────────────────────────────────────────────

const ENS_GRADIENTS = [
  'linear-gradient(160deg,#0D1B4B 0%,#060D24 100%)',
  'linear-gradient(160deg,#1E3A6E 0%,#0D1B4B 100%)',
  'linear-gradient(160deg,#10254E 0%,#060D24 100%)',
];

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
    <section className="py-20 md:py-28" style={{ background: 'var(--surf-low)' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="h-8 rounded w-48 mb-10 animate-pulse" style={{ background: 'var(--surf-high)' }} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-3xl h-[420px] animate-pulse" style={{ background: 'var(--surf-high)' }} />
          ))}
        </div>
      </div>
    </section>
  );

  if (!posts.length) return null;

  return (
    <section className="py-20 md:py-28" style={{ background: 'var(--surf-low)' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <SectionHeader
          label="ENSEÑANZAS"
          title={'Para crecer\ncada semana.'}
          linkText="Ver blog →"
          linkTo="/blog"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {posts.map((post, i) => {
            const featured = i === 0;
            const excerpt = post.excerpt || post.content?.replace(/<[^>]+>/g, '').substring(0, 110);
            return (
              <Link
                key={post.ID}
                to={`/blog/${post.slug}`}
                className="rounded-3xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-1"
                style={
                  featured
                    ? { background: '#060D24', boxShadow: '0 12px 32px rgba(6,13,36,0.22)' }
                    : { background: 'var(--surf-high)', border: '1px solid var(--outline-var)' }
                }
              >
                {/* Media */}
                <div
                  className="h-48 w-full bg-cover bg-center shrink-0"
                  style={
                    post.cover_image
                      ? { backgroundImage: `url('${post.cover_image}')` }
                      : { background: ENS_GRADIENTS[i % 3] }
                  }
                />
                {/* Body */}
                <div className="p-6 flex flex-col gap-2.5 flex-1">
                  <p className="text-[11px] font-bold tracking-[1.5px]" style={{ color: featured ? 'rgba(255,255,255,0.6)' : 'var(--outline)' }}>
                    {(post.category || 'ENSEÑANZA').toUpperCase()}
                  </p>
                  <p className="text-[20px] font-bold leading-snug line-clamp-2" style={{ color: featured ? '#FFFFFF' : 'var(--on-surf)' }}>
                    {post.title}
                  </p>
                  <p className="text-[14px] leading-relaxed line-clamp-2" style={{ color: featured ? 'rgba(255,255,255,0.65)' : 'var(--on-surf-var)' }}>
                    {excerpt}
                  </p>
                  <span className="text-[14px] font-bold mt-1" style={{ color: featured ? '#FFFFFF' : 'var(--on-surf)' }}>
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
    <section className="py-20 md:py-28" style={{ background: 'var(--surf)' }}>
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
            const weekday = d ? d.toLocaleDateString('es-ES', { weekday: 'long' }).toUpperCase() : 'EVENTO';
            const details = [
              d ? d.toLocaleDateString('es-ES', { weekday: 'long' }) : null,
              ev.time,
              ev.location,
            ].filter(Boolean).map(s => s[0].toUpperCase() + s.slice(1)).join(' · ');

            return (
              <div key={ev.ID}>
                <div className="flex items-center justify-between py-7 gap-4">
                  <div className="flex items-center gap-6 md:gap-8 min-w-0">
                    {/* Date block */}
                    {d && (
                      <div className="text-center shrink-0" style={{ width: 72 }}>
                        <div className="font-black leading-none" style={{ color: '#060D24', fontSize: 52, letterSpacing: '-1px' }}>
                          {d.getDate()}
                        </div>
                        <div className="font-semibold tracking-[1.5px] mt-1" style={{ color: 'var(--on-surf-var)', fontSize: 12 }}>
                          {d.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}
                        </div>
                      </div>
                    )}
                    <div className="w-px h-16 shrink-0" style={{ background: 'var(--outline-var)' }} />
                    {/* Info */}
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold tracking-[1.2px] mb-1" style={{ color: 'var(--outline)' }}>
                        {weekday}
                      </p>
                      <p className="font-bold tracking-[-0.3px] truncate" style={{ color: 'var(--on-surf)', fontSize: 24 }}>
                        {ev.title}
                      </p>
                      <p className="text-[14px] mt-1 truncate" style={{ color: 'var(--on-surf-var)' }}>
                        {details}
                      </p>
                    </div>
                  </div>
                  <Link to="/events" className="text-[15px] font-semibold shrink-0 hidden sm:block hover:opacity-70 transition-opacity" style={{ color: '#060D24' }}>
                    Ver detalles →
                  </Link>
                </div>
                {i < events.length - 1 && <div className="h-px w-full" style={{ background: 'var(--outline-var)' }} />}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex justify-center mt-12">
          <Link
            to="/events"
            className="px-8 py-3.5 rounded-full text-[17px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: '#060D24' }}
          >
            Ver todos los eventos
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── CTA Oración ─────────────────────────────────────────────────────────────

function OracionCTA() {
  return (
    <section className="relative overflow-hidden" style={{ background: '#060D24' }}>
      {/* Foto atmosférica derecha */}
      <div
        className="absolute inset-y-0 right-0 w-1/2 hidden md:block bg-cover bg-center"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1200&q=80')` }}
      />
      {/* Fade hacia navy */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(90deg, #060D24 42%, rgba(6,13,36,0.55) 68%, rgba(6,13,36,0.85) 100%)' }}
      />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-24 md:py-32">
        <div className="max-w-[600px]">
          <p className="font-serif italic mb-6" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 17 }}>
            «No se inquieten por nada.»
          </p>
          <h2 className="font-bold leading-[1.05] tracking-[-0.02em] mb-5 whitespace-pre-line" style={{ color: '#FFFFFF', fontSize: 'clamp(34px, 5vw, 48px)' }}>
            {'¿Tienes una\npetición de oración?'}
          </h2>
          <p className="mb-4 max-w-[520px]" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 17, lineHeight: 1.65 }}>
            No tienes que enfrentarlo solo. Nuestro equipo ora cada semana por las peticiones de nuestra comunidad. Comparte lo que hay en tu corazón.
          </p>
          <p className="font-mono mb-8" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: '2px' }}>
            FILIPENSES 4:6
          </p>

          <div className="flex items-center gap-5">
            <Link
              to="/prayer"
              className="px-8 py-3.5 rounded-full text-[17px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: '#7C3AED' }}
            >
              Enviar petición →
            </Link>
            <Link to="/about" className="text-[15px] font-medium hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>
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
  return (
    <section className="py-20 md:py-28" style={{ background: 'var(--surf)' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div
          className="rounded-[28px] p-10 md:p-16 flex flex-col lg:flex-row gap-12 lg:items-center"
          style={{ background: '#060D24' }}
        >
          {/* Izquierda */}
          <div className="flex-1">
            <p className="font-mono mb-5" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: '2px' }}>
              SIEMBRA Y OFRENDA
            </p>
            <h2 className="font-extrabold leading-[1.0] tracking-[-0.02em] mb-5 whitespace-pre-line" style={{ color: '#FFFFFF', fontSize: 'clamp(34px, 5vw, 52px)' }}>
              {'Tu generosidad\ntransforma vidas.'}
            </h2>
            <p className="max-w-[460px] mb-9" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 17, lineHeight: 1.7 }}>
              Cada semilla impacta familias, financia misiones y sostiene el ministerio de Casa del Rey en Huehuetenango y más allá.
            </p>

            {/* Stats */}
            <div className="flex gap-12 md:gap-16">
              {[
                { v: 'Q48,000', l: 'recaudados este año' },
                { v: '1,284',   l: 'donadores activos' },
              ].map(s => (
                <div key={s.l}>
                  <div className="font-extrabold leading-none" style={{ color: '#FFFFFF', fontSize: 'clamp(40px, 5vw, 64px)', letterSpacing: '-2px' }}>
                    {s.v}
                  </div>
                  <div className="font-medium mt-2" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Derecha — montos + donar */}
          <div className="flex flex-col gap-4 w-full lg:w-auto lg:min-w-[320px] justify-center">
            <div className="flex gap-2.5">
              {DON_AMOUNTS.map((a, i) => {
                const active = i === 1;
                return (
                  <Link
                    key={a}
                    to="/donate"
                    className="flex-1 text-center py-3 rounded-full text-[16px] font-medium transition-colors"
                    style={
                      active
                        ? { background: '#FFFFFF', color: '#060D24', fontWeight: 700 }
                        : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.2)' }
                    }
                  >
                    {a}
                  </Link>
                );
              })}
            </div>
            <Link
              to="/donate"
              className="flex items-center justify-center gap-2 py-4 rounded-full text-[17px] font-bold transition-opacity hover:opacity-90"
              style={{ background: '#FFFFFF', color: '#060D24' }}
            >
              <span className="ms" style={{ fontSize: 18 }}>favorite</span>
              Donar ahora
            </Link>
            <p className="text-center" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
              Pago seguro · 100% al ministerio
            </p>
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
