// ============================================================
//  PhotoHeaderCard — foto real a color a sangre completa, con el
//  texto superpuesto vía degradado -- misma gramática que las cards
//  de foto de Home.jsx (MensajesCarousel, CelulasSection, el
//  destacado de Agenda): liquid-glass + Tilt + la foto ES la tarjeta,
//  nunca una franja separada de un panel de texto. Antes era una
//  franja de 160px en blanco y negro que se desvanecía a un panel
//  claro abajo -- una tercera gramática que no existía en ningún otro
//  lado del sitio (ago-2026, "sigue la misma línea de diseño del
//  módulo home").
// ============================================================
import Tilt from './Tilt';

export default function PhotoHeaderCard({ photo, glass = 'standard', contentClassName = '', className = '', objectPosition = 'center', children }) {
  return (
    <Tilt max={4} glass={glass} className={`group liquid-glass relative rounded-[24px] overflow-hidden h-full min-h-[280px] flex flex-col justify-end ${className}`}>
      {photo && (
        <img
          src={photo}
          alt=""
          style={{ objectPosition }}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      )}
      {/* Degradado oscuro de abajo hacia arriba -- el texto siempre cae
          sobre la zona más opaca, sin importar cuánto texto traiga cada
          card (mismo tratamiento que el destacado de Agenda en Home). */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/75 to-bg/10" />
      <div className={`relative z-10 p-8 md:p-10 ${contentClassName}`}>
        {children}
      </div>
    </Tilt>
  );
}
