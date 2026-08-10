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
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import Reveal from '../ui/Reveal';
import TTSPlayer from './TTSPlayer';

function getSocialPlatform(url = '') {
  if (!url) return null;
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('facebook.com'))  return 'Facebook';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('tiktok.com'))    return 'TikTok';
  return 'Ver publicación';
}

export default function ArticleReader({ post }) {
  const social = getSocialPlatform(post.redirect_url);

  // Título de pestaña = título del artículo (el mapa estático de App.jsx
  // solo cubre rutas fijas; /blog/:slug pone el suyo aquí).
  useEffect(() => {
    if (post?.title) document.title = `${post.title} · Casa del Rey`;
  }, [post?.title]);

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
          <Link to="/blog" className="inline-block text-14 font-semibold text-white/60 hover:text-white mb-6 transition-colors">
            Volver al blog
          </Link>

          <div className="glass-light rounded-[28px] p-7 md:p-10">
            <p className="text-13 text-bg/50 mb-4">
              {post.CreatedAt ? new Date(post.CreatedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
            </p>
            <h1 className="text-30 md:text-38 font-bold text-bg leading-tight mb-6 tracking-tight">{post.title}</h1>

            {post.redirect_url && social && (
              <a
                href={post.redirect_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block glass-light-nested rounded-[20px] p-5 mb-8"
              >
                <p className="text-15 font-bold text-bg">Ver en {social}</p>
                <p className="text-13 text-bg/50 truncate">{post.redirect_url}</p>
              </a>
            )}

            <div className="mb-8">
              <TTSPlayer content={post.content} />
            </div>

            {/* Sanitizado: aunque el contenido lo escribe un admin/líder
                autenticado, es la única defensa si esa cuenta se ve
                comprometida o el editor permite pegar HTML crudo. */}
            <div className="prose prose-light max-w-full leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || '') }} />
          </div>
        </Reveal>
      </div>
    </main>
  );
}
