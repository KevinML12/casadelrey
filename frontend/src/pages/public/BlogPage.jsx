import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHero from '../../components/layout/PageHero';
import apiClient from '../../lib/apiClient';
import useTTS from '../../hooks/useTTS';
import { Icon, Eyebrow } from '../../components/ui/Glass';
import Reveal, { RevealList, RevealItem } from '../../components/ui/Reveal';
import Tilt from '../../components/ui/Tilt';
import ParallaxImg from '../../components/ui/ParallaxImg';

const MOCK_POSTS_FALLBACK = [
  { ID: 1, title: 'El Precio del Propósito', slug: 'precio-proposito', category: 'ENSEÑANZA', excerpt: 'Descubre cómo el propósito moldea nuestra identidad.', content: '<p>Descubre cómo el propósito moldea nuestra identidad.</p>' },
  { ID: 2, title: 'Identidad Inquebrantable', slug: 'identidad-inquebrantable', category: 'ENSEÑANZA', excerpt: 'Nuestra identidad está firme en la palabra.', content: '<p>Nuestra identidad está firme en la palabra.</p>' },
  { ID: 3, title: 'Instagram Oficial', redirect_url: 'https://instagram.com/casadelreyhue', category: 'RED SOCIAL' }
];

function Loader() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
    </div>
  );
}

