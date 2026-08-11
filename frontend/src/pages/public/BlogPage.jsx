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

// Mismo fallback de categoría que PostCollage.jsx (p.category vacío no
// debe ser un filtro fantasma "undefined").
function categoryOf(p) {
  return p.category || (p.redirect_url ? 'Red social' : 'Enseñanza');
}

function Loader() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
    </div>
  );
}

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const { slug } = useParams();

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
    setLoading(true);
    setNotFound(false);
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
        if (slug) setNotFound(true);
        else setPosts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) return <Loader />;

  if (slug) {
    if (notFound || !post) {
      return (
        <main className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-d3 text-white/50">Post no encontrado.</p>
          <Link to="/blog" className="text-white/70 hover:text-white text-15 font-semibold">Volver al blog</Link>
        </main>
      );
    }
    return <ArticleReader post={post} />;
  }

  return (
    <main className="relative bg-bg w-full min-h-screen overflow-hidden">
      <div className="relative z-10">
        {/* Foto de fondo (admin-editable, slot "hero_blog") ahora vive
            DENTRO de BlogHero -> PageHero, acotada al hero -- ya no se
            extiende como capa de página completa detrás del listado. */}
        <BlogHero />
        <section className="max-w-6xl mx-auto px-6 pt-6 pb-28">
          {categories.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className={`px-4 py-2 rounded-full text-13 font-semibold transition-colors ${
                  activeCategory === null ? 'bg-white text-bg' : 'bg-white/10 border border-white/15 text-white/70 hover:text-white hover:bg-white/15'
                }`}
              >
                Todo
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-13 font-semibold transition-colors ${
                    activeCategory === cat ? 'bg-white text-bg' : 'bg-white/10 border border-white/15 text-white/70 hover:text-white hover:bg-white/15'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
          <PostCollage posts={filteredPosts} />
        </section>
      </div>
    </main>
  );
}
