// ============================================================
//  PhotoBentoTile — tile reusable para bentos de fotos (Voluntariado y
//  Células en Nosotros, mismo tratamiento que /volunteering). Antes esta
//  misma estructura vivía duplicada en AboutPage.jsx (una copia para
//  departamentos, otra idéntica para células).
//
//  .liquid-glass da el bisel/borde real -- sin él, el brillo de
//  Tilt(glass) apenas se nota sobre una foto (se ve claro sobre una
//  superficie lisa clara como .glass-light, pero se lava contra una
//  imagen). Con .liquid-glass + .liquid-shine juntos, la tarjeta se lee
//  como vidrio real incluso con una foto de fondo.
// ============================================================
import Tilt from './Tilt';

export default function PhotoBentoTile({ photo, title, desc, big, onClick, as = 'button', href, ...rest }) {
  return (
    <Tilt
      as={as}
      type={as === 'button' ? 'button' : undefined}
      href={href}
      onClick={onClick}
      max={5}
      glass
      whileHover={{ scale: 1.03, y: -4 }}
      className="liquid-glass group relative block w-full h-full text-left focus-ring rounded-[18px] overflow-hidden"
      {...rest}
    >
      <img
        src={photo}
        alt=""
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-x-3 bottom-3 glass-light rounded-[12px] px-3 py-2.5">
        <p className={`font-bold text-bg leading-tight line-clamp-2 ${big ? 'text-18' : 'text-13'}`}>{title}</p>
        {big && desc && <p className="text-12 text-bg/60 mt-1 leading-snug line-clamp-2">{desc}</p>}
      </div>
    </Tilt>
  );
}
