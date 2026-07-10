// ============================================================
//  BlogPage — orquestador delgado. Todo el contenido sale de la API
//  (GET /blog/, GET /blog/:slug); si falla, estado vacío/real, NUNCA
//  posts de mentira (el MOCK_POSTS_FALLBACK anterior mostraba
//  contenido inventado como si fuera real — se quitó).
//  Componentes: BlogHero (encabezado) + PostCollage (listado en
//  collage) + ArticleReader (lectura inmersiva, ruta propia) +
//  TTSPlayer (lector con IA, usado dentro de ArticleReader).
// ============================================================
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import ParallaxImg from '../../components/ui/ParallaxImg';
import BlogHero from '../../components/blog/BlogHero';
import PostCollage from '../../components/blog/PostCollage';
import ArticleReader from '../../components/blog/ArticleReader';
import { useSitePhoto } from '../../lib/feed';

function Loader() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
    </div>
  );
}

export default function BlogPage() {
  const heroImg = useSitePhoto('hero_blog', '/images/bg-ensenanzas.jpg');
  const [posts, setPosts] = useState([]);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { slug } = useParams();

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
          <p className="font-bold text-white/50" style={{ fontSize: 'clamp(24px,4vw,36px)' }}>Post no encontrado.</p>
          <Link to="/blog" className="text-white/70 hover:text-white text-[15px] font-semibold">Volver al blog</Link>
        </main>
      );
    }
    return <ArticleReader post={post} />;
  }

  return (
    <main className="relative bg-bg w-full min-h-screen overflow-hidden">
      {/* Hero de fondo presente en toda la página (administrable desde
          /admin/site-photos, slot "hero_blog"; fallback local si no hay). */}
      <ParallaxImg src={heroImg} alt="" className="opacity-45" />
      <div className="absolute inset-0 bg-gradient-to-b from-bg/75 via-bg/55 to-bg pointer-events-none" />

      <div className="relative z-10">
        <BlogHero />
        <section className="max-w-6xl mx-auto px-6 pt-6 pb-28">
          <PostCollage posts={posts} />
        </section>
      </div>
    </main>
  );
}
