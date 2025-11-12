import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import EventCard from './EventCard';

const NewsSection = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/events?limit=2');
        
        if (!response.ok) {
          throw new Error('Error al cargar los eventos');
        }
        
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Skeleton Loader Component
  const SkeletonCard = () => (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="h-48 bg-gray-200 animate-pulse"></div>
      <div className="p-6 space-y-3">
        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
      </div>
    </div>
  );

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Noticias y Eventos
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Mantente informado sobre las actividades y eventos de nuestra comunidad
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-red-600 mb-8"
          >
            {error}
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <EventCard event={event} />
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
