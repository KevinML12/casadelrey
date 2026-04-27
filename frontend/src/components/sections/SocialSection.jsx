import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';

const FB_URL     = 'https://www.facebook.com/casadelreyhuehue';
const IG_URL     = 'https://www.instagram.com/ig.casadelrey/';
const X_URL      = 'https://x.com/pastorleoneli';
const TIKTOK_URL = 'https://www.tiktok.com/@leoneldeleongt';

const NETWORKS = [
  {
    href: FB_URL,
    label: 'Facebook',
    sub: 'Síguenos y mantente al día',
    icon: 'facebook',
    color: '#1877F2',
  },
  {
    href: IG_URL,
    label: 'Instagram',
    sub: 'Fotos, videos y más',
    icon: 'photo_camera',
    color: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
  },
  {
    href: X_URL,
    label: 'X / Twitter',
    sub: 'Síguenos en X',
    icon: 'alternate_email',
    color: '#000000',
  },
  {
    href: TIKTOK_URL,
    label: 'TikTok',
    sub: 'Videos y contenido',
    icon: 'play_circle',
    color: '#010101',
  },
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
    <section className="py-20 bg-surf-low">
      <div className="max-w-[1200px] mx-auto px-6">

        <div className="mb-10">
          <p className="text-label-l text-pri font-semibold uppercase tracking-widest mb-2">Redes sociales</p>
          <h2 className="text-headline-s text-on-surf">{title}</h2>
        </div>

        {showDirectAccess && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {NETWORKS.map(({ href, label, sub, icon, color }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 rounded-xl border border-outline-var bg-surf hover:shadow-elev-1 hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white"
                  style={{ background: color.includes('gradient') ? color : color }}>
                  <span className="ms" style={{ fontSize: 24 }}>{icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-title-s text-on-surf">{label}</p>
                  <p className="text-body-s text-on-surf-var truncate">{sub}</p>
                </div>
                <span className="ms text-on-surf-var group-hover:text-pri transition-colors" style={{ fontSize: 18 }}>open_in_new</span>
              </a>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square bg-surf-high rounded-xl animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-outline-var bg-surf">
            <p className="text-body-m text-on-surf-var">Aún no hay publicaciones vinculadas. Síguenos en redes para ver el contenido.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(p => (
              <a
                key={p.ID}
                href={p.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl overflow-hidden border border-outline-var bg-surf hover:shadow-elev-2 hover:-translate-y-0.5 transition-all group"
              >
                <div className="aspect-square bg-surf-low relative overflow-hidden">
                  <iframe
                    src={getEmbedUrl(p.post_url, p.platform)}
                    className="w-full h-full"
                    style={{ minHeight: 280 }}
                    title={p.caption || p.platform}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-label-s font-medium bg-surf/90 text-on-surf capitalize">
                    {p.platform}
                  </div>
                </div>
                {p.caption && (
                  <div className="p-4">
                    <p className="text-body-s text-on-surf-var line-clamp-2">{p.caption}</p>
                    <p className="text-label-m text-pri font-medium mt-2 flex items-center gap-1">
                      Ver publicación
                      <span className="ms" style={{ fontSize: 14 }}>open_in_new</span>
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
