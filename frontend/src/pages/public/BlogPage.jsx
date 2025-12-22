import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Mic } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import apiClient from '../../lib/apiClient';

const PostDetailView = ({ post }) => (
    <div>
        <Link to="/blog" className="text-primary hover:underline mb-8 inline-block">
            &larr; Volver al Blog
        </Link>
        <div className="flex justify-between items-start mb-4">
            <h1 className="text-4xl font-bold text-text-dark-church">{post.title}</h1>
            <Button variant="secondary" size="sm">
                <Mic size={16} className="mr-2" />
                Escuchar
            </Button>
        </div>
        <p className="text-text-muted mb-8">
            Publicado el {new Date(post.created_at).toLocaleDateString('es-ES')}
        </p>
        <div 
            className="prose dark:prose-invert lg:prose-xl max-w-full" 
            dangerouslySetInnerHTML={{ __html: post.content }} 
        />
    </div>
);

const PostListView = ({ posts }) => (
    <div>
        <h1 className="text-4xl font-bold text-text-dark-church mb-12">Blog</h1>
        {posts.length === 0 ? (
            <Card className="text-center py-12">
                <p className="text-text-muted">No hay publicaciones disponibles aún.</p>
            </Card>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map(post => (
                    <Card key={post.id} className="h-full flex flex-col">
                        <div className="flex-grow">
                            <Link to={`/blog/${post.slug}`}>
                                <h3 className="text-xl font-semibold mb-2 text-text-dark-church hover:text-primary transition-colors">
                                    {post.title}
                                </h3>
                            </Link>
                            <p className="text-text-muted mb-4 line-clamp-3">
                                {post.excerpt || post.content?.substring(0, 150)}
                            </p>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-border-church mt-auto">
                            <span className="text-sm text-text-muted">
                                {new Date(post.created_at).toLocaleDateString('es-ES')}
                            </span>
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); alert('Próximamente: Escucharás el audio de este artículo.'); }}>
                                <Mic size={16} />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        )}
    </div>
);


export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const { slug } = useParams();

  useEffect(() => {
    const fetchPostOrPosts = async () => {
        setLoading(true);
        try {
            if (slug) {
                const response = await apiClient.get(`/blog/posts/${slug}`);
                setPost(response.data);
            } else {
                const response = await apiClient.get('/blog/posts');
                setPosts(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching blog data:', error);
        } finally {
            setLoading(false);
        }
    };

    fetchPostOrPosts();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-caoba"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bg-cream py-12">
      <div className="container mx-auto px-4">
        {slug && post ? <PostDetailView post={post} /> : <PostListView posts={posts} />}
      </div>
    </main>
  );
}
