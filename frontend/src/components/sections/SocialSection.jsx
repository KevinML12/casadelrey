import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import { Icon } from '../ui/Glass';

const FB_URL     = 'https://www.facebook.com/casadelreyhuehue';
const IG_URL     = 'https://www.instagram.com/ig.casadelrey/';
const X_URL      = 'https://x.com/pastorleoneli';
const TIKTOK_URL = 'https://www.tiktok.com/@leoneldeleongt';

const NETWORKS = [
  { href: FB_URL,     label: 'Facebook',   sub: 'SÃ­guenos y mantente al dÃ­a', icon: 'heart' },
  { href: IG_URL,     label: 'Instagram',  sub: 'Fotos, videos y mÃ¡s',         icon: 'instagram' },
  { href: X_URL,      label: 'X / Twitter',sub: 'SÃ­guenos en X',               icon: 'spark' },
  { href: TIKTOK_URL, label: 'TikTok',     sub: 'Videos y contenido',          icon: 'music' },
];

function getEmbedUrl(url, platform) {
  if (platform === 'instagram') {
    const match = url.match(/instagram\.com\/p\/([^/]+)/);
    return match ? `https://www.instagram.com/p/${match[1]}/embed` : url;
  }
  return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&width=500&show_text=true`;
}

export default function SocialSection({ title = 'Multimedia', showDirectAccess = true }) {
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/social/feed')
      .then(r => setPosts(r.data || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="relative py-24 md:py-28 bg-bg overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="halo" style={{ width: 520, height: 520, top: '5%', left: '-12%', background: 'rgba(63,169,255,0.10)' }} />
      </div>
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="h-px w-10 bg-gradient-to-r from-electric to-transparent" />
          <span className="text-celeste text-[11px] font-extrabold uppercase tracking-widest">Redes sociales</span>
        </div>
        <h2 className="display-mega text-ink mb-12" style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}>
          {title}
        </h2>

        {showDirectAccess && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
            {NETWORKS.map(({ href, label, sub, icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-bg border border-ink-soft shadow-card rounded-card p-5 hover:bg-bg-soft transition-all group focus-ring"
              >
                <span className="grid place-items-center w-12 h-12 rounded-sm bg-bg-soft text-celeste shrink-0">
                  <Icon name={icon} className="w-6 h-6" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-extrabold tracking-tightish text-ink">{label}</p>
                  <p className="text-[12.5px] text-ink-3 truncate">{sub}</p>
                </div>
                <Icon name="arrow" className="w-5 h-5 text-ink-3 group-hover:text-ink transition-colors" />
              </a>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square glass rounded-card animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-bg border border-ink-soft shadow-card rounded-card">
            <p className="text-[14.5px] text-ink-2">AÃºn no hay publicaciones vinculadas. SÃ­guenos en redes para ver el contenido.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map(p => (
              <a
                key={p.ID}
                href={p.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-card overflow-hidden glass glass-sheen hover:bg-bg-soft transition-all group focus-ring"
              >
                <div className="aspect-square relative overflow-hidden bg-bg-soft">
                  <iframe
                    src={getEmbedUrl(p.post_url, p.platform)}
                    className="w-full h-full"
                    style={{ minHeight: 280 }}
                    title={p.caption || p.platform}
                  />
                  <div className="absolute top-3 right-3 glass rounded-full px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-widest text-ink capitalize">
                    {p.platform}
                  </div>
                </div>
                {p.caption && (
                  <div className="p-4">
                    <p className="text-[13.5px] text-ink-2 line-clamp-2">{p.caption}</p>
                    <p className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] font-extrabold uppercase tracking-[0.24em] text-celeste">
                      Ver publicaciÃ³n
                      <Icon name="arrow" className="w-3 h-3" />
                    </p>
                  </div>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
