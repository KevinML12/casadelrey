import DonationCard from '../../components/sections/DonationCard';
import PageHero from '../../components/layout/PageHero';

const IMPACT = [
  { icon: 'groups',  title: 'Células',   desc: 'Equipando líderes de casa en cada barrio' },
  { icon: 'public',  title: 'Misiones',  desc: 'Llevando el evangelio a otras regiones' },
  { icon: 'menu_book',   title: 'Educación', desc: 'Materiales y estudios bíblicos gratuitos' },
  { icon: 'favorite',  title: 'Familias',  desc: 'Apoyo integral a familias en necesidad' },
];

export default function DonatePage() {
  return (
    <main className="min-h-screen bg-bg text-white relative overflow-hidden">
      
      {/* Orbes de fondo general */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-celeste/20 rounded-full mix-blend-screen filter blur-[150px] opacity-40 animate-blob" />
      <div className="absolute bottom-1/4 left-0 w-[600px] h-[600px] bg-emerald/20 rounded-full mix-blend-screen filter blur-[150px] opacity-30 animate-blob" style={{ animationDelay: '3s' }} />

      <PageHero
        icon="volunteer_activism"
        title="Tu generosidad transforma."
        subtitle="Cada quetzal sembrado con fe produce fruto eterno."
      />

      <section className="relative py-16 md:py-24 overflow-hidden z-10">
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
            
            {/* Destinos + versículo */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="h-px w-10 bg-gradient-to-r from-celeste to-transparent" />
                <span className="text-celeste text-[11px] font-extrabold uppercase tracking-widest">
                  ¿A dónde va tu donación?
                </span>
              </div>
              <h2 className="display-mega text-white" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
                Siembra con<br />
                <span className="text-emerald">alegría</span>
                .
              </h2>

              <div className="mt-8 space-y-4">
                {IMPACT.map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4 liquid-glass rounded-[24px] p-5 hover:bg-white/5 transition-colors card-spring">
                    <span className="grid place-items-center w-12 h-12 rounded-full bg-white/10 text-celeste shrink-0">
                      <span className="material-symbols-rounded">{icon}</span>
                    </span>
                    <div>
                      <h3 className="text-[16px] font-extrabold tracking-tightish text-white">{title}</h3>
                      <p className="text-[14px] text-white/60 mt-1">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Versículo */}
              <div className="mt-8 liquid-glass rounded-[32px] p-8 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-[200px] h-[200px] bg-amber/20 rounded-full mix-blend-screen filter blur-[80px]" />
                <blockquote className="relative z-10">
                  <p
                    className="italic text-white leading-snug mb-4"
                    style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 'clamp(1.2rem, 2.4vw, 1.6rem)' }}
                  >
                    “El que siembra escasamente, también segará escasamente; y el que siembra generosamente, generosamente también segará.”
                  </p>
                  <cite className="not-italic text-amber text-[11px] font-extrabold uppercase tracking-widest">
                    2 Corintios 9:6
                  </cite>
                </blockquote>
              </div>
            </div>

            {/* Formulario glass */}
            <div className="liquid-glass rounded-[32px] p-7 md:p-10 relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-emerald/10 rounded-full mix-blend-screen filter blur-[100px]" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-5">
                  <span className="h-px w-10 bg-gradient-to-r from-emerald to-transparent" />
                  <span className="text-emerald text-[11px] font-extrabold uppercase tracking-widest">
                    Registra tu donación
                  </span>
                </div>
                <h2 className="display-mega text-white mb-8" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.2rem)' }}>
                  Sembrar es sumar.
                </h2>
                
                {/* Asumiendo que DonationCard maneja sus propios estilos o hereda los del contenedor */}
                <div className="donation-wrapper">
                  <DonationCard />
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>
    </main>
  );
}
