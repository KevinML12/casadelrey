// ============================================================
//  ArticleReader — lectura de un post. A propósito NO usa el patrón
//  de ventana sobrepuesta (WindowStack): un artículo es contenido
//  largo que la gente comparte y guarda como enlace directo
//  (/blog/:slug), algo que una ventana modal sacrifica (URL no
//  navegable, sin SEO, scroll incómodo dentro de un overlay de
//  altura fija). En su lugar: ruta propia con el mismo lenguaje
//  inmersivo — hero de foto de portada que se disuelve en el canvas,
//  panel de cristal flotante con el contenido.
// ============================================================
import { Link } from 'react-router-dom';
import { Icon } from '../ui/Glass';
import Reveal from '../ui/Reveal';
import TTSPlayer from './TTSPlayer';

function getSocialPlatform(url = '') {
  if (!url) return null;
  if (url.includes('instagram.com')) return { label: 'Instagram', icon: 'instagram' };
  if (url.includes('facebook.com'))  return { label: 'Facebook', icon: 'heart' };
  if (url.includes('youtube.com') || url.includes('youtu.be')) return { label: 'YouTube', icon: 'youtube' };
  if (url.includes('tiktok.com'))    return { label: 'TikTok', icon: 'music' };
  return { label: 'Ver publicación', icon: 'spark' };
}

export default function ArticleReader({ post }) {
  const social = getSocialPlatform(post.redirect_url);

  return (
    <main className="relative bg-bg min-h-screen overflow-hidden">
      {/* Hero inmersivo: la portada domina y se disuelve en el canvas */}
      <div className="relative h-[42vh] min-h-[300px] max-h-[520px] overflow-hidden">
        {post.cover_image ? (
          <img src={post.cover_image} alt={post.title} className="absolute inset-0 w-full h-full object-cover opacity-55" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/45 to-bg/10" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 -mt-24 pb-32">
        <Reveal>
          <Link to="/blog" className="inline-flex items-center gap-2 text-[14px] font-semibold text-white/60 hover:text-white mb-6 transition-colors">
            <Icon name="arrow" className="w-4 h-4 rotate-180" />
            Volver al blog
          </Link>

          <div className="liquid-glass rounded-[28px] p-7 md:p-10">
            <p className="text-[13px] text-white/50 flex items-center gap-2 mb-4">
              <Icon name="calendar" className="w-3.5 h-3.5" />
              {post.CreatedAt ? new Date(post.CreatedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
            </p>
            <h1 className="text-[30px] md:text-[38px] font-bold text-white leading-tight mb-6 tracking-tight">{post.title}</h1>

            {post.redirect_url && social && (
              <a
                href={post.redirect_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 liquid-glass rounded-[20px] p-5 mb-8 group hover:border-white/25"
              >
                <div className="w-11 h-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <Icon name={social.icon} className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-white">Ver en {social.label}</p>
                  <p className="text-[13px] text-white/50 truncate">{post.redirect_url}</p>
                </div>
                <Icon name="arrow" className="w-4 h-4 text-white/40 group-hover:text-white transition-colors shrink-0" />
              </a>
            )}

            <div className="mb-8">
              <TTSPlayer content={post.content} />
            </div>

            <div className="prose max-w-full leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </Reveal>
      </div>
    </main>
  );
}
