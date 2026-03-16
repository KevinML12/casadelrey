import { Clock, MapPin, Phone, Mail } from 'lucide-react';
import PageHero from '../../components/layout/PageHero';
import SocialSection from '../../components/sections/SocialSection';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-bg">
      <PageHero title="Conócenos" subtitle="Somos una familia apasionada por Dios, por su casa y por su gente." />

      <section className="py-20 bg-bg">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto space-y-12">
            {/* Historia — se completará con la info de la iglesia */}
            <div>
              <h2 className="text-2xl font-black text-ink mb-4">Nuestra Historia</h2>
              <div className="p-6 rounded-xl bg-card border border-line">
                <p className="text-ink-2 text-sm leading-relaxed">
                  Próximamente.
                </p>
              </div>
            </div>

            {/* Misión, Visión, Valores */}
            <div>
              <h2 className="text-2xl font-black text-ink mb-4">Misión, Visión y Valores</h2>
              <div className="space-y-4">
                {['Misión', 'Visión', 'Valores'].map(label => (
                  <div key={label} className="p-5 rounded-xl bg-card border border-line">
                    <span className="font-bold text-ink text-sm block mb-2">{label}</span>
                    <p className="text-ink-3 text-sm">Próximamente.</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Declaración de Fe */}
            <div>
              <h2 className="text-2xl font-black text-ink mb-4">Declaración de Fe</h2>
              <div className="p-6 rounded-xl bg-card border border-line">
                <p className="text-ink-2 text-sm leading-relaxed">
                  Próximamente.
                </p>
              </div>
            </div>

            {/* Horario y ubicación */}
            <div className="p-6 rounded-xl bg-navy text-white">
              <h2 className="text-xl font-black mb-4">Horario y Ubicación</h2>
              <div className="space-y-3 text-white/80 text-sm">
                <p className="flex items-center gap-2">
                  <Clock size={16} className="text-gold shrink-0" />
                  Domingos 10:00 AM
                </p>
                <p className="flex items-center gap-2">
                  <Clock size={16} className="text-gold shrink-0" />
                  Miércoles 7:00 PM
                </p>
                <p className="flex items-center gap-2">
                  <MapPin size={16} className="text-gold shrink-0" />
                  7a. calle 12-66 zona 4, Carretera a las Ruinas de Zaculeu, Huehuetenango, Guatemala
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={16} className="text-gold shrink-0" />
                  <a href="tel:+50247600636" className="hover:text-gold transition-colors">4760 0636</a>
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={16} className="text-gold shrink-0" />
                  <a href="mailto:casadelreyhuehue@gmail.com" className="hover:text-gold transition-colors">casadelreyhuehue@gmail.com</a>
                </p>
                <p className="flex items-center gap-2">
                  <a href="https://wa.me/50247600636" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-gold transition-colors">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-gold" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp: +502 4760 0636
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SocialSection title="Prédicas y publicaciones" showDirectAccess />
    </main>
  );
}
