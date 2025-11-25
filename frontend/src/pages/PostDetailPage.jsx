import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarIcon, UserIcon, ClockIcon, ArrowLeftIcon, TagIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Helmet } from 'react-helmet-async';

const fetchPost = async (slug) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const response = await fetch(`${apiUrl}/api/blog/${slug}`);
  
  if (!response.ok) {
    throw new Error('No se pudo cargar el post');
  }
  
  return response.json();
};

const fetchRelatedPosts = async (currentSlug) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const response = await fetch(`${apiUrl}/api/blog?status=published&limit=3`);
  
  if (!response.ok) {
    throw new Error('No se pudieron cargar los posts relacionados');
  }
  
  const data = await response.json();
  // Filter out current post
  return data.filter(post => post.slug !== currentSlug).slice(0, 3);
};

const PostDetailPage = () => {
  const { slug } = useParams();

  const { data: post, isLoading, isError, error } = useQuery({
    queryKey: ['post', slug],
    queryFn: () => fetchPost(slug),
    staleTime: 1000 * 60 * 10, // 10 minutos
    retry: 1
  });

  const { data: relatedPosts = [] } = useQuery({
    queryKey: ['related-posts', slug],
    queryFn: () => fetchRelatedPosts(slug),
    staleTime: 1000 * 60 * 10,
    enabled: !!slug
  });

  if (isLoading) {
    return (
      <div className="w-full overflow-x-hidden">
        <Header />
        <div className="min-h-screen bg-gray-50 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-8">
              <div className="h-12 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full overflow-x-hidden">
        <Header />
        <div className="min-h-screen bg-gray-50 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-700 mb-4">{error?.message || 'Error al cargar el post'}</p>
              <Link to="/blog" className="text-blue-600 hover:text-blue-700 font-medium">
                Volver al Blog
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const postDate = post?.created_at || post?.CreatedAt;
  const authorName = post?.author?.name || post?.Author?.name || 'Autor Desconocido';

  return (
    <div className="w-full overflow-x-hidden">
      <Helmet>
        <title>{post.title} | Casa del Rey</title>
        <meta name="description" content={post.content?.substring(0, 160)} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.content?.substring(0, 160)} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={postDate} />
        <meta property="article:author" content={authorName} />
      </Helmet>

      <Header />

      {/* Breadcrumb */}
      <section className="bg-gray-100 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-blue-600 transition">Inicio</Link>
            <span>/</span>
            <Link to="/blog" className="hover:text-blue-600 transition">Blog</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate">{post.title}</span>
          </nav>
        </div>
      </section>

      {/* Post Content */}
      <article className="py-12 sm:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-8 transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Volver al Blog
          </Link>

          {/* Post Header */}
          <motion.header
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-gray-600 border-l-4 border-blue-600 pl-4 py-2 bg-blue-50">
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-blue-600" />
                <span className="font-medium">{authorName}</span>
              </div>
              
              {postDate && (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
                  <time dateTime={postDate}>
                    {format(new Date(postDate), "d 'de' MMMM, yyyy", { locale: es })}
                  </time>
                </div>
              )}

              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-blue-600" />
                <span>{Math.ceil(post.content?.length / 1000)} min de lectura</span>
              </div>
            </div>
          </motion.header>

          {/* Featured Image (if exists) */}
          {(post.image_url || post.imageUrl) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8 rounded-xl overflow-hidden shadow-lg"
            >
              <img
                src={post.image_url || post.imageUrl}
                alt={post.title}
                className="w-full h-auto"
              />
            </motion.div>
          )}

          {/* Post Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="prose prose-lg prose-blue max-w-none"
          >
            <div 
              className="text-gray-700 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </motion.div>

          {/* Tags Section */}
          {post.tags && post.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 pt-8 border-t border-gray-200"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <TagIcon className="w-5 h-5 text-gray-400" />
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Share Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 pt-8 border-t border-gray-200"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Compartir este artículo</h3>
            <div className="flex gap-4">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Facebook
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${window.location.href}&text=${post.title}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition"
              >
                Twitter
              </a>
              <a
                href={`https://wa.me/?text=${post.title} ${window.location.href}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                WhatsApp
              </a>
            </div>
          </motion.div>
        </div>
      </article>

      {/* Related Posts Section */}
      {relatedPosts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold text-gray-900 mb-8 text-center"
            >
              Posts Relacionados
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost, index) => (
                <motion.article
                  key={relatedPost.id || relatedPost.slug}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition duration-300"
                >
                  {(relatedPost.image_url || relatedPost.imageUrl) && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={relatedPost.image_url || relatedPost.imageUrl}
                        alt={relatedPost.title}
                        className="w-full h-full object-cover transform hover:scale-110 transition duration-500"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {relatedPost.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {relatedPost.content?.substring(0, 150)}...
                    </p>
                    
                    <Link
                      to={`/blog/${relatedPost.slug}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition"
                    >
                      Leer más
                      <ArrowLeftIcon className="w-4 h-4 ml-2 rotate-180" />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default PostDetailPage;
