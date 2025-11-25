import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarIcon, MapPinIcon, ClockIcon, ArrowLeftIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Helmet } from 'react-helmet-async';

const fetchEvent = async (id) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const response = await fetch(`${apiUrl}/api/events/${id}`);
  
  if (!response.ok) {
    throw new Error('No se pudo cargar el evento');
  }
  
  return response.json();
};

const EventDetailPage = () => {
  const { id } = useParams();

  const { data: event, isLoading, isError, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () => fetchEvent(id),
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1
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
              <p className="text-red-700 mb-4">{error?.message || 'Error al cargar el evento'}</p>
              <Link to="/eventos" className="text-blue-600 hover:text-blue-700 font-medium">
                Volver a Eventos
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const startTime = event?.start_time || event?.StartTime;
  const endTime = event?.end_time || event?.EndTime;
  const location = event?.location || event?.Location || 'Ubicación por confirmar';
  const description = event?.description || event?.Description || '';
  const title = event?.title || event?.Title || 'Evento';

  // Generate Google Maps search URL
  const mapsUrl = location && location !== 'Ubicación por confirmar' 
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
    : null;

  return (
    <div className="w-full overflow-x-hidden">
      <Helmet>
        <title>{title} | Casa del Rey - Eventos</title>
        <meta name="description" content={description.substring(0, 160)} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description.substring(0, 160)} />
        <meta property="og:type" content="event" />
        {startTime && <meta property="event:start_time" content={startTime} />}
        {endTime && <meta property="event:end_time" content={endTime} />}
        {location && <meta property="event:location" content={location} />}
      </Helmet>

      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-16">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/eventos"
            className="inline-flex items-center gap-2 text-white hover:text-blue-100 font-medium mb-6 transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Volver a Eventos
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <CalendarIcon className="w-10 h-10" />
              <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-bold backdrop-blur-sm">
                Evento Próximo
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {title}
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Event Details */}
      <article className="py-12 sm:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Quick Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            {/* Fecha */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Fecha</h3>
                  {startTime && (
                    <p className="text-lg font-bold text-gray-900">
                      {format(new Date(startTime), "EEEE, d 'de' MMMM", { locale: es })}
                    </p>
                  )}
                  {startTime && (
                    <p className="text-sm text-gray-600">
                      {format(new Date(startTime), 'yyyy', { locale: es })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Horario */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-600 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Horario</h3>
                  {startTime && (
                    <p className="text-lg font-bold text-gray-900">
                      {format(new Date(startTime), 'h:mm a', { locale: es })}
                    </p>
                  )}
                  {endTime && (
                    <p className="text-sm text-gray-600">
                      hasta {format(new Date(endTime), 'h:mm a', { locale: es })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-600 rounded-lg">
                  <MapPinIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Ubicación</h3>
                  <p className="text-lg font-bold text-gray-900 line-clamp-2">
                    {location}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Description Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <InformationCircleIcon className="w-8 h-8 text-blue-600" />
              <h2 className="text-3xl font-display font-bold text-dark-text dark:text-white">Detalles del Evento</h2>
            </div>
            
            <div className="prose prose-lg max-w-none">
              <div 
                className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl p-8 border border-gray-200"
              >
                {description || 'Más información próximamente. Mantente atento a nuestras redes sociales para actualizaciones sobre este evento.'}
              </div>
            </div>
          </motion.div>

          {/* Map Section */}
          {mapsUrl && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-12"
            >
              <h2 className="text-3xl font-display font-bold text-dark-text dark:text-white mb-6">¿Cómo llegar?</h2>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-start gap-4 mb-4">
                  <MapPinIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{location}</h3>
                    <p className="text-gray-600 mb-4">
                      Haz clic en el botón para abrir la ubicación en Google Maps y obtener direcciones.
                    </p>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium shadow-lg hover:shadow-xl"
                    >
                      <MapPinIcon className="w-5 h-5" />
                      Ver en Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              ¿Te gustaría asistir?
            </h2>
            <p className="text-lg text-blue-100 mb-6 max-w-2xl mx-auto">
              Eres bienvenido a participar en este evento. No necesitas reservación previa, 
              solo tu disposición para compartir y crecer en comunidad.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={`https://wa.me/?text=¡Hola! Me interesa asistir al evento: ${title}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition shadow-lg"
              >
                Consultar por WhatsApp
              </a>
              <Link
                to="/eventos"
                className="inline-block bg-white text-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition shadow-lg"
              >
                Ver Más Eventos
              </Link>
            </div>
          </motion.div>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default EventDetailPage;
