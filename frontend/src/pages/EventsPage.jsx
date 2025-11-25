import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { CalendarIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar.css';

const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const fetchEvents = async () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const response = await fetch(`${apiUrl}/api/events`);
  
  if (!response.ok) {
    throw new Error('Error al cargar los eventos');
  }
  
  const data = await response.json();
  
  // Transform backend events to Calendar format
  const transformedEvents = data.map(event => ({
    id: event.id || event.ID,
    title: event.title || event.Title,
    start: new Date(event.start_time || event.StartTime),
    end: new Date(event.end_time || event.EndTime),
    description: event.description || event.Description,
    allDay: false
  }));

  // Sort events by start date (ascending - próximos primero)
  return transformedEvents.sort((a, b) => a.start - b.start);
};

const EventsPage = () => {
  const { data: events = [], isLoading, isError, error } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: fetchEvents,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1
  });

  return (
    <div className="w-full overflow-x-hidden">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-white dark:bg-gray-950 transition-colors py-32 pt-40">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <CalendarIcon className="w-20 h-20 text-accent-blue mx-auto mb-8" />
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-display font-bold mb-8 text-dark-text dark:text-white tracking-tight transition-colors">
              Calendario de Eventos
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-normal text-dark-text/70 dark:text-gray-400 max-w-4xl mx-auto transition-colors leading-relaxed">
              Descubre todas las actividades y eventos que tenemos preparados para ti y tu familia
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200/50 dark:bg-gray-800/50"></div>
      </section>

      {/* Calendario Interactivo */}
      <section className="py-16 sm:py-24 bg-white dark:bg-gray-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800/50 p-8 rounded-xl transition-colors"
            >
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 w-1/4"></div>
                <div className="h-96 bg-gray-200 dark:bg-gray-700"></div>
              </div>
            </motion.div>
          ) : (
            <>
              {isError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-8 p-6 bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 rounded-lg text-red-700 dark:text-red-400 text-center font-semibold transition-colors"
                >
                  {error?.message || 'Error al cargar los eventos. Por favor, intenta de nuevo más tarde.'}
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800/50 p-4 md:p-8 mb-12 rounded-xl transition-colors"
              >
                <div style={{ height: '700px' }}>
                  <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    culture="es"
                    messages={{
                      next: 'Siguiente',
                      previous: 'Anterior',
                      today: 'Hoy',
                      month: 'Mes',
                      week: 'Semana',
                      day: 'Día',
                      agenda: 'Agenda',
                      date: 'Fecha',
                      time: 'Hora',
                      event: 'Evento',
                      noEventsInRange: 'No hay eventos en este rango',
                      showMore: (total) => `+ Ver más (${total})`
                    }}
                    views={['month', 'week', 'day', 'agenda']}
                    defaultView="month"
                    popup
                    selectable
                    style={{ height: '100%' }}
                  />
                </div>
              </motion.div>

              {/* Lista de Próximos 5 Eventos */}
              {events.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className="mb-12 pb-6 border-b border-gray-200/50 dark:border-gray-800/50">
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-dark-text dark:text-white text-center tracking-tight transition-colors">
                      Próximos 5 Eventos
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {events.slice(0, 5).map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800/50 rounded-xl overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                      >
                        <div className="p-8">
                          <div className="flex items-start justify-between mb-6">
                            <h3 className="text-xl font-display font-bold text-dark-text dark:text-white flex-1 tracking-tight transition-colors">
                              {event.title}
                            </h3>
                            <div className="bg-accent-blue/10 text-accent-blue px-3 py-1.5 text-xs font-semibold uppercase tracking-widest rounded-lg ml-2 flex-shrink-0">
                              Próximo
                            </div>
                          </div>
                          
                          <div className="space-y-3 mb-6">
                            <div className="flex items-start text-sm font-normal text-dark-text/70 dark:text-gray-400 gap-3">
                              <CalendarIcon className="w-5 h-5 flex-shrink-0 text-accent-blue mt-0.5" />
                              <span>
                                {format(event.start, "d 'de' MMMM, yyyy", { locale: es })}
                              </span>
                            </div>
                            <div className="flex items-start text-sm font-normal text-dark-text/70 dark:text-gray-400 gap-3">
                              <ClockIcon className="w-5 h-5 flex-shrink-0 text-accent-blue mt-0.5" />
                              <span>
                                {format(event.start, 'h:mm a', { locale: es })}
                                {event.end && ` - ${format(event.end, 'h:mm a', { locale: es })}`}
                              </span>
                            </div>
                          </div>
                          
                          {event.description && (
                            <p className="text-sm font-normal text-dark-text/70 dark:text-gray-400 mb-6 line-clamp-3 transition-colors leading-relaxed">
                              {event.description}
                            </p>
                          )}
                          
                          <Link
                            to={`/eventos/${event.id}`}
                            className="block w-full bg-accent-blue text-white py-2.5 px-4 hover:bg-blue-700 transition-all font-semibold text-xs text-center uppercase tracking-widest rounded-lg"
                          >
                            Más Información
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Información Adicional */}
      <section className="py-16 bg-white dark:bg-gray-950 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mb-12 pb-6 border-b border-gray-200/50 dark:border-gray-800/50">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-dark-text dark:text-white tracking-tight transition-colors">
                Tipos de Eventos
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {[
                {
                  title: 'Cultos',
                  description: 'Domingos y miércoles para adorar juntos'
                },
                {
                  title: 'Conferencias',
                  description: 'Eventos especiales con invitados'
                },
                {
                  title: 'Grupos',
                  description: 'Grupos pequeños para crecer en comunidad'
                }
              ].map((tipo, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-900 p-8 border-l-2 border-accent-blue rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                >
                  <h3 className="font-display font-bold text-dark-text dark:text-white mb-3 text-lg tracking-tight transition-colors">{tipo.title}</h3>
                  <p className="text-sm font-normal text-dark-text/70 dark:text-gray-400 transition-colors">{tipo.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-gradient-to-br from-accent-blue to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl md:text-6xl font-display font-bold mb-8 tracking-tight">
              ¿Te gustaría asistir a algún evento?
            </h2>
            <p className="text-lg md:text-xl mb-10 font-normal tracking-normal leading-relaxed">
              ¡Eres bienvenido! No necesitas reservación, solo tu disposición para conocer a Dios
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a
                href="/"
                className="inline-block bg-white text-dark-text font-semibold py-3 px-10 hover:bg-gray-100 transition-all text-sm uppercase tracking-widest rounded-lg"
              >
                Volver al Inicio
              </a>
              <a
                href="/historia"
                className="inline-block bg-white/20 border border-white/50 text-white font-semibold py-3 px-10 hover:bg-white/30 transition-all text-sm uppercase tracking-widest rounded-lg"
              >
                Conocer Nuestra Historia
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default EventsPage;
