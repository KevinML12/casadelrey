// ============================================================
//  PhotoHeaderCard — foto real a todo lo ancho arriba (blanco y negro,
//  a tono con el resto de Nosotros) que se desvanece hacia el vidrio
//  claro de abajo en vez de cortar en seco -- mezcla de tres ideas que
//  el usuario pidió combinar: foto grande (no un círculo chico), la
//  textura ambiental de un degradado en vez de un borde duro, y la
//  composición "ficha" foto-arriba/texto-abajo. Reemplaza PhotoBadge
//  (círculo de 56px con la misma foto) en las cards Fundadores/Pastores/
//  Visítanos/Podcast -- se sintió "chafa" para tan poco esfuerzo visual.
// ============================================================
import Tilt from './Tilt';

export default function PhotoHeaderCard({ photo, glass = 'standard', contentClassName = '', className = '', objectPosition = 'center', children }) {
  return (
    <Tilt max={4} glass={glass} className={`group glass-light rounded-[24px] overflow-hidden h-full flex flex-col ${className}`}>
      <div className="relative h-40 md:h-44 shrink-0 overflow-hidden">
        {photo && (
          <img
            src={photo}
            alt=""
            style={{ objectPosition }}
            className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
          />
        )}
        {/* La foto se funde en el vidrio claro de abajo -- degradado a
            blanco, no un corte duro entre foto y contenido. */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
      </div>
      <div className={`p-8 md:p-10 flex-1 flex flex-col ${contentClassName}`}>
        {children}
      </div>
    </Tilt>
  );
}
