// ============================================================
//  SocialSection — bento de accesos directos a las redes reales, en
//  .glass-light (blanco/navy, mismo material que el resto de Nosotros).
//  Se probó primero con .glass-tint (vidrio a color de marca) pero el
//  usuario lo prefirió en blanco y negro -- más sobrio, consistente con
//  el resto de la página en vez de un cuarto material solo para esto.
//  Antes también intentaba mostrar un grid de posts reales jalados de
//  /social/feed (duplicado casi exacto de FeedSection en Home.jsx) --
//  se quitó: sin curaduría real esas fotos no aportaban nada y quedaba
//  un componente duplicado en dos páginas. Un solo componente, reusado
//  tanto en Nosotros como en Home.
// ============================================================
import { Eyebrow } from '../ui/Glass';
import Reveal from '../ui/Reveal';
import Tilt from '../ui/Tilt';

const NETWORKS = [
  { href: 'https://www.instagram.com/ig.casadelrey/',   label: 'Instagram', handle: '@ig.casadelrey',    span: 'col-span-2 row-span-2' },
  { href: 'https://www.facebook.com/casadelreyhuehue',  label: 'Facebook',  handle: '/casadelreyhuehue', span: 'col-span-2 row-span-1' },
  { href: 'https://www.tiktok.com/@leoneldeleongt',     label: 'TikTok',    handle: '@leoneldeleongt',   span: 'col-span-1 row-span-1' },
  { href: 'https://x.com/pastorleoneli',                label: 'X',         handle: '@pastorleoneli',    span: 'col-span-1 row-span-1' },
];

export default function SocialSection({ title = 'Síguenos en redes' }) {
  return (
    <section className="relative py-20 md:py-32 bg-bg border-t border-white/5 overflow-hidden">
      <Reveal className="relative z-10 max-w-6xl mx-auto px-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Eyebrow>Redes sociales</Eyebrow>
          <h2 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}>
            {title}
          </h2>
        </div>
      </Reveal>

      <Reveal delay={0.05} className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Bento en .glass-light -- blanco y negro, Instagram destacada
            como red principal, el nombre de cada red se lee grande,
            como una portada. */}
        <div className="grid grid-cols-2 sm:grid-cols-4 auto-rows-[120px] sm:auto-rows-[150px] gap-3 md:gap-4">
          {NETWORKS.map(n => {
            const big = n.span === 'col-span-2 row-span-2';
            return (
              <Tilt
                key={n.label}
                as="a"
                max={6}
                glass
                whileHover={{ scale: 1.03, y: -4 }}
                href={n.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`glass-light relative flex flex-col justify-end p-4 md:p-6 text-bg rounded-[18px] ${n.span}`}
              >
                <p className={`relative z-10 font-extrabold leading-none tracking-tight ${big ? 'text-32 md:text-40' : 'text-17'}`}>{n.label}</p>
                <p className={`relative z-10 text-bg/60 truncate ${big ? 'text-15 mt-2' : 'text-12 mt-1'}`}>{n.handle}</p>
              </Tilt>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}
