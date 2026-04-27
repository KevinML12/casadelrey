import DonationCard from '../../components/sections/DonationCard';
import PageHero from '../../components/layout/PageHero';

const IMPACT = [
  { icon: 'groups',     title: 'Células',   desc: 'Equipando líderes de casa en cada barrio' },
  { icon: 'public',     title: 'Misiones',  desc: 'Llevando el evangelio a otras regiones' },
  { icon: 'menu_book',  title: 'Educación', desc: 'Materiales y estudios bíblicos gratuitos' },
  { icon: 'family_restroom', title: 'Familias', desc: 'Apoyo integral a familias en necesidad' },
];

export default function DonatePage() {
  return (
    <main className="min-h-screen bg-surf">
      <PageHero icon="volunteer_activism" title="Tu Generosidad Transforma"
        subtitle="Cada quetzal sembrado con fe produce fruto eterno." />

      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Destinos */}
          <div>
            <h2 className="text-headline-s text-on-surf font-black mb-6">¿A dónde va tu donación?</h2>
            <div className="space-y-3 mb-8">
              {IMPACT.map(({ icon, title, desc }) => (
                <div key={title}
                  className="flex items-start gap-4 p-4 rounded-xl bg-surf-low border border-outline-var hover:shadow-elev-1 transition-all">
                  <div className="leading-icon shrink-0">
                    <span className="ms" style={{ fontSize: 20 }}>{icon}</span>
                  </div>
                  <div>
                    <h3 className="text-title-s text-on-surf font-semibold">{title}</h3>
                    <p className="text-body-s text-on-surf-var mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Versículo */}
            <div className="hero-surf rounded-2xl p-6 relative overflow-hidden">
              <div className="hero-grid" />
              <blockquote className="relative z-10">
                <p className="text-body-m italic leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,.75)' }}>
                  "El que siembra escasamente, también segará escasamente; y el que siembra generosamente, generosamente también segará."
                </p>
                <cite className="text-label-m font-semibold not-italic" style={{ color: '#A4C8FF' }}>
                  — 2 Corintios 9:6
                </cite>
              </blockquote>
            </div>
          </div>

          {/* Formulario */}
          <div className="bg-surf-low border border-outline-var rounded-2xl shadow-elev-1 p-7">
            <h2 className="text-title-l text-on-surf font-black mb-5">Registra tu donación</h2>
            <DonationCard />
          </div>
        </div>
      </div>
    </main>
  );
}
