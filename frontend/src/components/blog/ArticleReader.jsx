import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import PhotoImage from '../ui/PhotoImage';
import SectionBg from '../ui/SectionBg';
import Reveal from '../ui/Reveal';
import { useSitePhoto } from '../../lib/feed';
import TTSPlayer from './TTSPlayer';

function getSocialPlatform(url = '') {
  if (!url) return null;
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('facebook.com')) return 'Facebook';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('tiktok.com')) return 'TikTok';
  return null;
}

// The shareable article keeps a full photograph inside the glass and behind it.
export default function ArticleReader({ post }) {
  const fallback = useSitePhoto('hero_blog', '/images/backgrounds/comunidad-templo.webp');
  const photo = post.cover_image || fallback;
  const social = getSocialPlatform(post.redirect_url);
  const date = post.CreatedAt ? new Date(post.CreatedAt) : null;
  const hasDate = date && !Number.isNaN(date.getTime());

  useEffect(() => {
    if (post.title) document.title = `${post.title} · Casa del Rey`;
  }, [post.title]);

  return (
    <main className="relative isolate min-h-[100svh] overflow-clip px-5 pt-32 pb-16 sm:px-8 sm:pt-36 sm:pb-24">
      <SectionBg src={photo} fallbackSrc={fallback} viewport opacity="opacity-100" scrimClassName="bg-bg/35" />
      <div className="relative z-10 max-w-3xl mx-auto">
        <Link to="/blog" className="ui-action mb-5 inline-flex min-h-11 items-center rounded-[12px] liquid-glass px-4 text-14 font-semibold text-white focus-ring">Volver al blog</Link>
        <Reveal>
          <article aria-labelledby="article-title" className="glass-light rounded-[16px] p-6 sm:p-10 text-bg">
            {(post.category || hasDate) && <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-13 text-bg/75">
              {post.category && <span className="font-semibold">{post.category}</span>}
              {hasDate && <time dateTime={date.toISOString()}>{date.toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}</time>}
            </div>}
            <h1 id="article-title" className="text-32 sm:text-44 font-semibold tracking-tight leading-[1.12] [overflow-wrap:anywhere]">{post.title}</h1>
            {post.excerpt && <p className="mt-5 text-17 sm:text-18 text-bg/80 leading-relaxed">{post.excerpt}</p>}
            {post.cover_image && <figure aria-label="Portada del mensaje" className="mt-7 -mx-6 sm:-mx-10 bg-bg/5">
              <PhotoImage src={post.cover_image} fallbackSrc={fallback} alt={post.title} loading="eager" sizes="(max-width: 768px) 100vw, 768px" className="w-full h-auto max-h-[62svh] object-contain" />
            </figure>}
            {post.redirect_url && <a href={post.redirect_url} target="_blank" rel="noopener noreferrer" className="ui-action mt-7 inline-flex min-h-11 max-w-full items-center justify-center rounded-[12px] bg-bg px-5 py-3 text-14 font-bold text-white focus-ring">{social ? `Ver en ${social}` : 'Ver publicación'}</a>}
            {post.content && <>
              <div className="my-7"><TTSPlayer content={post.content} /></div>
              <div className="prose prose-light article-copy max-w-full [overflow-wrap:anywhere]" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />
            </>}
          </article>
        </Reveal>
      </div>
    </main>
  );
}
