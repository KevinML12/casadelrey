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

function PostDetail({ post }) {
  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink mb-8 transition-colors">
        <ArrowLeft size={14} /> Volver al Blog
      </Link>
      <p className="text-ink-3 text-xs flex items-center gap-1.5 mb-4">
        <Calendar size={12} />
        {new Date(post.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
      <h1 className="text-4xl font-black text-ink leading-tight mb-8">{post.title}</h1>
      <div className="prose prose-slate max-w-full text-ink-2 leading-relaxed"
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
        <Link key={p.id} to={`/blog/${p.slug}`}>
          <Card className="h-full flex flex-col hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex-1">
              <h3 className="font-bold text-ink mb-2 hover:text-blue transition-colors leading-snug">
                {p.title}
              </h3>
              <p className="text-ink-3 text-sm leading-relaxed line-clamp-3">
                {p.excerpt || p.content?.substring(0, 140)}
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-line flex items-center justify-between">
              <span className="text-xs text-ink-3 flex items-center gap-1">
                <Calendar size={11} />
                {new Date(p.created_at).toLocaleDateString('es-ES')}
              </span>
              <span className="text-xs font-medium text-blue">Leer →</span>
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
          const r = await apiClient.get('/blog/posts');
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
