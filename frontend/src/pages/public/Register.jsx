// ============================================================
//  Register — no hay auto-registro (las cuentas las crea un líder o
//  admin), así que esta página EXPLICA el camino como 3 pasos de una
//  operación (submódulos de cristal), no como un párrafo de texto.
//  Foto real de fondo (grupo de jóvenes de SABADOS — "únete a la
//  familia" literal), administrable vía slot hero_registro.
// ============================================================
import { Link } from 'react-router-dom';
import { GlassButton } from '../../components/ui/Glass';
import Reveal, { RevealList, RevealItem } from '../../components/ui/Reveal';
import ParallaxImg from '../../components/ui/ParallaxImg';
import { useSitePhoto } from '../../lib/feed';

const PASOS = [
  {
    title: 'Habla con tu líder',
    desc: 'Tu líder de célula o el equipo de la iglesia piden tu acceso.',
    // El directorio de líderes vive en Células: foto + WhatsApp directo
    cta: { label: 'Comunícate', to: '/celulas' },
  },
  {
    title: 'Te crean la cuenta',
    desc: 'Un líder o administrador la crea con tu correo.',
  },
  {
    title: 'Ingresa y listo',
    desc: 'Entras con tu correo y encuentras tu espacio.',
  },
];

export default function Register() {
  const bg = useSitePhoto('hero_registro', '/images/bg-registro.jpg');

  return (
    <section className="relative min-h-screen pt-32 pb-20 overflow-hidden bg-bg flex items-center">
      {/* Foto a color pleno + .scrim-hero: la composición es centrada, así
          que el óvalo oscuro cae justo donde vive el bloque de texto. Antes
          la foto iba al 40% bajo otro degradado encima. */}
      <ParallaxImg src={bg} alt="" />
      <div className="scrim-hero" />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-6 text-center">
        {/* Sin Reveal: es el titular de la pantalla, el punto fijo contra el
            que aterrizan los 3 pasos de abajo. */}
        <h1 className="text-d2 text-white">
          Obtener una cuenta.
        </h1>
        <p className="mt-5 text-16 text-white/70">
          Son tres pasos — y el primero no es un formulario.
        </p>

        {/* Los 3 pasos como submódulos de cristal */}
        <RevealList className="mt-10 grid gap-3 sm:grid-cols-3 text-left">
          {PASOS.map((p, i) => (
            <RevealItem key={p.title} depth>
              {/* Sin Tilt: la tarjeta no navega. Ninguno de los 3 pasos es
                  clickeable -- el único enlace es el "Comunícate" del paso 1,
                  que vive DENTRO. Un bloque que se inclina siguiendo al
                  cursor y después no hace nada promete interacción y no la
                  cumple. El bisel se conserva: .liquid-glass + .liquid-shine
                  (mismo criterio que PhotoHeaderCard). */}
              <div className="liquid-glass liquid-shine rounded-[22px] p-5 h-full">
                <div className="flex items-center gap-2.5 mb-3">
                  {/* font-bold, no extrabold: Arimo topa en 700 y el 800
                      pintaba el mismo trazo. Radio 22, el de toda card. */}
                  <span className="grid place-items-center w-8 h-8 rounded-full bg-white text-bg text-13 font-bold shrink-0">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-16 font-bold text-white leading-tight">{p.title}</h3>
                <p className="mt-1.5 text-13 text-white/60 leading-relaxed">{p.desc}</p>
                {p.cta && (
                  <Link
                    to={p.cta.to}
                    className="mt-3 inline-flex items-center text-13 font-bold text-white hover:text-white/70 transition-colors"
                  >
                    {p.cta.label}
                  </Link>
                )}
              </div>
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
