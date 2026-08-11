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
// `align` (ago-2026): este hero se repite en 9 pantallas y hasta ahora TODAS
// abrían con el mismo bloque centrado sobre la misma foto difuminada. Un
// visitante que recorre el sitio llega nueve veces a la misma apertura y el
// sitio deja de tener páginas: tiene una plantilla con el título cambiado.
// Con `align="left"` (el default, para páginas narrativas: Nosotros, Blog,
// Células) el titular se ancla al borde izquierdo y la foto respira entera a
// la derecha; `align="center"` se reserva para las pantallas que son un
// anuncio corto (Donar, Recibo, Oración), donde el centrado vuelve a
// significar algo porque ya no es lo único que hay.
export default function PageHero({ title, subtitle, children, photoSlot, photoFallback, align = 'left' }) {
  const photo = useSitePhoto(photoSlot || '', photoFallback || '');
  const hasPhoto = Boolean(photoSlot && photo);
  const centered = align === 'center';

  return (
    <section className="relative pt-40 pb-20 md:pt-48 md:pb-28 overflow-hidden bg-bg">
      {hasPhoto ? (
        <>
          {/* Foto a color pleno: el contraste lo pone el scrim, que oscurece
              solo donde cae el texto. Cuál de los tres lo decide la
              composición real -- .scrim-band cuando el titular vive a la
              izquierda (deja la foto entera visible del otro lado),
              .scrim-hero cuando el bloque va centrado y necesita el óvalo
              oscuro justo en el medio. */}
          <ParallaxImg src={photo} alt="" />
          <div className={centered ? 'scrim-hero' : 'scrim-band'} />
        </>
      ) : (
        <>
          <Halos variant="hero" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg" />
        </>
      )}
      {/* Sin animación de entrada: es lo primero que ve el visitante al
          cargar, y un titular que todavía se está deslizando cuando llegás
          no es el ancla de la pantalla, es algo acomodándose. El contenido
          de más abajo sigue entrando con Reveal -- ahí el movimiento sí
          tiene contra qué leerse. */}
      <div className={`relative z-10 max-w-5xl mx-auto px-6 ${centered ? 'text-center' : ''}`}>
        <h1 className="text-d1 text-white">
          {title}
        </h1>
        {/* Blanco pleno, no white/70: al subir las fotos a color entero
            (antes iban al 40-45% de opacidad) la bajada quedó midiendo
            entre 3.5:1 y 4.0:1 sobre las zonas claras de la foto, bajo el
            4.5:1 que pide AA para texto de cuerpo. La salida NO es más
            scrim -- eso apagaría justo la fotografía que este refactor
            vino a recuperar -- sino quitarle el velo al texto: en blanco
            pleno sube a ~4.8:1 sin tocar la imagen. La jerarquía contra el
            titular la siguen dando el tamaño y el peso, que es de donde
            debería venir. */}
        {subtitle && (
          <p className={`mt-6 text-17 md:text-19 leading-relaxed text-white max-w-2xl ${centered ? 'mx-auto' : ''}`}>
            {subtitle}
          </p>
        )}
        {children && (
          <div className={`mt-9 flex flex-wrap gap-3 ${centered ? 'justify-center' : ''}`}>{children}</div>
        )}
      </div>
    </section>
  );
}
