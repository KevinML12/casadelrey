import { motion } from 'framer-motion';

const PostCard = ({ post }) => {
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  // Usar imageUrl de la base de datos, con fallback a image por compatibilidad
  const imageUrl = post.imageUrl || post.image_url || post.image;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800/50 hover:border-accent-blue/50 dark:hover:border-accent-blue/50 rounded-xl transition-all duration-300 overflow-hidden group hover:shadow-md">
      {imageUrl && (
        <div className="aspect-[16/9] overflow-hidden">
          <img
            src={imageUrl}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-8">
        <p className="text-xs font-semibold text-dark-text/60 dark:text-gray-400 mb-3 uppercase tracking-widest transition-colors">
          {formatDate(post.date || post.createdAt)}
        </p>
        <h3 className="text-2xl font-display font-bold text-dark-text dark:text-white mb-4 line-clamp-2 tracking-tight transition-colors">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-sm font-normal text-dark-text/70 dark:text-gray-400 mb-6 line-clamp-3 leading-relaxed transition-colors">
            {post.excerpt}
          </p>
        )}
        <div className="pt-4 border-t border-gray-200/50 dark:border-gray-800/50 transition-colors">
          <a
            href={`/blog/${post.slug}`}
            className="text-accent-blue hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-xs uppercase tracking-widest inline-flex items-center group-hover:gap-2 transition-all"
          >
            Leer más
            <svg
              className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
