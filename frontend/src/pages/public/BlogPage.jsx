// ============================================================
//  BlogPage — orquestador delgado. Todo el contenido sale de la API
//  (GET /blog/, GET /blog/:slug); si falla, estado vacío/real, NUNCA
//  posts de mentira (el MOCK_POSTS_FALLBACK anterior mostraba
//  contenido inventado como si fuera real — se quitó).
//  Componentes: BlogHero (encabezado) + PostCollage (listado en
//  collage) + ArticleReader (lectura inmersiva, ruta propia) +
//  TTSPlayer (lector con IA, usado dentro de ArticleReader).
// ============================================================
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import BlogHero from '../../components/blog/BlogHero';
import PostCollage from '../../components/blog/PostCollage';
import ArticleReader from '../../components/blog/ArticleReader';
import CollectionStatus from '../../components/ui/CollectionStatus';
import SectionBg from '../../components/ui/SectionBg';
import { useSitePhoto } from '../../lib/feed';

// Mismo fallback de categoría que PostCollage.jsx (p.category vacío no
// debe ser un filtro fantasma "undefined").
function categoryOf(p) {
  return p.category || (p.redirect_url ? 'Red social' : 'Enseñanza');
}

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [feedError, setFeedError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [activeCategory, setActiveCategory] = useState(null);
  const { slug } = useParams();
  const photo = useSitePhoto('hero_blog', '/images/backgrounds/comunidad-templo.webp');

  // Categorías reales derivadas de los posts que existen -- nunca una
  // lista fija: si no hay posts de "Red social" hoy, ese filtro no
  // aparece (nada estático, ver regla del proyecto).
  const categories = useMemo(
    () => [...new Set(posts.map(categoryOf))],
    [posts]
  );
  const filteredPosts = activeCategory
    ? posts.filter(p => categoryOf(p) === activeCategory)
    : posts;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    setFeedError(false);
    (async () => {
      try {
        if (slug) {
          const r = await apiClient.get(`/blog/${slug}`);
          if (active) setPost(r.data);
        } else {
          const r = await apiClient.get('/blog/');
          if (active) setPosts(r.data || []);
        }
      } catch (err) {
        if (!active) return;
        if (slug && err.response?.status === 404) setNotFound(true);
        else setFeedError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [slug, attempt]);

  if (slug) {
    if (loading || feedError) return (
      <main className="min-h-screen pt-40 pb-24 px-6 max-w-6xl mx-auto">
        <CollectionStatus loading={loading} label="el mensaje" onRetry={() => setAttempt(v => v + 1)} />
      </main>
    );
    if (notFound || !post) {
      return (
        <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-d3 text-white/50">Post no encontrado.</p>
          <Link to="/blog" className="text-white/70 hover:text-white text-15 font-semibold">Volver al blog</Link>
        </main>
      );
    }
    return <ArticleReader key={post.slug || post.ID} post={post} />;
  }

  const header = <BlogHero categories={categories} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />;
  return (
    <main className="relative w-full min-h-screen overflow-hidden">
      {loading || feedError ? <section className="relative isolate min-h-[100svh] pt-32 sm:pt-36 pb-16 px-6 md:px-8">
        <SectionBg src={photo} opacity="opacity-100" scrimClassName="bg-bg/60" />
        <div className="relative z-10 max-w-6xl mx-auto">{header}<div className="mt-16 max-w-xl"><CollectionStatus loading={loading} label="los mensajes" onRetry={() => setAttempt(v => v + 1)} /></div></div>
      </section> : <PostCollage posts={filteredPosts} header={header} fallbackImage={photo} />}
    </main>
  );
}
