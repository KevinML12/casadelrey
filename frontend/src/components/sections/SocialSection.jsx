import { useEffect, useState } from 'react';
import { Facebook, Instagram, ExternalLink } from 'lucide-react';
import apiClient from '../../lib/apiClient';

const FB_URL = 'https://www.facebook.com/casadelreyhuehue';
const IG_URL = 'https://www.instagram.com/ig.casadelrey/';
const X_URL = 'https://x.com/pastorleoneli';
const TIKTOK_URL = 'https://www.tiktok.com/@leoneldeleongt';

function getEmbedUrl(url, platform) {
  if (platform === 'instagram') {
    const match = url.match(/instagram\.com\/p\/([^/]+)/);
    return match ? `https://www.instagram.com/p/${match[1]}/embed` : url;
  }
  return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&width=500&show_text=true`;
}

export default function SocialSection({ title = 'Multimedia', showDirectAccess = true }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/social/feed')
      .then(r => setPosts(r.data || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-20 bg-bg-2">
      <div className="container mx-auto px-6">
        <div className="mb-10">
          <p className="text-blue font-semibold text-sm uppercase tracking-widest mb-2">Redes sociales</p>
          <h2 className="text-3xl font-black text-ink">{title}</h2>
        </div>

        {showDirectAccess && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <a
              href={FB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/20 hover:bg-[#1877F2]/20 transition-colors group"
            >
              <div className="w-14 h-14 rounded-xl bg-[#1877F2] flex items-center justify-center shrink-0">
                <Facebook size={28} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ink">Facebook</p>
                <p className="text-sm text-ink-3">Síguenos y mantente al día</p>
              </div>
              <ExternalLink size={18} className="text-ink-3 group-hover:text-[#1877F2] shrink-0" />
            </a>
            <a
              href={IG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:from-purple-500/20 hover:to-pink-500/20 transition-colors group"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                <Instagram size={28} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ink">Instagram</p>
                <p className="text-sm text-ink-3">Fotos, videos y más</p>
              </div>
              <ExternalLink size={18} className="text-ink-3 group-hover:text-purple-500 shrink-0" />
            </a>
            <a
              href={X_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 rounded-xl bg-black/10 border border-black/20 hover:bg-black/20 transition-colors group dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
            >
              <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center shrink-0 dark:bg-white">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white dark:text-black" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ink">X</p>
                <p className="text-sm text-ink-3">Síguenos en X</p>
              </div>
              <ExternalLink size={18} className="text-ink-3 group-hover:text-ink shrink-0" />
            </a>
            <a
              href={TIKTOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 rounded-xl bg-black/10 border border-black/20 hover:bg-black/20 transition-colors group dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
            >
              <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ink">TikTok</p>
                <p className="text-sm text-ink-3">Videos y contenido</p>
              </div>
              <ExternalLink size={18} className="text-ink-3 group-hover:text-ink shrink-0" />
            </a>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square bg-card rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-card border border-line">
            <p className="text-ink-3 text-sm">Aún no hay publicaciones. Síguenos en redes para ver el contenido.</p>
            {showDirectAccess && (
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <a href={FB_URL} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1877F2] text-white text-sm font-medium hover:opacity-90">
                  <Facebook size={18} /> Facebook
                </a>
                <a href={IG_URL} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:opacity-90">
                  <Instagram size={18} /> Instagram
                </a>
                <a href={X_URL} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:opacity-90 dark:bg-white dark:text-black">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  X
                </a>
                <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:opacity-90">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                  TikTok
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(p => (
              <a
                key={p.ID}
                href={p.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl overflow-hidden border border-line bg-card hover:border-blue/30 hover:shadow-lg transition-all group"
              >
                <div className="aspect-square bg-bg relative overflow-hidden">
                  <iframe
                    src={getEmbedUrl(p.post_url, p.platform)}
                    className="w-full h-full"
                    style={{ minHeight: 280 }}
                    title={p.caption || p.platform}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                  <div className="absolute top-3 right-3 px-2 py-1 rounded text-xs font-medium bg-white/90 text-ink-2 capitalize">
                    {p.platform}
                  </div>
                </div>
                {p.caption && (
                  <div className="p-4">
                    <p className="text-sm text-ink-2 line-clamp-2">{p.caption}</p>
                    <p className="text-xs text-blue font-medium mt-2 flex items-center gap-1">
                      Ver publicación <ExternalLink size={12} />
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
