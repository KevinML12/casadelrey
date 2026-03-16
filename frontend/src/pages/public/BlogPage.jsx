import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import Card from '../../components/ui/Card';
import PageHero from '../../components/layout/PageHero';
import apiClient from '../../lib/apiClient';

function Loader() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-blue animate-spin" />
    </div>
  );
}

// ── Detalle del post ──────────────────────────────────────────────────────────
function PostDetail({ post }) {
  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink mb-8 transition-colors">
        <ArrowLeft size={14} /> Volver al Blog
      </Link>

      {/* Imagen de portada */}
      {post.cover_image && (
        <img
          src={post.cover_image}
          alt={post.title}
          className="w-full max-h-80 object-cover rounded-xl mb-8 border border-line"
        />
      )}

      <p className="text-ink-3 text-xs flex items-center gap-1.5 mb-4">
        <Calendar size={12} />
        {post.CreatedAt ? new Date(post.CreatedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
      </p>
      <h1 className="text-4xl font-black text-ink leading-tight mb-8">{post.title}</h1>

      <div className="prose max-w-full text-ink-2 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: post.content }} />
    </div>
  );
}

function PostList({ posts }) {
  if (posts.length === 0) {
    return (
      <Card className="text-center py-16">
        <p className="text-ink-2">No hay publicaciones disponibles aún.</p>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map(p => (
        <Link key={p.ID} to={`/blog/${p.slug}`}>
          <Card className="h-full flex flex-col hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden p-0">
            {/* Imagen de portada de la tarjeta */}
            {p.cover_image ? (
              <img src={p.cover_image} alt={p.title} className="w-full h-44 object-cover" />
            ) : (
              <div className="w-full h-44 bg-navy-gradient flex items-center justify-center">
                <span className="text-gold font-black text-3xl opacity-30">CR</span>
              </div>
            )}
            <div className="flex-1 flex flex-col p-5">
              <h3 className="font-bold text-ink mb-2 hover:text-blue transition-colors leading-snug">
                {p.title}
              </h3>
              <p className="text-ink-3 text-sm leading-relaxed line-clamp-3 flex-1">
                {p.excerpt || p.content?.replace(/<[^>]+>/g, '').substring(0, 140)}
              </p>
              <div className="pt-4 mt-4 border-t border-line flex items-center justify-between">
                <span className="text-xs text-ink-3 flex items-center gap-1">
                  <Calendar size={11} />
                  {p.CreatedAt ? new Date(p.CreatedAt).toLocaleDateString('es-ES') : ''}
                </span>
                <span className="text-xs font-medium text-blue">Leer →</span>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default function BlogPage() {
  const [posts,   setPosts]   = useState([]);
  const [post,    setPost]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const { slug } = useParams();

  useEffect(() => {
    setLoading(true);
    setError(false);
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
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) return <Loader />;

  if (error) return (
    <main className="min-h-screen bg-bg">
      <PageHero title="Blog" subtitle="Enseñanzas, reflexiones y mensajes para tu crecimiento espiritual." />
      <div className="container mx-auto px-6 py-24 text-center">
        <p className="text-ink-3 text-sm">No se pudo conectar con el servidor. Asegúrate de que el backend está corriendo.</p>
      </div>
    </main>
  );

  if (slug && post) {
    return (
      <main className="min-h-screen bg-bg py-16">
        <div className="container mx-auto px-6"><PostDetail post={post} /></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg">
      <PageHero title="Blog" subtitle="Enseñanzas, reflexiones y mensajes para tu crecimiento espiritual." />
      <div className="container mx-auto px-6 py-16"><PostList posts={posts} /></div>
    </main>
  );
}
