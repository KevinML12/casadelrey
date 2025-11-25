import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card-shadcn';
import { PlayIcon } from '@heroicons/react/24/solid';

const YouTubeFeatured = () => {
  const { data: video, isLoading, isError } = useQuery({
    queryKey: ['youtube-latest'],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/youtube/latest`);
      
      if (!response.ok) {
        throw new Error('Error al cargar el video de YouTube');
      }
      
      return response.json();
    },
    staleTime: 1000 * 60 * 15, // 15 minutos
    retry: 2
  });

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-gray-200 rounded-lg animate-pulse"></div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (isError || !video) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Último Video</CardTitle>
            <CardDescription>Contenido no disponible</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">No se pudo cargar el video</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Construir embed URL desde video_id o usar embed_url directamente
  const embedUrl = video.embed_url || `https://www.youtube.com/embed/${video.video_id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-12"
    >
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white">
          <div className="flex items-center space-x-2">
            <PlayIcon className="w-6 h-6" />
            <CardTitle className="text-white">Último Video</CardTitle>
          </div>
          {video.title && (
            <CardDescription className="text-red-50">
              {video.title}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-6">
          <div className="aspect-video rounded-lg overflow-hidden shadow-md">
            <iframe
              src={embedUrl}
              title={video.title || 'Video de YouTube'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
          {video.description && (
            <p className="mt-4 text-gray-600 text-sm line-clamp-3">
              {video.description}
            </p>
          )}
          {video.published_at && (
            <p className="mt-2 text-xs text-gray-400">
              Publicado: {new Date(video.published_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default YouTubeFeatured;
