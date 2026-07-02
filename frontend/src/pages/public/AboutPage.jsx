import PageHero from '../../components/layout/PageHero';
import SocialSection from '../../components/sections/SocialSection';
import { Icon } from '../../components/ui/Glass';

const INFO_ITEMS = [
  { icon: 'clock', text: 'Domingos 10:00 AM' },
  { icon: 'pin',   text: '7a. Calle 12-66 zona 4, Huehuetenango' },
  { icon: 'phone', text: '+502 4760 0636', href: 'tel:+50247600636' },
  { icon: 'music', text: 'Radio CDR Inusual (92.9FM) · Vie 15:00' },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-bg text-white relative overflow-hidden">
      
      {/* Background & Blobs */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-celeste/20 rounded-full mix-blend-screen filter blur-[150px] opacity-40 animate-blob" />
      <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-emerald/20 rounded-full mix-blend-screen filter blur-[150px] opacity-30 animate-blob" style={{ animationDelay: '3s' }} />

      <PageHero
        eyebrow="Ministerios e Identidad"
        title="Nuestra Casa."
        subtitle="Apasionados por Dios, por su Casa y por su gente."
      />

      <section className="relative py-20 md:py-28 overflow-hidden z-10">
        <div className="relative z-10 max-w-5xl mx-auto px-6 space-y-24">
          
          {/* Liderazgo */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-10 bg-gradient-to-r from-celeste to-transparent" />
              <span className="text-celeste text-[11px] font-extrabold uppercase tracking-widest">Liderazgo</span>
            </div>
            <h2 className="display-mega text-white" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)' }}>
              Pastores.
            </h2>
            
            <div className="mt-10 grid md:grid-cols-2 gap-6">
              {/* Fundadores */}
              <div className="liquid-glass rounded-[32px] p-8 card-spring hover:bg-white/5 transition-colors border-white/10">
                <span className="grid place-items-center w-14 h-14 rounded-full bg-white/10 text-celeste mb-6">
                  <span className="material-symbols-rounded">workspace_premium</span>
                </span>
                <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Pastores Fundadores</div>
                <h3 className="text-[24px] font-bold text-white tracking-tight">José De León (+) <br/> y Desideria López</h3>
                <p className="mt-4 text-[14px] text-white/60 leading-relaxed">
                  Quienes sembraron la visión original y levantaron los cimientos de fe sobre los cuales Casa del Rey sigue edificando hoy.
                </p>
              </div>

              {/* Actuales */}
              <div className="liquid-glass rounded-[32px] p-8 card-spring hover:bg-white/5 transition-colors border-white/10">
                <span className="grid place-items-center w-14 h-14 rounded-full bg-white/10 text-celeste mb-6">
                  <span className="material-symbols-rounded">group</span>
                </span>
                <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Pastores Generales</div>
                <h3 className="text-[24px] font-bold text-white tracking-tight">Leonel e Ismeina <br/> De León</h3>
                <p className="mt-4 text-[14px] text-white/60 leading-relaxed">
                  Liderando a la iglesia con pasión y propósito, llevando el mensaje de restauración familiar a cada rincón de Huehuetenango.
                </p>
              </div>
            </div>
          </div>

          {/* Misión y Visión */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-10 bg-gradient-to-r from-celeste to-transparent" />
              <span className="text-celeste text-[11px] font-extrabold uppercase tracking-widest">Identidad</span>
            </div>
            <h2 className="display-mega text-white" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)' }}>
              Propósito.
            </h2>

            <div className="mt-10 space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-[24px] p-8 md:p-12 card-spring">
                <h3 className="text-[28px] font-bold tracking-tight text-white mb-4">Nuestra Misión</h3>
                <p className="text-[18px] md:text-[22px] text-white/70 leading-relaxed font-serif">
                  "Somos una Iglesia Cristiana familiar, enfocada a cumplir la gran comisión de Jesucristo de id y haced discípulos a las naciones, haciendo de cada miembro un líder capacitado para reproducir la obra de Dios."
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-[24px] p-8 md:p-12 card-spring">
                <h3 className="text-[28px] font-bold tracking-tight text-white mb-4">Nuestra Visión</h3>
                <p className="text-[18px] md:text-[22px] text-white/70 leading-relaxed font-serif">
                  "Ser una Iglesia Cristiana de restauración familiar, punta de lanza, que proclame la verdad de la Palabra de Dios, bajo el poder del Espíritu Santo."
                </p>
              </div>
            </div>
          </div>

          {/* Horario + ubicación */}
          <div className="relative rounded-[32px] overflow-hidden bg-[#0A1526] border border-white/10 p-7 md:p-12 shadow-card-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-celeste/10 to-transparent pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <span className="h-px w-10 bg-gradient-to-r from-celeste to-transparent" />
                <span className="text-celeste text-[11px] font-extrabold uppercase tracking-widest">Contacto</span>
              </div>
              <h2 className="display-mega text-white" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.4rem)' }}>
                Ubicación.
              </h2>

              <div className="mt-10 grid sm:grid-cols-2 gap-4">
                {INFO_ITEMS.map(({ icon, text, href, external }) => {
                  const body = (
                    <div className="flex items-center gap-4 rounded-[16px] bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition-colors">
                      <span className="grid place-items-center w-12 h-12 rounded-full bg-white/5 text-celeste shrink-0">
                        <Icon name={icon} className="w-5 h-5" />
                      </span>
                      <span className="text-[15px] font-bold text-white/90 leading-snug">{text}</span>
                    </div>
                  );
                  return href
                    ? <a key={text} href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} className="block focus-ring rounded-md">{body}</a>
                    : <div key={text}>{body}</div>;
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SocialSection title="Prédicas y publicaciones" showDirectAccess />
    </main>
  );
}
