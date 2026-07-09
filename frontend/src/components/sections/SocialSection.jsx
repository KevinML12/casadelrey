// ============================================================
//  SocialSection — grid editorial del feed social (mismo lenguaje
//  que FeedSection en Home.jsx): fotos reales de AdminSocial, sin
//  iframes de embed. featured_size decide el tamaño de cada card.
// ============================================================
import { Icon, Eyebrow } from '../ui/Glass';
import Reveal, { RevealList, RevealItem } from '../ui/Reveal';
import Tilt from '../ui/Tilt';
import { useApi } from '../../lib/feed';

const PLATFORM_ICON = { instagram: 'instagram', youtube: 'youtube', facebook: 'heart', tiktok: 'music' };
const FEED_SPAN = {
  small:  'col-span-1 row-span-1',
  medium: 'col-span-2 row-span-1',
  large:  'col-span-2 row-span-2',
};

const NETWORKS = [
  { href: 'https://www.facebook.com/casadelreyhuehue',  label: 'Facebook',  icon: 'heart' },
  { href: 'https://www.instagram.com/ig.casadelrey/',   label: 'Instagram', icon: 'instagram' },
  { href: 'https://www.tiktok.com/@leoneldeleongt',     label: 'TikTok',    icon: 'music' },
  { href: 'https://x.com/pastorleoneli',                label: 'X',         icon: 'spark' },
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
        {showDirectAccess && (
          <div className="flex gap-3 shrink-0">
            {NETWORKS.map(n => (
              <a
                key={n.label}
                href={n.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full liquid-glass flex items-center justify-center text-white hover:scale-105 transition-transform focus-ring"
                aria-label={n.label}
              >
                <Icon name={n.icon} className="w-5 h-5" />
              </a>
            ))}
          </div>
        )}
      </Reveal>

      {posts.length === 0 ? (
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="liquid-glass rounded-[24px] p-12 text-center">
            <p className="text-[15px] text-white/60 font-medium">
              Aún no hay publicaciones vinculadas. Síguenos en redes para ver el contenido más reciente.
            </p>
          </div>
        </div>
      ) : (
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
                      <p className="text-[13.5px] font-semibold text-white leading-snug line-clamp-2">{p.caption}</p>
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
