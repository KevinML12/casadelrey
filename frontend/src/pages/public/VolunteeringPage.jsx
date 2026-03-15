import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PageHero from '../../components/layout/PageHero';

const AREAS = [
  { title: 'Equipo de Bienvenida',    desc: 'Recibe a cada persona con calidez y haz que se sienta en casa desde el primer momento.' },
  { title: 'Ministerio de Niños',     desc: 'Enseña e inspira a los más pequeños con creatividad y amor.' },
  { title: 'Equipo de Producción',    desc: 'Sonido, proyección y streaming para que el servicio llegue más lejos.' },
  { title: 'Grupos de Conexión',      desc: 'Facilita espacios donde las personas construyen comunidad y amistad real.' },
  { title: 'Equipo de Alcance',       desc: 'Lleva el amor de Dios a la comunidad a través de servicio práctico y evangelismo.' },
  { title: 'Ministerio de Oración',   desc: 'Intercede por la iglesia, los miembros y las necesidades de la ciudad.' },
];

export default function VolunteeringPage() {
  return (
    <main className="min-h-screen bg-bg">
      <PageHero title="Voluntariado" subtitle="Sirve con tus talentos y haz la diferencia en la comunidad." />

      <div className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-blue font-semibold text-sm uppercase tracking-widest mb-3">Áreas de Servicio</p>
          <h2 className="text-3xl font-black text-ink mb-10">¿Dónde quieres servir?</h2>

          <div className="divide-y divide-line border border-line rounded-xl overflow-hidden mb-12">
            {AREAS.map(({ title, desc }) => (
              <div key={title} className="flex items-start justify-between gap-4 p-5 bg-card hover:bg-card-2 transition-colors">
                <div>
                  <h3 className="font-bold text-ink mb-1 text-sm">{title}</h3>
                  <p className="text-ink-3 text-sm leading-relaxed">{desc}</p>
                </div>
                <ArrowRight size={14} className="text-ink-3 mt-0.5 shrink-0" />
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center p-8 rounded-2xl bg-bg-2 border border-line">
            <h3 className="text-2xl font-black text-ink mb-3">¿Listo para servir?</h3>
            <p className="text-ink-2 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
              Envíanos una petición de contacto y nuestro equipo se comunicará contigo para orientarte.
            </p>
            <Link to="/prayer"
              className="group inline-flex items-center gap-2 px-7 py-3 bg-navy text-white font-semibold rounded-md hover:bg-navy-d transition-colors">
              Quiero ser voluntario
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
