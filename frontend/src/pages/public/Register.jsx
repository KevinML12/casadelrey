// ============================================================
//  Register — no hay auto-registro (las cuentas las crea un líder o
//  admin), así que esta página EXPLICA el camino como 3 pasos de una
//  operación (submódulos de cristal), no como un párrafo de texto.
//  Foto real de fondo (grupo de jóvenes de SABADOS — "únete a la
//  familia" literal), administrable vía slot hero_registro.
// ============================================================
import { Link } from 'react-router-dom';
import { Icon, Eyebrow, GlassButton } from '../../components/ui/Glass';
import Reveal, { RevealList, RevealItem } from '../../components/ui/Reveal';
import Tilt from '../../components/ui/Tilt';
import ParallaxImg from '../../components/ui/ParallaxImg';
import { useSitePhoto } from '../../lib/feed';

const PASOS = [
  {
    icon: 'users',
    title: 'Habla con tu líder',
    desc: 'Tu líder de célula o el equipo de la iglesia piden tu acceso.',
    // El directorio de líderes vive en Células: foto + WhatsApp directo
    cta: { label: 'Comunícate', to: '/celulas' },
  },
  {
    icon: 'spark',
    title: 'Te crean la cuenta',
    desc: 'Un líder o administrador la crea con tu correo.',
  },
  {
    icon: 'user',
    title: 'Ingresa y listo',
    desc: 'Entras con tu correo y encuentras tu espacio.',
  },
];

export default function Register() {
  const bg = useSitePhoto('hero_registro', '/images/bg-registro.jpg');

  return (
    <section className="relative min-h-screen pt-32 pb-20 overflow-hidden bg-bg flex items-center">
      <ParallaxImg src={bg} alt="" className="opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-bg/75 via-bg/50 to-bg pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-6 text-center">
        <Reveal>
          <Eyebrow>Únete a la familia</Eyebrow>
          <h1 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(2.4rem, 6vw, 4.2rem)' }}>
            Obtener una cuenta.
          </h1>
          <p className="mt-5 text-16 text-white/70">
            Son tres pasos — y el primero no es un formulario.
          </p>
        </Reveal>

        {/* Los 3 pasos como submódulos de cristal */}
        <RevealList className="mt-10 grid gap-3 sm:grid-cols-3 text-left">
          {PASOS.map((p, i) => (
            <RevealItem key={p.title} depth>
              <Tilt max={4} glass className="liquid-glass rounded-[20px] p-5 h-full">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="grid place-items-center w-8 h-8 rounded-full bg-white text-bg text-13 font-extrabold shrink-0">
                    {i + 1}
                  </span>
                  <Icon name={p.icon} className="w-4 h-4 text-white/60" />
                </div>
                <h3 className="text-16 font-bold text-white leading-tight">{p.title}</h3>
                <p className="mt-1.5 text-13 text-white/60 leading-relaxed">{p.desc}</p>
                {p.cta && (
                  <Link
                    to={p.cta.to}
                    className="mt-3 inline-flex items-center gap-1.5 text-13 font-bold text-white hover:text-white/70 transition-colors"
                  >
                    {p.cta.label}
                    <Icon name="arrow" className="w-3.5 h-3.5" stroke={2.2} />
                  </Link>
                )}
              </Tilt>
            </RevealItem>
          ))}
        </RevealList>

        <Reveal delay={0.15}>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <GlassButton as={Link} to="/login" variant="primary" icon="arrow">
              Ya tengo cuenta · Ingresar
            </GlassButton>
            <GlassButton as={Link} to="/volunteering" variant="glass">
              Quiero servir como voluntario
            </GlassButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
