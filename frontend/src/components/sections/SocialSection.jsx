// ============================================================
//  SocialSection — grid editorial del feed social (mismo lenguaje
//  que FeedSection en Home.jsx): fotos reales de AdminSocial, sin
//  iframes de embed. featured_size decide el tamaño de cada card.
// ============================================================
import { Icon, Eyebrow } from '../ui/Glass';
import Reveal, { RevealList, RevealItem } from '../ui/Reveal';
import Tilt from '../ui/Tilt';
import { useApi } from '../../lib/feed';

const PLATFORM_ICON = { instagram: 'instagram', youtube: 'youtube', facebook: 'facebook', tiktok: 'tiktok' };
const FEED_SPAN = {
  small:  'col-span-1 row-span-1',
  medium: 'col-span-2 row-span-1',
  large:  'col-span-2 row-span-2',
};

// Handle real de cada cuenta + tinte de marca -- antes eran fondos
// sólidos del color de cada red (flat, no "vidrio"); ahora es el mismo
// material .glass-tint (bisel + blur, ver index.css) con el color de la
// red inyectado vía --tint-bg, para que se sienta parte del mismo
// sistema de vidrio que el resto del sitio y no un bloque de color plano.
const NETWORKS = [
  { href: 'https://www.instagram.com/ig.casadelrey/',   label: 'Instagram', handle: '@ig.casadelrey',    icon: 'instagram', tint: 'linear-gradient(155deg, rgba(245,133,41,0.55) 0%, rgba(221,42,123,0.5) 50%, rgba(129,52,175,0.45) 100%)', span: 'col-span-2 row-span-2' },
  { href: 'https://www.facebook.com/casadelreyhuehue',  label: 'Facebook',  handle: '/casadelreyhuehue', icon: 'facebook',  tint: 'linear-gradient(155deg, rgba(24,119,242,0.6) 0%, rgba(24,119,242,0.32) 100%)', span: 'col-span-2 row-span-1' },
  { href: 'https://www.tiktok.com/@leoneldeleongt',     label: 'TikTok',    handle: '@leoneldeleongt',   icon: 'tiktok',    tint: 'linear-gradient(155deg, rgba(37,244,238,0.5) 0%, rgba(254,44,85,0.4) 100%)', span: 'col-span-1 row-span-1' },
  { href: 'https://x.com/pastorleoneli',                label: 'X',         handle: '@pastorleoneli',    icon: 'x_logo',    tint: 'linear-gradient(155deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 100%)', span: 'col-span-1 row-span-1' },
];

export default function SocialSection({ title = 'Nuestro feed', showDirectAccess = true }) {
  const data = useApi('/social/feed');
  const posts = (Array.isArray(data) ? data : []).filter(p => p.is_active !== false);

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

      {showDirectAccess && (
        <Reveal delay={0.05} className="relative z-10 max-w-6xl mx-auto px-6 mb-6">
          {/* Bento en .glass-tint (vidrio real con el color de cada marca,
              ver index.css) -- Instagram destacada como red principal, el
              nombre de cada red se lee grande, como una portada. */}
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
                  style={{ '--tint-bg': n.tint }}
                  className={`glass-tint group relative flex flex-col justify-end p-4 md:p-6 text-white rounded-[18px] ${n.span}`}
                >
                  <Icon name={n.icon} className={`relative z-10 mb-2.5 ${big ? 'w-10 h-10' : 'w-6 h-6'}`} stroke={1.4} />
                  <p className={`relative z-10 font-extrabold leading-none tracking-tight ${big ? 'text-32 md:text-40' : 'text-17'}`}>{n.label}</p>
                  <p className={`relative z-10 text-white/75 truncate ${big ? 'text-15 mt-2' : 'text-12 mt-1'}`}>{n.handle}</p>
                  <Icon name="arrow" className="relative z-10 w-4 h-4 text-white/60 absolute top-4 right-4 -rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" stroke={2} />
                </Tilt>
              );
            })}
          </div>
        </Reveal>
      )}

      {posts.length > 0 && (
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <RevealList className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 auto-rows-[170px] md:auto-rows-[200px]">
            {posts.map(p => (
              <RevealItem key={p.ID} className={FEED_SPAN[p.featured_size] || FEED_SPAN.small}>
                <Tilt
                  as="a"
                  href={p.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  max={6}
                  glass={p.featured_size === 'large' ? 'featured' : 'standard'}
                  className="group relative block h-full rounded-[18px] overflow-hidden liquid-glass border border-white/5 hover:border-white/25"
                >
                  {p.image_url && (
                    <img
                      src={p.image_url}
                      alt={p.caption || p.platform}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-bg/85 via-bg/15 to-transparent" />
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-bg/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/80">
                    <Icon name={PLATFORM_ICON[p.platform] || 'spark'} className="w-4 h-4" />
                  </div>
                  {p.caption && (
                    <div className="absolute bottom-0 inset-x-0 p-4">
                      <p className="text-14 font-semibold text-white leading-snug line-clamp-2">{p.caption}</p>
                    </div>
                  )}
                </Tilt>
              </RevealItem>
            ))}
          </RevealList>
        </div>
      )}
    </section>
  );
}
