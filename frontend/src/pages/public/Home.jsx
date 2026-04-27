import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Chip from '../../components/ui/Chip';
import Card, { CardMedia, CardContent, CardActions } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import apiClient from '../../lib/apiClient';

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="hero-surf relative min-h-[92vh] flex items-center overflow-hidden">
      <div className="hero-grid" />

      {/* Glow izquierdo */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: -200, bottom: -200,
          width: 700, height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(21,101,192,.2) 0%, transparent 65%)',
        }}
      />

      {/* Logo decorativo fondo */}
      <img
        src="/logo.png"
        aria-hidden="true"
        className="absolute pointer-events-none select-none"
        style={{
          right: -40, top: '50%',
          transform: 'translateY(-50%)',
          width: 'clamp(280px, 38vw, 500px)',
          opacity: .06,
          filter: 'brightness(0) invert(1)',
        }}
      />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-20 w-full">

        {/* Chip de ubicación */}
        <Chip
          color="default"
          icon="location_on"
          className="mb-6 border-white/10 text-white/60"
          style={{ background: 'rgba(255,255,255,.06)' }}
        >
          Huehuetenango, Guatemala
        </Chip>

        {/* Display Large */}
        <h1 className="text-display-l text-white mb-2">
          Casa<br />
          <span style={{ color: '#A4C8FF' }}>del Rey</span>
        </h1>

        <p className="text-body-l italic mb-4" style={{ color: 'rgba(255,255,255,.45)' }}>
          "Luz para las Naciones"
        </p>

        <p className="text-body-l max-w-[460px] mb-10" style={{ color: 'rgba(255,255,255,.55)', lineHeight: 1.75 }}>
          Iglesia cristiana de restauración familiar. Una comunidad que camina junta en la fe, haciendo discípulos a las naciones.
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap gap-3 mb-12">
          <Button
            as="link" to="/register" size="lg"
            className="font-bold"
            style={{ background: '#A4C8FF', color: '#003063' }}
          >
            <span className="ms" style={{ fontSize: 20 }}>group_add</span>
            Únete a la comunidad
          </Button>
          <Button
            as="link" to="/events" size="lg" variant="outlined"
            style={{ background: 'rgba(255,255,255,.06)', color: '#fff', borderColor: 'rgba(255,255,255,.2)' }}
          >
            <span className="ms" style={{ fontSize: 20 }}>calendar_month</span>
            Próximos eventos
          </Button>
        </div>

        {/* Horarios */}
        <div
          className="flex flex-wrap gap-5 pt-6 mb-10 border-t"
          style={{ borderColor: 'rgba(255,255,255,.08)' }}
        >
          {[
            { icon: 'schedule', label: 'Domingos 10:00 AM' },
            { icon: 'schedule', label: 'Miércoles 7:00 PM' },
            { icon: 'location_on', label: '7a. calle 12-66 zona 4, Huehuetenango' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-body-s" style={{ color: 'rgba(255,255,255,.45)' }}>
              <span className="ms" style={{ fontSize: 18, color: '#A4C8FF' }}>{icon}</span>
              {label}
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-2.5">
          {[
            { value: '200+', label: 'Familias' },
            { value: '20+',  label: 'Células activas' },
            { value: '90+',  label: 'Voluntarios' },
            { value: '10 años', label: 'Sirviendo' },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="rounded-xl px-5 py-4"
              style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}
            >
              <div className="text-display-s text-white" style={{ fontSize: '1.875rem' }}>{value}</div>
              <div className="text-label-m mt-1" style={{ color: 'rgba(255,255,255,.4)' }}>{label}</div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

// ─── Ministerios ─────────────────────────────────────────────────────────────

const AREAS = [
  { icon: 'menu_book',         label: 'Enseñanzas',   desc: 'Mensajes y reflexiones que nutren tu fe cada semana.',        to: '/blog' },
  { icon: 'calendar_month',    label: 'Eventos',       desc: 'Sunday Service, Primicias, retiros y más. Vive con nosotros.', to: '/events' },
  { icon: 'volunteer_activism',label: 'Oración',       desc: 'Comparte tu carga. Una comunidad entera intercede contigo.',   to: '/prayer' },
  { icon: 'handshake',         label: 'Voluntariado',  desc: 'Sirve con tus talentos y haz la diferencia.',                 to: '/volunteering' },
  { icon: 'favorite',          label: 'Donaciones',    desc: 'Tu generosidad equipa ministerios y transforma familias.',    to: '/donate' },
];

function Ministerios() {
  return (
    <section className="py-[72px] bg-surf">
      <div className="max-w-[1200px] mx-auto px-6">

        <div className="flex justify-between items-end mb-9">
          <div>
            <Chip color="secondary" icon="star" className="mb-3">¿Qué hacemos?</Chip>
            <h2 className="text-headline-l text-on-surf">
              Todo lo que necesitas,<br />en un solo lugar
            </h2>
          </div>
          <Button as="link" to="/about" variant="text">
            Conócenos
            <span className="ms" style={{ fontSize: 18 }}>arrow_forward</span>
          </Button>
        </div>

        {/* M3 List en Card outlined */}
        <div className="rounded-xl border border-outline-var overflow-hidden bg-surf">
          {AREAS.map(({ icon, label, desc, to }, i) => (
            <Link
              key={to}
              to={to}
              className={
                'flex items-center gap-4 px-4 py-3 ' +
                'relative overflow-hidden cursor-pointer ' +
                'before:content-[""] before:absolute before:inset-0 before:bg-on-surf ' +
                'before:opacity-0 before:transition-opacity before:duration-150 ' +
                'hover:before:opacity-[.08] transition-colors ' +
                (i > 0 ? 'border-t border-outline-var' : '')
              }
            >
              {/* Leading icon container */}
              <div className="leading-icon shrink-0">
                <span className="ms">{icon}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-title-m text-on-surf">{label}</p>
                <p className="text-body-s text-on-surf-var mt-0.5">{desc}</p>
              </div>

              <span className="ms text-outline shrink-0" style={{ fontSize: 20 }}>chevron_right</span>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}

// ─── Últimas enseñanzas ───────────────────────────────────────────────────────

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
    <section className="py-[72px]" style={{ background: 'var(--surf-low)' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="h-8 bg-surf-high rounded w-48 mb-4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-surf-high rounded-md h-64 animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  );

  if (!posts.length) return null;

  const gradients = [
    'linear-gradient(160deg,#060E30 0%,#1565C0 100%)',
    'linear-gradient(160deg,#0D1B5E 0%,#1A2E7A 100%)',
    'linear-gradient(160deg,#1565C0 0%,#006399 100%)',
  ];

  return (
    <section className="py-[72px]" style={{ background: 'var(--surf-low)' }}>
      <div className="max-w-[1200px] mx-auto px-6">

        <div className="flex justify-between items-end mb-9">
          <div>
            <Chip color="primary" icon="auto_stories" className="mb-3">Palabra de Dios</Chip>
            <h2 className="text-headline-m text-on-surf">Últimas enseñanzas</h2>
          </div>
          <Button as="link" to="/blog" variant="text">
            Ver todo <span className="ms" style={{ fontSize: 18 }}>arrow_forward</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {posts.map((post, i) => (
            <Link key={post.ID} to={`/blog/${post.slug}`}>
              <Card variant="elevated" className="rounded-md h-full">
                <CardMedia height={160} style={{ background: gradients[i % 3] }}>
                  <span className="ms" style={{ fontSize: 48, color: 'rgba(255,255,255,.15)' }}>menu_book</span>
                </CardMedia>
                <CardContent>
                  <p className="text-label-s text-pri mb-2">
                    {post.category || 'Enseñanza'}
                  </p>
                  <p className="text-title-m text-on-surf mb-2 line-clamp-2 leading-snug">
                    {post.title}
                  </p>
                  <p className="text-body-s text-on-surf-var line-clamp-2">
                    {post.excerpt || post.content?.replace(/<[^>]+>/g, '').substring(0, 100)}
                  </p>
                </CardContent>
                <CardActions>
                  <Button variant="text" size="sm" as="span">
                    Leer <span className="ms" style={{ fontSize: 16 }}>arrow_forward</span>
                  </Button>
                </CardActions>
              </Card>
            </Link>
          ))}
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
    <section className="py-[72px] bg-surf">
      <div className="max-w-[1200px] mx-auto px-6">

        <div className="flex justify-between items-end mb-9">
          <div>
            <Chip color="secondary" icon="event" className="mb-3">Agenda</Chip>
            <h2 className="text-headline-m text-on-surf">Próximos eventos</h2>
          </div>
          <Button as="link" to="/events" variant="text">
            Ver todos <span className="ms" style={{ fontSize: 18 }}>arrow_forward</span>
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {events.map(ev => {
            const d = ev.date ? new Date(ev.date + 'T12:00:00') : null;
            return (
              <Card key={ev.ID} variant="elevated" className="rounded-xl p-4 flex items-center gap-4">
                {/* Avatar de fecha */}
                {d && (
                  <div className="w-[52px] h-[52px] rounded-md bg-sec-con flex flex-col items-center justify-center shrink-0">
                    <span className="text-label-s text-pri" style={{ fontSize: '.625rem' }}>
                      {d.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}
                    </span>
                    <span className="text-headline-s text-on-sec-con font-black" style={{ fontSize: '1.25rem', lineHeight: 1 }}>
                      {d.getDate()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-title-m text-on-surf">{ev.title}</p>
                  {ev.location && (
                    <p className="text-body-s text-on-surf-var flex items-center gap-1 mt-1">
                      <span className="ms" style={{ fontSize: 14 }}>location_on</span>
                      {ev.location}
                    </p>
                  )}
                </div>
                <Button as="link" to="/events" variant="tonal" size="sm">Ver más</Button>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Oración ─────────────────────────────────────────────────────────────

function OracionCTA() {
  return (
    <section className="py-[72px]" style={{ background: 'var(--sec-con)' }}>
      <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-10">

        <div className="flex-1 min-w-[280px]">
          <Chip color="primary" icon="volunteer_activism" className="mb-4">Estamos aquí</Chip>
          <h2 className="text-display-s text-on-sec-con mb-4 leading-[1.2]">
            ¿Tienes una petición<br />de oración?
          </h2>
          <p className="text-body-l text-on-sec-con max-w-[460px]" style={{ opacity: .7, lineHeight: 1.75 }}>
            No estás solo. Cientos de personas intercederán por ti esta semana con amor y fe genuina.
          </p>
        </div>

        <Button as="link" to="/prayer" variant="filled" size="lg" className="shrink-0">
          <span className="ms" style={{ fontSize: 22 }}>send</span>
          Enviar petición
        </Button>

      </div>
    </section>
  );
}

// ─── Donaciones ───────────────────────────────────────────────────────────────

function Donaciones() {
  return (
    <section className="py-[72px] bg-surf">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="hero-surf rounded-[28px] p-10 md:p-14 flex flex-col md:flex-row items-start md:items-center gap-10 relative overflow-hidden">
          <div className="hero-grid" />

          <div className="relative z-10 flex-1 min-w-[280px]">
            <Chip
              icon="volunteer_activism"
              className="mb-4 border-white/10 text-white/60"
              style={{ background: 'rgba(255,255,255,.06)' }}
            >
              Siembra y Ofrenda
            </Chip>
            <h2 className="text-headline-l text-white mb-3 leading-[1.2]">
              Tu generosidad<br />transforma vidas
            </h2>
            <p className="text-body-m max-w-[360px]" style={{ color: 'rgba(255,255,255,.5)', lineHeight: 1.75 }}>
              Cada donación alimenta células, equipa ministerios y lleva la luz a quienes más lo necesitan.
            </p>
          </div>

          <div className="relative z-10 flex flex-col gap-2.5 min-w-[200px] w-full md:w-auto">
            {['Q50', 'Q100', 'Q250'].map(a => (
              <Button
                key={a} as="link" to="/donate"
                className="justify-center"
                style={{ background: 'rgba(255,255,255,.07)', color: '#fff', borderColor: 'rgba(255,255,255,.12)' }}
                variant="outlined"
              >
                {a}
              </Button>
            ))}
            <Button
              as="link" to="/donate"
              className="justify-center font-bold"
              style={{ background: '#A4C8FF', color: '#003063' }}
            >
              <span className="ms" style={{ fontSize: 18 }}>favorite</span>
              Donar ahora
            </Button>
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
      <UltimasEnsenanzas />
      <ProximosEventos />
      <OracionCTA />
      <Donaciones />
    </>
  );
}
