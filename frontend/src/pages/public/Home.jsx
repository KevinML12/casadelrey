import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquare, Heart, BookOpen, Calendar, Users, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import Reveal, { RevealList, RevealItem } from '../../components/ui/Reveal';

const ease = [0.25, 0.1, 0.25, 1];

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-screen bg-navy flex items-center overflow-hidden">
      {/* Dot grid background */}
      <div className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy-d via-navy to-navy-l opacity-80" />

      <div className="relative z-10 container mx-auto px-6 py-32 md:py-40">
        <div className="max-w-3xl">
          {/* Tag */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            <span className="text-white/70 text-xs font-medium tracking-widest uppercase">Iglesia en Huehuetenango, Guatemala</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
            className="text-7xl md:text-8xl lg:text-9xl font-black text-white leading-none tracking-tight mb-6"
          >
            Casa<br />
            <span className="text-gold">del Rey</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.35, ease }}
            className="text-white/60 text-lg md:text-xl max-w-lg leading-relaxed mb-10"
          >
            Una comunidad que cree en la transformación real de vidas a través de la fe, el amor y el servicio.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.48, ease }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Link to="/register" className="group inline-flex items-center gap-2 px-7 py-3.5 bg-gold text-white font-bold rounded-md hover:bg-gold-d transition-colors shadow-gold-glow">
              Únete a la comunidad
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link to="/events" className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/20 text-white font-medium rounded-md hover:bg-white/5 transition-colors">
              Ver próximos eventos
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.65, ease }}
            className="flex flex-wrap gap-x-10 gap-y-4 mt-14 pt-10 border-t border-white/10"
          >
            {[
              { value: '5K+',  label: 'Miembros' },
              { value: '200+', label: 'Eventos al año' },
              { value: '15+',  label: 'Años de historia' },
            ].map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 + i * 0.08, ease }}
              >
                <div className="text-3xl font-black text-white">{s.value}</div>
                <div className="text-white/40 text-sm mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Ministerios ──────────────────────────────────────────────────────────────

const AREAS = [
  { icon: MessageSquare, label: 'Oración',   desc: 'Comparte tu carga. Una comunidad entera intercede contigo.', to: '/prayer' },
  { icon: Calendar,      label: 'Eventos',   desc: 'Domingo Service, Primicias, retiros y mucho más.', to: '/events' },
  { icon: BookOpen,      label: 'Blog',       desc: 'Enseñanzas y reflexiones para tu crecimiento.', to: '/blog' },
  { icon: Heart,         label: 'Donaciones', desc: 'Tu generosidad enciende la visión del ministerio.', to: '/donate' },
];

function Ministerios() {
  return (
    <section className="py-24 bg-bg">
      <div className="container mx-auto px-6">
        <Reveal className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-blue font-semibold text-sm uppercase tracking-widest mb-2">Ministerios</p>
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

// ─── Domingo ──────────────────────────────────────────────────────────────────

function Domingo() {
  return (
    <section className="bg-navy py-20">
      <div className="container mx-auto px-6">
        <Reveal className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <p className="text-gold font-bold text-xs uppercase tracking-widest mb-3">Cada semana</p>
            <h2 className="text-5xl font-black text-white leading-none mb-4">
              Sunday<br />Service
            </h2>
            <div className="flex flex-col gap-2 text-white/60 text-sm">
              <span className="flex items-center gap-2"><Clock size={14} className="text-gold" /> Domingos 10:00 AM</span>
              <span className="flex items-center gap-2"><MapPin size={14} className="text-gold" /> 7a. Calle 12-66, Huehuetenango</span>
            </div>
          </div>
          <Link to="/events" className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-white font-semibold rounded-md hover:bg-gold-d transition-colors shrink-0">
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
            ¿Tienes una petición de oración?
          </h2>
          <p className="text-ink-2 text-lg leading-relaxed mb-8">
            No estás solo. Nuestra comunidad intercede por cada necesidad con amor y fe. Comparte tu petición y cientos de personas orarán por ti.
          </p>
          <Link to="/prayer" className="group inline-flex items-center gap-2 px-7 py-3.5 bg-navy text-white font-semibold rounded-md hover:bg-navy-d transition-colors">
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
            <Link to="/donate" className="px-8 py-3 rounded-md bg-gold text-white font-bold text-center hover:bg-gold-d transition-colors shadow-gold-glow">
              Donar ahora →
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Células ──────────────────────────────────────────────────────────────────

function Celulas() {
  return (
    <section className="py-24 bg-bg-2">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start gap-16">
          <Reveal className="flex-1">
            <p className="text-blue font-semibold text-sm uppercase tracking-widest mb-3">Comunidad</p>
            <h2 className="text-4xl font-black text-ink leading-tight mb-5">
              Crecer juntos,<br />casa por casa
            </h2>
            <p className="text-ink-2 leading-relaxed mb-8">
              Las células son el corazón de Casa del Rey. Pequeños grupos que se reúnen cada semana para orar, estudiar y apoyarse mutuamente.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/register" className="group inline-flex items-center gap-2 px-6 py-3 bg-navy text-white font-semibold rounded-md hover:bg-navy-d transition-colors">
                <Users size={16} /> Unirme a una célula
              </Link>
              <Link to="/about" className="inline-flex items-center gap-2 px-6 py-3 border border-line text-ink-2 font-medium rounded-md hover:border-blue hover:text-blue transition-colors">
                Conócenos
              </Link>
            </div>
          </Reveal>

          <RevealList className="flex-1 grid grid-cols-2 gap-4" stagger={0.08} delay={0.1}>
            {[
              { n: '5K+', l: 'Miembros activos' },
              { n: '80+', l: 'Células activas' },
              { n: '15+', l: 'Años de historia' },
              { n: '4',   l: 'Sedes regionales' },
            ].map(({ n, l }) => (
              <RevealItem key={l}>
                <div className="p-6 rounded-xl bg-card border border-line">
                  <div className="text-4xl font-black text-ink mb-1">{n}</div>
                  <div className="text-ink-3 text-sm">{l}</div>
                </div>
              </RevealItem>
            ))}
          </RevealList>
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
      <Domingo />
      <OracionCTA />
      <Donaciones />
      <Celulas />
    </>
  );
}
