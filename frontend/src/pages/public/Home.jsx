import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquare, Heart, BookOpen, Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import Reveal, { RevealList, RevealItem } from '../../components/ui/Reveal';
import apiClient from '../../lib/apiClient';

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-[90vh] bg-navy flex items-center overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      <div className="absolute inset-0 bg-gradient-to-br from-navy-d via-navy to-navy-l opacity-80" />

      <div className="relative z-10 container mx-auto px-6 py-24 md:py-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            <span className="text-white/70 text-xs font-medium tracking-widest uppercase">Huehuetenango, Guatemala</span>
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white leading-none tracking-tight mb-6">
            Casa<br />
            <span className="text-gold">del Rey</span>
          </h1>

          <p className="text-white/60 text-lg md:text-xl max-w-lg leading-relaxed mb-10">
            Una familia que camina junta en la fe. Aquí encontrarás comunidad, propósito y el amor de Dios.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/register"
              className="group inline-flex items-center gap-2 px-7 py-3.5 bg-gold text-white font-bold rounded-md hover:bg-gold-d transition-colors shadow-gold-glow">
              Únete a la comunidad
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link to="/events"
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/20 text-white font-medium rounded-md hover:bg-white/5 transition-colors">
              Ver próximos eventos
            </Link>
          </div>

          {/* Horario destacado */}
          <div className="flex flex-wrap gap-x-8 gap-y-3 mt-12 pt-10 border-t border-white/10">
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <Clock size={14} className="text-gold" />
              <span>Domingos 10:00 AM</span>
            </div>
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <Clock size={14} className="text-gold" />
              <span>Miércoles 7:00 PM</span>
            </div>
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <MapPin size={14} className="text-gold" />
              <span>7a. Calle 12-66, Huehuetenango</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Ministerios ──────────────────────────────────────────────────────────────

const AREAS = [
  { icon: BookOpen,      label: 'Enseñanzas',  desc: 'Mensajes y reflexiones que nutren tu fe cada semana.',      to: '/blog' },
  { icon: Calendar,      label: 'Eventos',      desc: 'Sunday Service, Primicias, retiros y más. Vive con nosotros.', to: '/events' },
  { icon: MessageSquare, label: 'Oración',      desc: 'Comparte tu carga. Una comunidad entera intercede contigo.', to: '/prayer' },
  { icon: Heart,         label: 'Donaciones',   desc: 'Tu generosidad equipa ministerios y transforma familias.',  to: '/donate' },
];

function Ministerios() {
  return (
    <section className="py-24 bg-bg">
      <div className="container mx-auto px-6">
        <Reveal className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-blue font-semibold text-sm uppercase tracking-widest mb-2">¿Qué hacemos?</p>
            <h2 className="text-4xl font-black text-ink leading-tight">
              Todo lo que necesitas,<br />en un solo lugar
            </h2>
          </div>
          <Link to="/about" className="text-sm font-medium text-ink-2 hover:text-ink flex items-center gap-1.5 shrink-0">
            Conócenos <ArrowRight size={14} />
          </Link>
        </Reveal>

        <RevealList className="divide-y divide-line">
          {AREAS.map(({ icon: Icon, label, desc, to }) => (
            <RevealItem key={to}>
              <Link to={to}
                className="group flex items-center justify-between py-6 hover:pl-2 transition-all duration-200">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-lg bg-card-2 border border-line flex items-center justify-center shrink-0 group-hover:border-blue/30 group-hover:bg-blue/5 transition-colors">
                    <Icon size={18} className="text-ink-3 group-hover:text-blue transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-bold text-ink group-hover:text-blue transition-colors">{label}</h3>
                    <p className="text-sm text-ink-3 leading-snug mt-0.5">{desc}</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-ink-3 group-hover:text-blue group-hover:translate-x-0.5 transition-all shrink-0 ml-4" />
              </Link>
            </RevealItem>
          ))}
        </RevealList>
      </div>
    </section>
  );
}

// ─── Últimas enseñanzas (datos reales) ───────────────────────────────────────

