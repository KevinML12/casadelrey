import PageHero from '../../components/layout/PageHero';
import SocialSection from '../../components/sections/SocialSection';
import { Icon, Halos } from '../../components/ui/Glass';

const INFO_ITEMS = [
  { icon: 'clock', text: 'Domingos 10:00 AM' },
  { icon: 'clock', text: 'MiÃ©rcoles 7:00 PM' },
  { icon: 'pin',   text: '7a. Calle 12-66 zona 4, Huehuetenango' },
  { icon: 'phone', text: '+502 4760 0636',          href: 'tel:+50247600636' },
  { icon: 'mail',  text: 'casadelreyhuehue@gmail.com', href: 'mailto:casadelreyhuehue@gmail.com' },
  { icon: 'chat',  text: 'WhatsApp Â· +502 4760 0636', href: 'https://wa.me/50247600636', external: true },
];

const PILLARS = [
  { label: 'MisiÃ³n',  icon: 'spark', body: 'PrÃ³ximamente.' },
  { label: 'VisiÃ³n',  icon: 'crown', body: 'PrÃ³ximamente.' },
  { label: 'Valores', icon: 'heart', body: 'PrÃ³ximamente.' },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-bg text-ink">
      <PageHero
        eyebrow="ConÃ³cenos"
        title="Somos una familia."
        subtitle="Apasionada por Dios, por su Casa y por su gente."
      />

      <section className="relative py-20 md:py-28 overflow-hidden">
        <Halos variant="soft" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 space-y-20">
          {/* Historia */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-10 bg-gradient-to-r from-electric to-transparent" />
              <span className="text-celeste text-[11px] font-extrabold uppercase tracking-widest">Nuestra historia</span>
            </div>
            <h2 className="display-mega text-ink" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)' }}>
              Una casa con luces<br />encendidas desde 2016.
            </h2>
            <div className="mt-7 bg-bg border border-ink-soft shadow-card rounded-card p-7 md:p-9">
              <p className="text-[16.5px] text-ink-2 leading-relaxed">PrÃ³ximamente.</p>
            </div>
          </div>

          {/* MisiÃ³n, VisiÃ³n, Valores */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-10 bg-gradient-to-r from-electric to-transparent" />
              <span className="text-celeste text-[11px] font-extrabold uppercase tracking-widest">Pilares</span>
            </div>
            <h2 className="display-mega text-ink" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)' }}>
              MisiÃ³n, visiÃ³n y valores.
            </h2>

            <div className="mt-8 grid md:grid-cols-3 gap-4">
              {PILLARS.map(({ label, icon, body }) => (
                <div key={label} className="bg-bg border border-ink-soft shadow-card rounded-card p-6">
                  <span className="grid place-items-center w-12 h-12 rounded-sm bg-bg-soft text-celeste mb-5">
                    <Icon name={icon} className="w-6 h-6" />
                  </span>
                  <h3 className="text-[20px] font-extrabold tracking-tightish text-ink">{label}</h3>
                  <p className="mt-2 text-[14.5px] text-ink-2 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* DeclaraciÃ³n de Fe */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-10 bg-gradient-to-r from-electric to-transparent" />
              <span className="text-celeste text-[11px] font-extrabold uppercase tracking-widest">Lo que creemos</span>
            </div>
            <h2 className="display-mega text-ink" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)' }}>
              DeclaraciÃ³n de fe.
            </h2>
            <div className="mt-7 bg-bg border border-ink-soft shadow-card rounded-card p-7 md:p-9">
              <p className="text-[16.5px] text-ink-2 leading-relaxed">PrÃ³ximamente.</p>
            </div>
          </div>

          {/* Horario + ubicaciÃ³n â€” glass-strong sobre halos */}
          <div className="relative rounded-card overflow-hidden bg-bg border border-ink-soft shadow-card-lg p-7 md:p-10">
            <div className="absolute inset-0 -z-10 pointer-events-none">
              <div className="halo" style={{ width: 420, height: 420, top: -120, right: -80, background: 'rgba(63,169,255,0.20)' }} />
            </div>
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-10 bg-gradient-to-r from-electric to-transparent" />
              <span className="text-celeste text-[11px] font-extrabold uppercase tracking-widest">VisÃ­tanos</span>
            </div>
            <h2 className="display-mega text-ink" style={{ fontSize: 'clamp(1.9rem, 4.5vw, 2.6rem)' }}>
              Horario y ubicaciÃ³n.
            </h2>

            <div className="mt-7 grid sm:grid-cols-2 gap-3">
              {INFO_ITEMS.map(({ icon, text, href, external }) => {
                const body = (
                  <div className="flex items-start gap-3 rounded-md bg-bg-soft border border-ink-soft p-4 hover:bg-bg-soft transition-colors">
                    <span className="grid place-items-center w-10 h-10 rounded-sm bg-bg-soft text-celeste shrink-0">
                      <Icon name={icon} className="w-5 h-5" />
                    </span>
                    <span className="text-[14.5px] text-ink leading-snug">{text}</span>
                  </div>
                );
                return href
                  ? <a key={text} href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} className="block focus-ring rounded-md">{body}</a>
                  : <div key={text}>{body}</div>;
              })}
            </div>
          </div>
        </div>
      </section>

      <SocialSection title="PrÃ©dicas y publicaciones" showDirectAccess />
    </main>
  );
}
