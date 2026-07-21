import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHero from '../../components/layout/PageHero';
import SocialSection from '../../components/sections/SocialSection';
import { Icon, Eyebrow } from '../../components/ui/Glass';
import Reveal, { RevealList, RevealItem } from '../../components/ui/Reveal';
import Tilt from '../../components/ui/Tilt';
import ParallaxImg from '../../components/ui/ParallaxImg';
import { useSitePhoto } from '../../lib/feed';
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

export default function AboutPage() {
  // Fotos administrables (AdminSitePhotos) con fallback local garantizado
  const pastoresImg   = useSitePhoto('about_pastores',   '/images/nosotros/pastores.jpg');
  const servidoresImg = useSitePhoto('about_servidores', '/images/nosotros/servidores.jpg');
  const comunidadImg  = useSitePhoto('about_comunidad',  '/images/nosotros/comunidad.jpg');
  const lideresImg    = useSitePhoto('about_lideres',    '/images/nosotros/lideres.jpg');
  const volunteerAreas = useVolunteerAreas();

  return (
    <main className="min-h-screen bg-bg text-white">
      <PageHero
        eyebrow="Nuestra historia"
        title="Somos Casa del Rey."
        subtitle="Una iglesia familiar en Huehuetenango, edificada célula por célula, generación tras generación."
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
              <Tilt max={4} glass="standard" className="glass-light rounded-[24px] p-8 md:p-10 h-full">
                <div className="w-14 h-14 rounded-full bg-bg/8 border border-bg/12 flex items-center justify-center mb-6">
                  <Icon name="crown" className="w-6 h-6 text-bg" />
                </div>
                <p className="text-13 font-bold text-bg/50 uppercase tracking-tightish mb-2">Pastores fundadores</p>
                <h3 className="text-24 font-bold text-bg tracking-tight leading-tight">
                  José de León <span className="text-bg/40 font-medium">(+)</span> y Desidería López
                </h3>
                <p className="mt-4 text-15 text-bg/60 leading-relaxed">
                  Sembraron la visión original de Casa del Rey — los cimientos sobre los que la iglesia sigue edificando hoy.
                </p>
              </Tilt>
            </RevealItem>

            <RevealItem>
              <Tilt max={4} glass="featured" className="glass-light rounded-[24px] p-8 md:p-10 h-full">
                <div className="w-14 h-14 rounded-full bg-bg/8 border border-bg/12 flex items-center justify-center mb-6">
                  <Icon name="users" className="w-6 h-6 text-bg" />
                </div>
                <p className="text-13 font-bold text-bg/50 uppercase tracking-tightish mb-2">Pastores de células</p>
                <h3 className="text-24 font-bold text-bg tracking-tight leading-tight">
                  Leonel de León e Ismeina Castillo
                </h3>
                <p className="mt-4 text-15 text-bg/60 leading-relaxed">
                  Junto a un equipo pastoral, cubren las células de varones, prejuveniles y la red Mujeres de Palabra.
                </p>
              </Tilt>
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
              <Tilt max={3} glass="standard" className="glass-light rounded-[24px] p-9 md:p-11 h-full">
                <h3 className="text-20 font-bold text-bg mb-4">Misión</h3>
                <p className="text-17 md:text-19 text-bg/75 leading-relaxed">
                  Somos una iglesia cristiana familiar, enfocada en cumplir la gran comisión de
                  Jesucristo: ir y hacer discípulos a las naciones, formando líderes capaces de
                  reproducir la obra de Dios.
                </p>
              </Tilt>
            </RevealItem>
            <RevealItem>
              <Tilt max={3} glass="standard" className="glass-light rounded-[24px] p-9 md:p-11 h-full">
                <h3 className="text-20 font-bold text-bg mb-4">Visión</h3>
                <p className="text-17 md:text-19 text-bg/75 leading-relaxed">
                  Ser una iglesia de restauración familiar, punta de lanza, que proclama la
                  verdad de la Palabra de Dios bajo el poder del Espíritu Santo.
                </p>
              </Tilt>
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
            <div className="glass-light rounded-[24px] p-8 md:p-10">
              <p className="text-13 font-bold text-bg/50 uppercase tracking-tightish mb-5">Departamentos de voluntariado</p>
              <div className="flex flex-wrap gap-2.5">
                {volunteerAreas.map(d => (
                  <span key={d.value} className="px-4 py-2 rounded-full bg-bg/6 border border-bg/10 text-14 font-semibold text-bg/80">
                    {d.title}
                  </span>
                ))}
              </div>
              <Link
                to="/volunteering"
                className="mt-7 inline-flex items-center gap-2.5 text-14 font-bold text-bg hover:text-bg/70 transition-colors"
              >
                Únete como voluntario
                <Icon name="arrow" className="w-4 h-4" stroke={2} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Células — acceso directo al módulo */}
      <section className="relative py-16 md:py-24 border-t border-white/5 overflow-hidden">
        <ParallaxImg src={lideresImg} alt="" className="opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/50 to-bg" />
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <Reveal className="glass-light rounded-[24px] p-9 md:p-12 flex flex-col md:flex-row items-center gap-8 justify-between">
            <div>
              <Eyebrow on="light">Grupos pequeños</Eyebrow>
              <h2 className="display-mega text-bg mt-4" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>
                Encuentra tu célula.
              </h2>
              <p className="mt-4 text-16 text-bg/70 max-w-lg">
                Adolescentes, jóvenes adultos, prejuveniles, varones y la red
                Mujeres de Palabra — cada grupo se reúne en casas durante la semana.
              </p>
            </div>
            <MotionLink
              to="/celulas"
              {...PRESS}
              className="shrink-0 inline-flex items-center gap-3 px-7 py-4 rounded-pill bg-bg text-white text-15 font-bold focus-ring shadow-card"
            >
              Ver células
              <Icon name="arrow" className="w-4 h-4" stroke={2} />
            </MotionLink>
          </Reveal>
        </div>
      </section>

      {/* Ubicación + podcast */}
      <section className="relative py-16 md:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-5">
          <Reveal from="left">
            <Tilt max={4} glass="standard" className="glass-light rounded-[24px] p-9 md:p-11 h-full">
              <div className="w-12 h-12 rounded-full bg-bg/8 border border-bg/12 flex items-center justify-center mb-6">
                <Icon name="pin" className="w-5 h-5 text-bg" />
              </div>
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
                <Icon name="arrow" className="w-4 h-4" stroke={2} />
              </a>
            </Tilt>
          </Reveal>

          <Reveal from="right" delay={0.08}>
            <Tilt max={4} glass="standard" className="glass-light rounded-[24px] p-9 md:p-11 h-full flex flex-col justify-center">
              <div className="w-12 h-12 rounded-full bg-bg/8 border border-bg/12 flex items-center justify-center mb-6">
                <Icon name="music" className="w-5 h-5 text-bg" />
              </div>
              <h3 className="text-20 font-bold text-bg mb-3">Podcast Inusual Youth</h3>
              <p className="text-15 text-bg/70 leading-relaxed">
                92.9 FM Radio Stereo Cumbre<br />
                Viernes · 3:00 PM
              </p>
            </Tilt>
          </Reveal>
        </div>
      </section>

      <SocialSection title="Síguenos en redes" showDirectAccess />
    </main>
  );
}
