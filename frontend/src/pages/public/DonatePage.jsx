import DonationCard from '../../components/sections/DonationCard';
import PageHero from '../../components/layout/PageHero';
import { Icon, Eyebrow } from '../../components/ui/Glass';
import Reveal, { RevealList, RevealItem } from '../../components/ui/Reveal';
import Tilt from '../../components/ui/Tilt';
import ParallaxImg from '../../components/ui/ParallaxImg';
import { useSitePhoto } from '../../lib/feed';

const IMPACT = [
  { icon: 'users',     title: 'Células',   desc: 'Equipando líderes de casa en cada barrio' },
  { icon: 'spark',     title: 'Misiones',  desc: 'Llevando el evangelio a otras regiones' },
  { icon: 'book',      title: 'Educación', desc: 'Materiales y estudios bíblicos gratuitos' },
  { icon: 'heart',     title: 'Familias',  desc: 'Apoyo integral a familias en necesidad' },
];

export default function DonatePage() {
  const sectionImg = useSitePhoto('donar_seccion', '/images/bg-donar.jpg');
  return (
    <main className="min-h-screen bg-bg text-white relative overflow-hidden">
      <PageHero
        eyebrow="Generosidad"
        title="Tu generosidad transforma."
        subtitle="Cada quetzal sembrado con fe produce fruto eterno."
        photoSlot="hero_donar"
        photoFallback="/images/bg-legado.jpg"
      />

      <section className="relative py-16 md:py-24 z-10 overflow-hidden">
        {/* Foto ambiente propia: el hero se desvanece antes de llegar aquí y
            el cristal sobre navy plano se lee como caja gris — el material
            necesita una escena detrás. Administrable (donar_seccion). */}
        <ParallaxImg src={sectionImg} alt="" className="opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/60 to-bg pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">

            {/* Destinos + versículo */}
            <div>
              <Reveal className="mb-8">
                <Eyebrow>¿A dónde va tu donación?</Eyebrow>
                <h2 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
                  Siembra con alegría.
                </h2>
              </Reveal>

              <RevealList className="space-y-3">
                {IMPACT.map(({ icon, title, desc }) => (
                  <RevealItem key={title}>
                    <Tilt max={3} glass="standard" className="flex items-center gap-4 glass-light rounded-[20px] p-5">
                      <span className="grid place-items-center w-12 h-12 rounded-full bg-bg/8 border border-bg/12 text-bg shrink-0">
                        <Icon name={icon} className="w-5 h-5" />
                      </span>
                      <div>
                        <h3 className="text-[16px] font-bold tracking-tight text-bg">{title}</h3>
                        <p className="text-[14px] text-bg/60 mt-0.5">{desc}</p>
                      </div>
                    </Tilt>
                  </RevealItem>
                ))}
              </RevealList>

              {/* Versículo */}
              <Reveal delay={0.1}>
                <div className="mt-6 glass-light rounded-[24px] p-8">
                  <blockquote>
                    <p className="text-bg leading-relaxed mb-4" style={{ fontSize: 'clamp(1.1rem, 2.2vw, 1.4rem)' }}>
                      "El que siembra escasamente, también segará escasamente; y el que siembra
                      generosamente, generosamente también segará."
                    </p>
                    <cite className="not-italic text-bg/50 text-[13px] font-bold">
                      2 Corintios 9:6
                    </cite>
                  </blockquote>
                </div>
              </Reveal>
            </div>

            {/* Acordeón de donación — cada paso es su propia card de
                cristal directamente sobre la foto (sin panel envolvente:
                cristal anidado prohibido por la guía) */}
            <Reveal from="right" delay={0.05}>
              <Eyebrow>Registra tu donación</Eyebrow>
              <h2 className="display-mega text-white mt-4 mb-7" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.2rem)' }}>
                Sembrar es sumar.
              </h2>
              <DonationCard />
            </Reveal>

          </div>
        </div>
      </section>
    </main>
  );
}
