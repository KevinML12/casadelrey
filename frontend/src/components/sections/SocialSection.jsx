import { useEffect, useState } from 'react';
import { Facebook, Instagram, ExternalLink } from 'lucide-react';
import apiClient from '../../lib/apiClient';

const FB_URL = 'https://www.facebook.com/casadelreyhuehue';
const IG_URL = 'https://www.instagram.com/ig.casadelrey/';

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
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
              <div className="flex justify-center gap-4 mt-6">
                <a href={FB_URL} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1877F2] text-white text-sm font-medium hover:opacity-90">
                  <Facebook size={18} /> Facebook
                </a>
                <a href={IG_URL} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:opacity-90">
                  <Instagram size={18} /> Instagram
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
