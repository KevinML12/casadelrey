import DonationCard from '../../components/sections/DonationCard';
import PageHero from '../../components/layout/PageHero';
import { Heart, Shield, Globe, BookOpen } from 'lucide-react';

const IMPACT = [
  { icon: Heart,    title: 'Células',   desc: 'Equipando líderes de casa en cada barrio' },
  { icon: Globe,    title: 'Misiones',  desc: 'Llevando el evangelio a otras regiones' },
  { icon: BookOpen, title: 'Educación', desc: 'Materiales y estudios bíblicos gratuitos' },
  { icon: Shield,   title: 'Familias',  desc: 'Apoyo integral a familias en necesidad' },
];

export default function DonatePage() {
  return (
    <main className="min-h-screen bg-bg">
      <PageHero icon={Heart} title="Tu Generosidad Transforma" subtitle="Cada quetzal sembrado con fe produce fruto eterno." />

      <div className="container mx-auto px-6 py-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Destinos */}
          <div>
            <h2 className="text-2xl font-black text-ink mb-6">¿A dónde va tu donación?</h2>
            <div className="space-y-3 mb-8">
              {IMPACT.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4 p-4 rounded-lg bg-card border border-line dark:border-transparent hover:border-blue/20 dark:hover:bg-card-2 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-blue/5 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink text-sm">{title}</h3>
                    <p className="text-xs text-ink-3 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <blockquote className="p-5 rounded-xl bg-navy border border-white/10">
              <p className="text-white/70 text-sm italic leading-relaxed mb-2">
                "El que siembra escasamente, también segará escasamente; y el que siembra generosamente, generosamente también segará."
              </p>
              <cite className="text-gold text-xs font-semibold not-italic">— 2 Corintios 9:6</cite>
            </blockquote>
          </div>

          {/* Formulario */}
          <div className="bg-card border border-line dark:border-transparent rounded-2xl shadow-card p-7">
            <h2 className="text-xl font-black text-ink mb-5">Haz tu donación</h2>
            <DonationCard />
          </div>
        </div>
      </div>
    </main>
  );
}
