import DonationCard from '../../components/sections/DonationCard';
import PageHero from '../../components/layout/PageHero';
import { Icon, Halos } from '../../components/ui/Glass';

const IMPACT = [
  { icon: 'users',  title: 'Células',   desc: 'Equipando líderes de casa en cada barrio' },
  { icon: 'spark',  title: 'Misiones',  desc: 'Llevando el evangelio a otras regiones' },
  { icon: 'book',   title: 'Educación', desc: 'Materiales y estudios bíblicos gratuitos' },
  { icon: 'heart',  title: 'Familias',  desc: 'Apoyo integral a familias en necesidad' },
];

export default function DonatePage() {
  return (
    <main className="min-h-screen bg-bg text-ink">
      <PageHero
        icon="volunteer_activism"
        title="Tu generosidad transforma."
        subtitle="Cada quetzal sembrado con fe produce fruto eterno."
      />

      <section className="relative py-16 md:py-24 overflow-hidden">
        <Halos variant="soft" />
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
            {/* Destinos + versículo */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="h-px w-10 bg-gradient-to-r from-electric to-transparent" />
                <span className="text-celeste text-[11px] font-extrabold uppercase tracking-widest">
                  ¿A dónde va tu donación?
                </span>
              </div>
              <h2 className="display-mega text-ink" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
                Siembra con<br />
                <span className="text-grad-celeste">alegría</span>
                .
              </h2>

              <div className="mt-8 space-y-3">
                {IMPACT.map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4 bg-bg border border-ink-soft shadow-whisper rounded-md p-4">
                    <span className="grid place-items-center w-11 h-11 rounded-sm bg-bg-soft text-celeste shrink-0">
                      <Icon name={icon} className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-[15px] font-extrabold tracking-tightish text-ink">{title}</h3>
                      <p className="text-[13.5px] text-ink-2 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Versículo */}
              <div className="mt-8 bg-bg border border-ink-soft shadow-card-lg rounded-card p-7 relative overflow-hidden">
                <div className="absolute inset-0 -z-10 pointer-events-none">
                  <div className="halo" style={{ width: 280, height: 280, top: -80, right: -60, background: 'rgba(124,212,255,0.18)' }} />
                </div>
                <blockquote className="relative">
                  <p
                    className="italic text-ink leading-snug mb-4"
                    style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 'clamp(1.2rem, 2.4vw, 1.6rem)' }}
                  >
                    “El que siembra escasamente, también segará escasamente; y el que siembra generosamente, generosamente también segará.”
                  </p>
                  <cite className="not-italic text-celeste text-[11px] font-extrabold uppercase tracking-widest">
                    2 Corintios 9:6
                  </cite>
                </blockquote>
              </div>
            </div>

            {/* Formulario glass */}
            <div className="bg-bg border border-ink-soft shadow-card-lg rounded-card p-7 md:p-9">
              <div className="flex items-center gap-3 mb-5">
                <span className="h-px w-10 bg-gradient-to-r from-electric to-transparent" />
                <span className="text-celeste text-[11px] font-extrabold uppercase tracking-widest">
                  Registra tu donación
                </span>
              </div>
              <h2 className="display-mega text-ink mb-7" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.2rem)' }}>
                Sembrar es<br />sumar.
              </h2>
              <DonationCard />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
