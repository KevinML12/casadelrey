import PhotoImage from './PhotoImage';
import CrossfadePhoto from './CrossfadePhoto';
// SectionBg — foto de fondo por sección individual.
// Cada sección de cada página puede tener su propia foto detrás del
// contenido, para que el liquid glass tenga textura real que refractar.
// Uso: envolver la <section> con position relative y meter <SectionBg />
// como primer hijo.
//
// <section className="relative overflow-hidden ...">
//   <SectionBg src="/images/components/mi-foto.jpg" />
//   <div className="relative z-10">...contenido...</div>
// </section>

export default function SectionBg({ src, opacity = 'opacity-25', position = 'center', viewport = false, animate = false, fallbackSrc, onReady, sceneKey }) {
  if (!src) return null;
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div className={viewport ? 'sticky top-0 h-[100svh] overflow-hidden' : 'absolute inset-0'}>
        {animate ? <CrossfadePhoto src={src} fallbackSrc={fallbackSrc} className={opacity} onReady={onReady} sceneKey={sceneKey} /> : <PhotoImage
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          sizes="100vw"
          className={`absolute inset-0 w-full h-full object-cover ${opacity} pointer-events-none`}
          style={{ objectPosition: position }}
        />}
        <div className="absolute inset-0 bg-bg/60 pointer-events-none" />
      </div>
    </div>
  );
}
