import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHero from '../../components/layout/PageHero';
import apiClient from '../../lib/apiClient';
import useTTS from '../../hooks/useTTS';

const MOCK_POSTS_FALLBACK = [
  { ID: 1, title: 'El Precio del Propósito', slug: 'precio-proposito', category: 'ENSEÑANZA', excerpt: 'Descubre cómo el propósito moldea nuestra identidad.', content: '<p>Descubre cómo el propósito moldea nuestra identidad.</p>' },
  { ID: 2, title: 'Identidad Inquebrantable', slug: 'identidad-inquebrantable', category: 'ENSEÑANZA', excerpt: 'Nuestra identidad está firme en la palabra.', content: '<p>Nuestra identidad está firme en la palabra.</p>' },
  { ID: 3, title: 'Instagram Oficial', redirect_url: 'https://instagram.com/casadelreyhue', category: 'RED SOCIAL' }
];

function Loader() {
  return (
    <div className="min-h-screen bg-surf flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
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

  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
      isActive ? 'border-outline-var' : 'border-outline-var bg-surf-low'
    }`}
    style={isActive ? { background: '#0D1B5E', borderColor: 'rgba(255,255,255,.1)' } : {}}>
      <div className="flex items-center gap-4 px-5 py-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
          isActive ? '' : 'bg-pri-con'
        }`}
        style={isActive ? { background: 'rgba(255,255,255,.1)' } : {}}>
          {isLoading
            ? <span className="ms animate-spin" style={{ fontSize: 22, color: '#A4C8FF' }}>hourglass_empty</span>
            : <span className="ms" style={{ fontSize: 22, color: isActive ? '#A4C8FF' : 'var(--on-pri-con)' }}>volume_up</span>
          }
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-title-s font-semibold ${isActive ? 'text-ink' : 'text-on-surf'}`}>
            {isLoading ? 'Preparando…' : isPlaying ? 'Leyendo…' : isPaused ? 'Pausado' : isDone ? 'Completado' : 'Escuchar este post'}
          </p>
          <p className={`text-label-s mt-0.5 ${isActive ? '' : 'text-on-surf-var'}`}
            style={isActive ? { color: 'rgba(255,255,255,.5)' } : {}}>
            {isActive
              ? `Voz en español${engine ? ` · ${engine === 'elevenlabs' ? 'ElevenLabs' : engine === 'google-cloud' ? 'Google Cloud' : 'Google Translate'}` : ''}`
              : engine ? `Motor: ${engine === 'elevenlabs' ? 'ElevenLabs (IA)' : engine === 'google-cloud' ? 'Google Cloud' : 'Google Translate'}` : 'El post se leerá en voz alta'
            }
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(!isActive || isDone) && (
            <button onClick={play}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-pri text-on-pri text-label-m font-semibold hover:opacity-90 transition-opacity">
              <span className="ms" style={{ fontSize: 16 }}>play_arrow</span>
              {isDone ? 'Repetir' : 'Escuchar'}
            </button>
          )}
          {isPlaying && (
            <button onClick={pause}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-label-m font-medium"
              style={{ background: 'rgba(255,255,255,.1)', color: 'white' }}>
              <span className="ms" style={{ fontSize: 16 }}>pause</span>
              Pausar
            </button>
          )}
          {isPaused && (
            <button onClick={resume}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-pri text-on-pri text-label-m font-semibold hover:opacity-90 transition-opacity">
              <span className="ms" style={{ fontSize: 16 }}>play_arrow</span>
              Continuar
            </button>
          )}
          {isActive && (
            <button onClick={stop} title="Detener"
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.7)' }}>
              <span className="ms" style={{ fontSize: 15 }}>stop</span>
            </button>
          )}
        </div>
      </div>

      {isActive && (
        <div className="h-1" style={{ background: 'rgba(255,255,255,.1)' }}>
          <div className="h-full bg-pri transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

function getSocialPlatform(url = '') {
  if (!url) return null;
  if (url.includes('instagram.com'))  return { label: 'Instagram',  icon: 'photo_camera' };
  if (url.includes('facebook.com'))   return { label: 'Facebook',   icon: 'thumb_up' };
  if (url.includes('youtube.com') || url.includes('youtu.be')) return { label: 'YouTube', icon: 'play_circle' };
  if (url.includes('tiktok.com'))     return { label: 'TikTok',     icon: 'music_video' };
  return { label: 'Ver publicación', icon: 'open_in_new' };
}

function PostDetail({ post }) {
  const social = getSocialPlatform(post.redirect_url);

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/blog"
        className="inline-flex items-center gap-1.5 text-label-m text-on-surf-var hover:text-on-surf mb-8 transition-colors">
        <span className="ms" style={{ fontSize: 16 }}>arrow_back</span>
        Volver al Blog
      </Link>

      {post.cover_image && (
        <img src={post.cover_image} alt={post.title}
          className="w-full max-h-80 object-cover rounded-xl mb-8 border border-outline-var" />
      )}

      <p className="text-label-s text-on-surf-var flex items-center gap-1.5 mb-4">
        <span className="ms" style={{ fontSize: 14 }}>calendar_today</span>
        {post.CreatedAt ? new Date(post.CreatedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
      </p>
      <h1 className="text-headline-l text-on-surf font-black leading-tight mb-6">{post.title}</h1>

      {post.redirect_url && social && (
        <a
          href={post.redirect_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-outline-var bg-surf-low hover:bg-surf-high transition-colors mb-8 group"
        >
          <div className="w-10 h-10 rounded-xl bg-pri-con flex items-center justify-center shrink-0">
            <span className="ms text-on-pri-con" style={{ fontSize: 20 }}>{social.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-label-l text-on-surf font-semibold">Ver en {social.label}</p>
            <p className="text-label-s text-on-surf-var truncate">{post.redirect_url}</p>
          </div>
          <span className="ms text-on-surf-var group-hover:text-on-surf transition-colors shrink-0" style={{ fontSize: 18 }}>open_in_new</span>
        </a>
      )}

      <div className="mb-8">
        <TTSPlayer content={post.content} />
      </div>

      <div className="prose max-w-full leading-relaxed"
        dangerouslySetInnerHTML={{ __html: post.content }} />
    </div>
  );
}

function PostList({ posts }) {
  if (posts.length === 0) {
    return (
      <div className="py-32 flex flex-col items-center gap-5">
        <p className="font-mono text-[11px] tracking-[2px]" style={{ color: 'var(--outline)' }}>BLOG</p>
        <p className="font-bold leading-[1.05] tracking-[-0.02em]"
          style={{ color: 'var(--on-surf)', fontSize: 'clamp(28px, 4vw, 40px)' }}>
          Pronto, primeras palabras.
        </p>
        <p style={{ color: 'var(--on-surf-var)', fontSize: 16 }}>
          Estamos preparando contenido para ti.
        </p>
      </div>
    );
  }

  const GRADIENTS = [
    'linear-gradient(160deg,#0D1B4B 0%,#060D24 100%)',
    'linear-gradient(160deg,#1E3A6E 0%,#0D1B4B 100%)',
    'linear-gradient(160deg,#10254E 0%,#060D24 100%)',
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {posts.map((p, i) => {
        const isExternal = !!p.redirect_url;
        const featured   = i === 0;
        const excerpt    = p.excerpt || p.content?.replace(/<[^>]+>/g, '').substring(0, 110);
        const category   = (p.category || (isExternal ? 'RED SOCIAL' : 'ENSEÑANZA')).toUpperCase();

        const cardBody = (
          <div
            className="rounded-3xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-1"
            style={
              featured
                ? { background: '#060D24', boxShadow: '0 12px 32px rgba(6,13,36,0.22)' }
                : { background: 'var(--surf-high)', border: '1px solid var(--outline-var)' }
            }
          >
            <div
              className="h-48 w-full shrink-0 bg-cover bg-center"
              style={
                p.cover_image
                  ? { backgroundImage: `url('${p.cover_image}')` }
                  : { background: GRADIENTS[i % GRADIENTS.length] }
              }
            />
            <div className="p-6 flex flex-col gap-2.5 flex-1">
              <p className="text-[11px] font-bold tracking-[1.5px]"
                style={{ color: featured ? 'rgba(255,255,255,0.6)' : 'var(--outline)' }}>
                {category}
                {isExternal && (
                  <span className="ml-2 inline-flex items-center gap-1">
                    <span className="ms" style={{ fontSize: 11 }}>open_in_new</span>
                  </span>
                )}
              </p>
              <p className="text-[20px] font-bold leading-snug line-clamp-2"
                style={{ color: featured ? '#FFFFFF' : 'var(--on-surf)' }}>
                {p.title}
              </p>
              {excerpt && (
                <p className="text-[14px] leading-relaxed line-clamp-2"
                  style={{ color: featured ? 'rgba(255,255,255,0.65)' : 'var(--on-surf-var)' }}>
                  {excerpt}
                </p>
              )}
              <span className="text-[14px] font-bold mt-1"
                style={{ color: featured ? '#FFFFFF' : 'var(--on-surf)' }}>
                {isExternal ? 'Ver →' : 'Leer →'}
              </span>
            </div>
          </div>
        );

        return isExternal
          ? <a key={p.ID} href={p.redirect_url} target="_blank" rel="noopener noreferrer" className="block">{cardBody}</a>
          : <Link key={p.ID} to={`/blog/${p.slug}`} className="block">{cardBody}</Link>;
      })}
    </div>
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
      <main className="min-h-screen bg-surf py-16">
        <div className="max-w-[1200px] mx-auto px-6"><PostDetail post={post} /></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surf">
      <PageHero icon="article" title="Blog" subtitle="Enseñanzas, reflexiones y mensajes para tu crecimiento espiritual." />
      <div className="max-w-[1200px] mx-auto px-6 py-16"><PostList posts={posts} /></div>
    </main>
  );
}
