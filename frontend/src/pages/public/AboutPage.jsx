import PageHero from '../../components/layout/PageHero';
import SocialSection from '../../components/sections/SocialSection';

const INFO_ITEMS = [
  { icon: 'schedule', text: 'Domingos 10:00 AM' },
  { icon: 'schedule', text: 'Miércoles 7:00 PM' },
  { icon: 'location_on', text: '7a. calle 12-66 zona 4, Carretera a las Ruinas de Zaculeu, Huehuetenango, Guatemala' },
  { icon: 'phone', text: '4760 0636', href: 'tel:+50247600636' },
  { icon: 'mail', text: 'casadelreyhuehue@gmail.com', href: 'mailto:casadelreyhuehue@gmail.com' },
  { icon: 'chat', text: 'WhatsApp: +502 4760 0636', href: 'https://wa.me/50247600636', external: true },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-surf">
      <PageHero title="Conócenos" subtitle="Somos una familia apasionada por Dios, por su casa y por su gente." />

      <section className="py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="max-w-3xl mx-auto space-y-12">

            {/* Historia */}
            <div>
              <h2 className="text-headline-s text-on-surf font-black mb-4">Nuestra Historia</h2>
              <div className="p-6 rounded-xl bg-surf-low border border-outline-var">
                <p className="text-body-m text-on-surf-var leading-relaxed">Próximamente.</p>
              </div>
            </div>

            {/* Misión, Visión, Valores */}
            <div>
              <h2 className="text-headline-s text-on-surf font-black mb-4">Misión, Visión y Valores</h2>
              <div className="space-y-4">
                {[
                  { label: 'Misión',  icon: 'my_location' },
                  { label: 'Visión',  icon: 'visibility' },
                  { label: 'Valores', icon: 'diamond' },
                ].map(({ label, icon }) => (
                  <div key={label} className="flex items-start gap-4 p-5 rounded-xl bg-surf-low border border-outline-var">
                    <div className="leading-icon shrink-0">
                      <span className="ms" style={{ fontSize: 20 }}>{icon}</span>
                    </div>
                    <div>
                      <span className="text-title-s text-on-surf font-bold block mb-1">{label}</span>
                      <p className="text-body-m text-on-surf-var">Próximamente.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Declaración de Fe */}
            <div>
              <h2 className="text-headline-s text-on-surf font-black mb-4">Declaración de Fe</h2>
              <div className="p-6 rounded-xl bg-surf-low border border-outline-var">
                <p className="text-body-m text-on-surf-var leading-relaxed">Próximamente.</p>
              </div>
            </div>

            {/* Horario y ubicación */}
            <div className="hero-surf rounded-2xl p-8 relative overflow-hidden">
              <div className="hero-grid" />
              <div className="relative z-10">
                <h2 className="text-title-l text-white font-black mb-6">Horario y Ubicación</h2>
                <div className="space-y-4">
                  {INFO_ITEMS.map(({ icon, text, href, external }) => {
                    const content = (
                      <div className="flex items-start gap-3">
                        <span className="ms shrink-0 mt-0.5" style={{ fontSize: 18, color: '#A4C8FF' }}>{icon}</span>
                        <span className="text-body-m" style={{ color: 'rgba(255,255,255,.8)' }}>{text}</span>
                      </div>
                    );
                    if (href) {
                      return (
                        <a key={text} href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
                          className="block hover:opacity-80 transition-opacity">
                          {content}
                        </a>
                      );
                    }
                    return <div key={text}>{content}</div>;
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <SocialSection title="Prédicas y publicaciones" showDirectAccess />
    </main>
  );
}
