// ============================================================
//  PostCollage — listado de posts en COLLAGE (tamaños/inclinaciones
//  variados, determinístico por índice), mismo lenguaje que Galería/
//  Células. Sin posts → estado vacío real (nunca contenido de mentira).
// ============================================================
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Glass';
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
        <p className="font-bold leading-[1.05] tracking-tight text-white/50" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
          Pronto, primeras palabras.
        </p>
        <p className="text-white/40 text-[16px]">Estamos preparando contenido para ti.</p>
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
        const category = p.category || (isExternal ? 'Red social' : 'Enseñanza');

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
              className="liquid-glass group relative w-full h-full rounded-[22px] overflow-hidden text-left focus-ring ring-1 ring-white/10 block"
              style={{ rotate: rot, transformOrigin: 'center' }}
            >
              <div className="absolute inset-0">
                {p.cover_image ? (
                  <img src={p.cover_image} alt={p.title} className="parallax-layer absolute inset-0 w-full h-full object-cover opacity-55 group-hover:opacity-75 transition-all duration-700" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/35 to-transparent" />
              </div>
              <div className="relative z-10 h-full p-5 sm:p-6 flex flex-col justify-end gap-2">
                <span className="self-start bg-white/12 border border-white/20 text-white/90 px-2.5 py-0.5 rounded-full text-[11px] font-semibold mb-auto backdrop-blur-md flex items-center gap-1.5">
                  {category}
                  {isExternal && <Icon name="spark" className="w-3 h-3" />}
                </span>
                <p className={`font-bold leading-snug line-clamp-2 text-white ${big ? 'text-[24px] sm:text-[28px]' : 'text-[16px] sm:text-[18px]'}`}>
                  {p.title}
                </p>
                {big && excerpt && (
                  <p className="text-[14px] leading-relaxed line-clamp-2 text-white/70 max-w-md">{excerpt}</p>
                )}
                <span className="text-[13px] font-bold text-white mt-1 inline-flex items-center gap-1.5">
                  {isExternal ? 'Ver' : 'Leer'}
                  <Icon name="arrow" className="w-3.5 h-3.5" />
                </span>
              </div>
            </Tilt>
          </motion.div>
        );
      })}
    </div>
  );
}
