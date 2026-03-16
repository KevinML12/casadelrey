import { PlayCircle, Youtube, Facebook, Mic } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHero from '../../components/layout/PageHero';

const PILLARS = [
  { label: 'Misión',  desc: 'Exaltar a Cristo, equipar a la iglesia y extender el Reino en cada esfera de la sociedad.' },
  { label: 'Visión',  desc: 'Ser una comunidad influyente, reconocida por amor genuino y transformación de vidas.' },
  { label: 'Valores', desc: 'Fe, comunidad, servicio, excelencia y amor incondicional como pilares de todo lo que hacemos.' },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-bg">
      <PageHero title="Conócenos" subtitle="Somos una familia apasionada por Dios, por su casa y por su gente." />

      {/* Historia */}
      <section className="py-20 bg-bg">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-blue font-semibold text-sm uppercase tracking-widest mb-3">Nuestra Historia</p>
            <h2 className="text-4xl font-black text-ink mb-6 leading-tight">De una sala a miles de vidas</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="p-6 rounded-xl bg-card border border-line">
                <h3 className="font-bold text-blue mb-3">Historia</h3>
                <p className="text-ink-2 text-sm leading-relaxed">
                  Casa del Rey nació en Huehuetenango, Guatemala, de la mano de los Pastores Leonel e Ismeina de León. Lo que comenzó en una sala de estar, floreció por la gracia de Dios en una comunidad vibrante que hoy impacta a miles de vidas en la región y más allá.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-card border border-line">
                <h3 className="font-bold text-blue mb-3">Declaración de Fe</h3>
                <p className="text-ink-2 text-sm leading-relaxed">
                  Creemos en la Biblia como la Palabra de Dios. Creemos en el poder transformador del Evangelio de Jesucristo. Creemos en el Espíritu Santo obrando hoy en cada vida que se rinde a Dios.
                </p>
              </div>
            </div>

            {/* Pilares */}
            <div className="divide-y divide-line border border-line rounded-xl overflow-hidden">
              {PILLARS.map(({ label, desc }) => (
                <div key={label} className="flex items-start gap-5 p-5 bg-card hover:bg-card-2 transition-colors">
                  <div className="w-20 shrink-0">
                    <span className="font-black text-ink text-sm">{label}</span>
                  </div>
                  <p className="text-ink-2 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Multimedia */}
      <section className="py-20 bg-bg-2">
        <div className="container mx-auto px-6">
          <p className="text-blue font-semibold text-sm uppercase tracking-widest mb-3">Contenido</p>
          <h2 className="text-3xl font-black text-ink mb-10">Prédicas y Multimedia</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Video principal */}
            <div className="lg:col-span-2">
              <Card className="p-0 overflow-hidden">
                <div className="relative aspect-video bg-navy-d flex items-center justify-center cursor-pointer group">
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-d/70 to-transparent" />
                  <PlayCircle size={64} className="text-white/70 group-hover:text-white group-hover:scale-105 transition-all duration-200 relative z-10" />
                  <div className="absolute bottom-0 left-0 p-5 text-white z-10">
                    <p className="text-xs font-bold text-gold uppercase tracking-widest mb-1">Última Prédica</p>
                    <h3 className="text-xl font-black">El Poder de la Esperanza</h3>
                  </div>
                  <div className="absolute top-3 right-3 bg-red-600 text-white px-2.5 py-1 rounded flex items-center gap-1 text-xs font-bold z-10">
                    <Youtube size={12} /> YouTube
                  </div>
                </div>
              </Card>
            </div>

            {/* Más contenido */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-ink pb-2 border-b border-line">Más Contenido</h3>
              {[
                { icon: Facebook, label: 'Testimonios en Facebook', sub: 'Momentos de fe', color: 'text-blue-500' },
                { icon: Youtube,  label: 'Conferencia Juvenil',     sub: 'Resumen en YouTube', color: 'text-red-500' },
              ].map(({ icon: Icon, label, sub, color }) => (
                <div key={label} className="flex items-center gap-3 p-3.5 rounded-lg bg-card border border-line hover:border-blue/20 cursor-pointer transition-colors group">
                  <div className="w-14 h-10 bg-bg-2 rounded flex items-center justify-center shrink-0">
                    <Icon size={20} className={color} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-ink text-sm">{label}</h4>
                    <p className="text-xs text-ink-3">{sub}</p>
                  </div>
                </div>
              ))}
              <Button variant="primary" className="w-full mt-2">
                <Youtube size={15} /> Canal de YouTube
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Podcast */}
      <section className="py-20 bg-navy">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-8">
            <Mic size={56} className="text-gold shrink-0" />
            <div>
              <h2 className="text-3xl font-black text-white mb-2">Blog en Audio</h2>
              <p className="text-white/50 text-sm leading-relaxed mb-5">
                ¿Prefieres escuchar? Lleva nuestras enseñanzas contigo a donde vayas. Ideal para el devocional o el gimnasio.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Acceder al Podcast
                </Button>
                <Button variant="ghost" className="text-white/60 hover:bg-white/5 hover:text-white">
                  Último episodio
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