function UltimasEnseñanzas() {
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/blog/')
      .then(r => setPosts((r.data || []).slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <section className="py-20 bg-bg-2">
      <div className="container mx-auto px-6">
        <div className="h-8 bg-card-2 rounded w-48 mb-4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[0,1,2].map(i => (
            <div key={i} className="bg-card rounded-xl h-60 animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  );

  if (posts.length === 0) return null;

  return (
    <section className="py-24 bg-bg-2">
      <div className="container mx-auto px-6">
        <Reveal className="flex items-end justify-between mb-10">
          <div>
            <p className="text-blue font-semibold text-sm uppercase tracking-widest mb-2">Palabra de Dios</p>
            <h2 className="text-3xl font-black text-ink">Últimas enseñanzas</h2>
          </div>
          <Link to="/blog" className="text-sm font-medium text-ink-2 hover:text-ink flex items-center gap-1.5">
            Ver todo <ChevronRight size={14} />
          </Link>
        </Reveal>

        <RevealList className="grid grid-cols-1 md:grid-cols-3 gap-5" stagger={0.06}>
          {posts.map(post => (
            <RevealItem key={post.ID}>
              <Link to={`/blog/${post.slug}`}
                className="group block bg-card border border-line rounded-xl overflow-hidden hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200">
                {post.cover_image ? (
                  <img src={post.cover_image} alt={post.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-navy-gradient flex items-center justify-center">
                    <BookOpen size={28} className="text-gold/40" />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-bold text-ink text-sm mb-2 leading-snug group-hover:text-blue transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-xs text-ink-3 leading-relaxed line-clamp-2">
                    {post.excerpt || post.content?.replace(/<[^>]+>/g, '').substring(0, 100)}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-blue">
                    Leer <ArrowRight size={11} />
                  </div>
                </div>
              </Link>
            </RevealItem>
          ))}
        </RevealList>
      </div>
    </section>
  );
}

// ─── Próximos eventos (datos reales) ─────────────────────────────────────────

function ProximosEventos() {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/events/')
      .then(r => setEvents((r.data || []).slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || events.length === 0) return null;

  return (
    <section className="py-24 bg-bg">
      <div className="container mx-auto px-6">
        <Reveal className="flex items-end justify-between mb-10">
          <div>
            <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-2">Agenda</p>
            <h2 className="text-3xl font-black text-ink">Próximos eventos</h2>
          </div>
          <Link to="/events" className="text-sm font-medium text-ink-2 hover:text-ink flex items-center gap-1.5">
            Ver todos <ChevronRight size={14} />
          </Link>
        </Reveal>

        <RevealList className="space-y-3" stagger={0.07}>
          {events.map(ev => (
            <RevealItem key={ev.ID}>
              <div className="bg-card border border-line rounded-xl px-5 py-4 flex items-center gap-5 hover:border-blue/20 transition-colors">
                {/* Fecha */}
                {ev.date && (
                  <div className="shrink-0 w-14 h-14 rounded-xl bg-navy flex flex-col items-center justify-center text-white">
                    <span className="text-xs font-bold text-gold uppercase">
                      {new Date(ev.date + 'T12:00:00').toLocaleDateString('es-ES', { month: 'short' })}
                    </span>
                    <span className="text-xl font-black leading-none">
                      {new Date(ev.date + 'T12:00:00').getDate()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink">{ev.title}</p>
                  {ev.location && (
                    <p className="text-sm text-ink-3 flex items-center gap-1.5 mt-0.5">
                      <MapPin size={12} className="shrink-0" /> {ev.location}
                    </p>
                  )}
                  {ev.description && (
                    <p className="text-xs text-ink-3 mt-1 line-clamp-1">{ev.description}</p>
                  )}
                </div>
                <Link to="/events" className="shrink-0 text-xs font-medium text-blue hover:underline">
                  Ver más
                </Link>
              </div>
            </RevealItem>
          ))}
        </RevealList>
      </div>
    </section>
  );
}

// ─── Domingo ──────────────────────────────────────────────────────────────────

function Domingo() {
  return (
    <section className="bg-navy py-20">
      <div className="container mx-auto px-6">
        <Reveal className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <p className="text-gold font-bold text-xs uppercase tracking-widest mb-3">Cada semana</p>
            <h2 className="text-4xl font-black text-white leading-none mb-4">
              Sunday<br />Service
            </h2>
            <div className="flex flex-col gap-2 text-white/60 text-sm">
              <span className="flex items-center gap-2"><Clock size={14} className="text-gold" /> Domingos 10:00 AM</span>
              <span className="flex items-center gap-2"><Clock size={14} className="text-gold" /> Miércoles 7:00 PM</span>
              <span className="flex items-center gap-2"><MapPin size={14} className="text-gold" /> 7a. Calle 12-66, Huehuetenango</span>
            </div>
          </div>
          <Link to="/events"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-white font-semibold rounded-md hover:bg-gold-d transition-colors shrink-0">
            Ver calendario <ArrowRight size={15} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Oración CTA ──────────────────────────────────────────────────────────────

function OracionCTA() {
  return (
    <section className="py-24 bg-bg-2">
      <div className="container mx-auto px-6">
        <Reveal className="max-w-2xl">
          <p className="text-blue font-semibold text-sm uppercase tracking-widest mb-3">Estamos aquí</p>
          <h2 className="text-4xl md:text-5xl font-black text-ink mb-5 leading-tight">
            ¿Tienes una petición<br />de oración?
          </h2>
          <p className="text-ink-2 text-lg leading-relaxed mb-8">
            No estás solo. Nuestra comunidad ora por cada necesidad con amor y fe. Comparte tu petición y cientos de personas intercederán por ti esta semana.
          </p>
          <Link to="/prayer"
            className="group inline-flex items-center gap-2 px-7 py-3.5 bg-navy text-white font-semibold rounded-md hover:bg-navy-d transition-colors">
            Enviar petición de oración
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Donaciones ───────────────────────────────────────────────────────────────

function Donaciones() {
  return (
    <section className="py-24 bg-bg">
      <div className="container mx-auto px-6">
        <Reveal className="bg-navy rounded-2xl p-10 md:p-14 flex flex-col md:flex-row items-start md:items-center gap-10">
          <div className="flex-1">
            <p className="text-gold font-bold text-xs uppercase tracking-widest mb-3">Siembra y Ofrenda</p>
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              Tu generosidad<br />transforma vidas
            </h2>
            <p className="text-white/50 leading-relaxed text-sm max-w-sm">
              Cada donación alimenta células, equipa ministerios y lleva la luz a comunidades que más lo necesitan.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto">
            {['Q50', 'Q100', 'Q250'].map(a => (
              <Link key={a} to="/donate"
                className="px-8 py-3 rounded-md border border-white/15 bg-white/5 text-white text-center font-bold hover:bg-white/10 hover:border-gold/40 transition-all">
                {a}
              </Link>
            ))}
            <Link to="/donate"
              className="px-8 py-3 rounded-md bg-gold text-white font-bold text-center hover:bg-gold-d transition-colors shadow-gold-glow">
              Donar ahora →
            </Link>
          </div>
        </Reveal>
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
      <UltimasEnseñanzas />
      <ProximosEventos />
      <Domingo />
      <OracionCTA />
      <Donaciones />
    </>
  );
}
