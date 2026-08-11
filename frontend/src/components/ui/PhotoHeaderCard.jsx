// ============================================================
//  PhotoHeaderCard — foto real a color a sangre completa, con el
//  texto superpuesto vía degradado -- misma gramática que las cards
//  de foto de Home.jsx (MensajesCarousel, CelulasSection, el
//  destacado de Agenda): liquid-glass + la foto ES la tarjeta, nunca
//  una franja separada de un panel de texto. Antes era una franja de
//  160px en blanco y negro que se desvanecía a un panel claro abajo --
//  una tercera gramática que no existía en ningún otro lado del sitio
//  (ago-2026, "sigue la misma línea de diseño del módulo home").
//
//  Sin Tilt (ago-2026): esta card NO es navegable -- no lleva href, ni
//  onClick, ni foco. Un bloque que se inclina siguiendo el cursor y
//  después no hace nada al clickearlo promete interacción y no la
//  cumple; el tilt queda reservado para lo que de verdad lleva a algún
//  lado. El bisel de vidrio no se pierde: vive en .liquid-glass, y el
//  reflejo que antes agregaba la prop `glass` de Tilt ahora se agrega
//  a mano como .liquid-shine.
// ============================================================

export default function PhotoHeaderCard({ photo, glass = 'standard', contentClassName = '', className = '', objectPosition = 'center', children }) {
  return (
    <div className={`group liquid-glass ${glass ? 'liquid-shine' : ''} relative rounded-[22px] overflow-hidden h-full min-h-[280px] flex flex-col justify-end ${className}`}>
      {photo && (
        <img
          src={photo}
          alt=""
          style={{ objectPosition }}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      )}
      {/* .scrim-card: el texto siempre cae sobre la zona más opaca, sin
          importar cuánto traiga cada card (mismo tratamiento que el
          destacado de Agenda en Home). El valor es exactamente el que
          esta card ya usaba inline -- el token de index.css nació de
          aquí; ahora las otras 24 fotos del sitio lo comparten en vez
          de que cada sección invente su propio degradado. */}
      <div className="scrim-card" />
      <div className={`relative z-10 p-8 md:p-10 ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
}