function TTSPlayer({ content }) {
  const plainText = content?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || '';
  const { status, progress, play, pause, resume, stop, engine } = useTTS(plainText);

  const isPlaying = status === 'playing';
  const isPaused  = status === 'paused';
  const isLoading = status === 'loading';
  const isActive  = isPlaying || isPaused || isLoading;
  const isDone    = status === 'done';

  const engineLabel = engine === 'elevenlabs' ? 'ElevenLabs (IA)' : engine === 'google-cloud' ? 'Google Cloud' : 'Google Translate';

  return (
    <div className="liquid-glass rounded-[20px] overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
          <Icon name={isLoading ? 'spark' : 'music'} className={`w-5 h-5 text-white ${isLoading ? 'animate-spin' : ''}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-white">
            {isLoading ? 'Preparando…' : isPlaying ? 'Leyendo…' : isPaused ? 'Pausado' : isDone ? 'Completado' : 'Escuchar este post'}
          </p>
          <p className="text-[12.5px] text-white/50 mt-0.5">
            {isActive ? `Voz en español · ${engineLabel}` : 'El post se leerá en voz alta'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(!isActive || isDone) && (
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }} onClick={play}
              className="flex items-center gap-2 px-4 py-2 rounded-full liquid-glass text-white text-[13px] font-bold">
              <Icon name="play" className="w-3.5 h-3.5" />
              {isDone ? 'Repetir' : 'Escuchar'}
            </motion.button>
          )}
          {isPlaying && (
            <button onClick={pause} className="px-4 py-2 rounded-full bg-white/10 text-white text-[13px] font-semibold">
              Pausar
            </button>
          )}
          {isPaused && (
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }} onClick={resume}
              className="flex items-center gap-2 px-4 py-2 rounded-full liquid-glass text-white text-[13px] font-bold">
              <Icon name="play" className="w-3.5 h-3.5" />
              Continuar
            </motion.button>
          )}
          {isActive && (
            <button onClick={stop} title="Detener" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70">
              <Icon name="close" className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isActive && (
        <div className="h-1 bg-white/10">
          <div className="h-full bg-white transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

function getSocialPlatform(url = '') {
  if (!url) return null;
  if (url.includes('instagram.com'))  return { label: 'Instagram', icon: 'instagram' };
  if (url.includes('facebook.com'))   return { label: 'Facebook',  icon: 'heart' };
  if (url.includes('youtube.com') || url.includes('youtu.be')) return { label: 'YouTube', icon: 'youtube' };
  if (url.includes('tiktok.com'))     return { label: 'TikTok', icon: 'music' };
  return { label: 'Ver publicación', icon: 'spark' };
}

function PostDetail({ post }) {
  const social = getSocialPlatform(post.redirect_url);

  return (
    <Reveal className="max-w-2xl mx-auto">
      <Link to="/blog" className="inline-flex items-center gap-2 text-[14px] font-semibold text-white/60 hover:text-white mb-8 transition-colors">
        <Icon name="arrow" className="w-4 h-4 rotate-180" />
        Volver al blog
      </Link>

      {post.cover_image && (
        <img src={post.cover_image} alt={post.title} className="w-full max-h-80 object-cover rounded-[20px] mb-8" />
      )}

      <p className="text-[13px] text-white/50 flex items-center gap-2 mb-4">
        <Icon name="calendar" className="w-3.5 h-3.5" />
        {post.CreatedAt ? new Date(post.CreatedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
      </p>
      <h1 className="text-[32px] md:text-[40px] font-bold text-white leading-tight mb-6 tracking-tight">{post.title}</h1>

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
    </Reveal>
  );
}

function PostList({ posts }) {
  if (posts.length === 0) {
    return (
      <div className="py-32 flex flex-col items-center gap-5 text-center">
        <p className="font-bold leading-[1.05] tracking-tight text-white/50" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
          Pronto, primeras palabras.
        </p>
        <p className="text-white/40 text-[16px]">Estamos preparando contenido para ti.</p>
      </div>
    );
  }

  return (
    /* Bento asimétrico: el primer post ocupa 2×2 (destacado real), el
       resto rellena en celdas normales — nada de grid parejo repetido */
    <RevealList className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[190px] gap-5">
      {posts.map((p, i) => {
        const isExternal = !!p.redirect_url;
        const featured   = i === 0;
        const excerpt    = p.excerpt || p.content?.replace(/<[^>]+>/g, '').substring(0, 110);
        const category   = (p.category || (isExternal ? 'Red social' : 'Enseñanza'));
        const span = featured ? 'col-span-2 row-span-2' : 'col-span-2 sm:col-span-1 row-span-1';

        const cardInner = (
          <>
            <div className="absolute inset-0">
              {p.cover_image
                ? <img src={p.cover_image} alt={p.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                : <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              }
              <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/30 to-transparent" />
            </div>
            <div className="relative z-10 h-full p-6 flex flex-col justify-end gap-2">
              <p className="text-[12px] font-bold text-white/60 flex items-center gap-1.5">
                {category}
                {isExternal && <Icon name="spark" className="w-3 h-3" />}
              </p>
              <p className={`font-bold leading-snug line-clamp-2 text-white ${featured ? 'text-[26px] md:text-[30px]' : 'text-[17px]'}`}>
                {p.title}
              </p>
              {featured && excerpt && (
                <p className="text-[15px] leading-relaxed line-clamp-2 text-white/70 max-w-md">{excerpt}</p>
              )}
              <span className="text-[13.5px] font-bold text-white mt-1 inline-flex items-center gap-1.5">
                {isExternal ? 'Ver' : 'Leer'}
                <Icon name="arrow" className="w-3.5 h-3.5" />
              </span>
            </div>
          </>
        );

        return (
          <RevealItem key={p.ID} depth className={span}>
            <Tilt
              max={5}
              glass={featured ? 'featured' : 'standard'}
              {...(isExternal
                ? { as: 'a', href: p.redirect_url, target: '_blank', rel: 'noopener noreferrer' }
                : { as: Link, to: `/blog/${p.slug}` })}
              className="group relative rounded-[24px] overflow-hidden liquid-glass h-full block"
            >
              {cardInner}
            </Tilt>
          </RevealItem>
        );
      })}
    </RevealList>
  );
}

export default function BlogPage() {
  const [posts,   setPosts]   = useState([]);
  const [post,    setPost]    = useState(null);
  const [loading, setLoading] = useState(true);
  const { slug } = useParams();

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        if (slug) {
          const r = await apiClient.get(`/blog/${slug}`);
          setPost(r.data);
        } else {
          const r = await apiClient.get('/blog/');
          setPosts(r.data || []);
        }
      } catch (err) {
        console.error(err);
        if (slug) {
          setPost(MOCK_POSTS_FALLBACK.find(p => p.slug === slug));
        } else {
          setPosts(MOCK_POSTS_FALLBACK);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) return <Loader />;

  if (slug && post) {
    return (
      <main className="min-h-screen bg-bg py-32">
        <div className="max-w-[1200px] mx-auto px-6"><PostDetail post={post} /></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg relative overflow-hidden">
      <ParallaxImg src="/images/bg-ensenanzas.jpg" alt="" className="opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/40" />

      <div className="relative z-10 pt-40 pb-16 px-6 max-w-6xl mx-auto text-center flex flex-col items-center">
        <Reveal>
          <Eyebrow>Enseñanzas</Eyebrow>
          <h1 className="display-mega text-white mt-4 mb-4" style={{ fontSize: 'clamp(2.6rem, 7vw, 4.5rem)' }}>Blog</h1>
          <p className="text-[17px] text-white/70 max-w-xl mx-auto">
            Enseñanzas, reflexiones y mensajes para tu crecimiento espiritual.
          </p>
        </Reveal>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 pb-32"><PostList posts={posts} /></div>
    </main>
  );
}
