import { Clock, MapPin } from 'lucide-react';
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
                  7a. Calle 12-66, Huehuetenango, Guatemala
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
