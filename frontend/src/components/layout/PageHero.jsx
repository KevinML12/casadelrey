import { Halos } from '../ui/Glass';
import ParallaxImg from '../ui/ParallaxImg';
import { useSitePhoto } from '../../lib/feed';

// Shared page hero — Liquid Glass Dark Mode.
//
// Con `photoSlot` (+ `photoFallback` local) el fondo es una FOTO REAL de la
// iglesia administrable desde /admin/site-photos, como pide la guía ("hero
// de fondo siempre"). Los Halos quedan solo como luz ambiental estática
// detrás de la foto. Sin `photoSlot` se comporta como antes (solo halos) —
// backward-compatible con cualquier caller que no haya migrado.
//
export default function PageHero({ eyebrow, title, subtitle, children, photoSlot, photoFallback }) {
  const photo = useSitePhoto(photoSlot || '', photoFallback || '');
  const hasPhoto = Boolean(photoSlot && photo);

  return (
    <section className="relative pt-40 pb-20 md:pt-48 md:pb-28 overflow-hidden bg-bg">
      {hasPhoto ? (
        <>
          <ParallaxImg src={photo} alt="" className="opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-b from-bg/75 via-bg/55 to-bg pointer-events-none" />
        </>
      ) : (
        <>
          <Halos variant="hero" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg" />
        </>
      )}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center animate-rise">
        {eyebrow && (
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 liquid-glass border border-white/20 mb-6">
            <span className="text-white/80 text-[11px] font-bold uppercase tracking-widest">{eyebrow}</span>
          </div>
        )}
        <h1
          className="display-mega text-white"
          style={{ fontSize: 'clamp(2.6rem, 7vw, 5rem)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-6 text-[17px] md:text-[19px] leading-relaxed text-white/70 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
        {children && <div className="mt-9 flex flex-wrap justify-center gap-3">{children}</div>}
      </div>
    </section>
  );
}
