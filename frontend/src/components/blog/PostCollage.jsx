// ============================================================
//  PostCollage — listado de posts en COLLAGE (tamaños/inclinaciones
//  variados, determinístico por índice), mismo lenguaje que Galería/
//  Células. Sin posts → estado vacío real (nunca contenido de mentira).
// ============================================================
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Tilt from '../ui/Tilt';

const SPANS = [
  'col-span-2 row-span-2', 'col-span-1 row-span-1', 'col-span-1 row-span-1',
  'col-span-1 row-span-2', 'col-span-2 row-span-1', 'col-span-1 row-span-1',
];
const ROT = [-2.0, 1.6, -1.2, 2.2, -1.8, 1.4];

export default function PostCollage({ posts }) {
  if (posts.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center gap-5 text-center">
        <p className="text-d3 text-white/50">
          Pronto, primeras palabras.
        </p>
        <p className="text-white/40 text-16">Estamos preparando contenido para ti.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[160px] sm:auto-rows-[175px] gap-x-5 gap-y-9 [grid-auto-flow:dense]">
      {posts.map((p, i) => {
        const isExternal = !!p.redirect_url;
        const span = SPANS[i % SPANS.length];
        const rot = ROT[i % ROT.length];
        const big = span.includes('row-span-2');
        const excerpt = p.excerpt || p.content?.replace(/<[^>]+>/g, '').substring(0, 110);

        // Regla del sitio: cristal oscuro con foto propia (evita deslavarla),
        // cristal blanco sin foto -- ver EventsPage.jsx EventCard.
        const hasPhoto = Boolean(p.cover_image);
        const ink    = hasPhoto ? 'text-white'    : 'text-bg';
        const ink70  = hasPhoto ? 'text-white/70' : 'text-bg/70';

        return (
          <motion.div
            key={p.ID}
            className={span}
            initial={{ opacity: 0, rotateX: 16, scale: 0.92 }}
            whileInView={{ opacity: 1, rotateX: 0, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ type: 'spring', stiffness: 120, damping: 16, delay: (i % 8) * 0.05 }}
            style={{ transformPerspective: 1000, transformOrigin: 'center' }}
          >
            <Tilt
              as={isExternal ? 'a' : Link}
              max={4}
              scrollMax={3}
              {...(isExternal
                ? { href: p.redirect_url, target: '_blank', rel: 'noopener noreferrer' }
                : { to: `/blog/${p.slug}` })}
              whileHover={{ rotate: 0, scale: 1.04, y: -6, zIndex: 30 }}
              glass
              className={`${hasPhoto ? 'liquid-glass' : 'glass-light'} group relative w-full h-full rounded-[22px] overflow-hidden text-left focus-ring ring-1 ${hasPhoto ? 'ring-white/10' : 'ring-bg/10'} block`}
              style={{ rotate: rot, transformOrigin: 'center' }}
            >
              <div className="absolute inset-0">
                {hasPhoto && (
                  <>
                    {/* Portada a color pleno: llegaba al 55% de su color y
                        subía a 75% en hover, así que la foto que el autor
                        eligió para el post se leía como fondo apagado. El
                        contraste lo pone .scrim-card, que oscurece solo el
                        tercio bajo donde vive el bloque de texto. */}
                    <img src={p.cover_image} alt={p.title} className="parallax-layer absolute inset-0 w-full h-full object-cover" />
                    <div className="scrim-card" />
                  </>
                )}
              </div>
              {/* Sin el pill de categoría arriba del título: era una etiqueta
                  de clasificación encima del titular -- la misma fórmula del
                  Eyebrow que se borró del sitio -- y encima su valor era medio
                  inventado por el front cuando el post no traía category. Lo
                  que de verdad distingue una tarjeta de otra ya está abajo
                  ("Ver" sale del sitio, "Leer" se queda), y filtrar por
                  categoría sigue viviendo en los chips del listado. */}
              <div className="relative z-10 h-full p-5 sm:p-6 flex flex-col justify-end gap-2">
                <p className={`font-bold leading-snug line-clamp-2 ${ink} ${big ? 'text-24 sm:text-28' : 'text-16 sm:text-18'}`}>
                  {p.title}
                </p>
                {big && excerpt && (
                  <p className={`text-14 leading-relaxed line-clamp-2 ${ink70} max-w-md`}>{excerpt}</p>
                )}
                <span className={`text-13 font-bold ${ink} mt-1`}>
                  {isExternal ? 'Ver' : 'Leer'}
                </span>
              </div>
            </Tilt>
          </motion.div>
        );
      })}
    </div>
  );
}
