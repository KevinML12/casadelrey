import { motion } from 'framer-motion';

const YouTubeCard = ({ video }) => {
  const getYouTubeThumbnail = (url) => {
    // Extract video ID from YouTube URL
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url?.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    
    return video.thumbnail || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=600&h=400&fit=crop';
  };

  const handleClick = () => {
    if (video.url) {
      window.open(video.url, '_blank');
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="group cursor-pointer bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all"
    >
      <div className="relative h-48 overflow-hidden bg-gray-200">
        <img
          src={getYouTubeThumbnail(video.url)}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg
              className="w-8 h-8 text-white ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            {video.duration}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {video.title}
        </h3>
        {video.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
            {video.description}
          </p>
        )}
        {video.date && (
          <p className="text-xs text-gray-500">
            {new Date(video.date).toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        )}
      </div>
    </div>
  );
};

export default YouTubeCard;
