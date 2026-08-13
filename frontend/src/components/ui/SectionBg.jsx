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

export default function SectionBg({ src, opacity = 'opacity-35', position = 'center' }) {
  if (!src) return null;
  return (
    <>
      <img
        src={src}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover ${opacity} pointer-events-none`}
        style={{ objectPosition: position }}
      />
      <div className="absolute inset-0 bg-bg/50 pointer-events-none" />
    </>
  );
}
