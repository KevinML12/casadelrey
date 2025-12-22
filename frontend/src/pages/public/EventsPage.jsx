import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import apiClient from '../../lib/apiClient';
import { Calendar, MapPin } from 'lucide-react';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await apiClient.get('/events');
        setEvents(response.data || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

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
        <h1 className="text-4xl font-bold text-text-dark-church mb-12">Eventos</h1>

        {events.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-text-muted">No hay eventos disponibles aún.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map(event => (
              <Link key={event.id} to={`/events/${event.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold mb-3 text-text-dark-church">
                      {event.title}
                    </h3>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-text-muted">
                      <Calendar size={18} className="text-accent-gold" />
                      <span className="text-sm">
                        {new Date(event.date).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted">
                      <MapPin size={18} className="text-accent-gold" />
                      <span className="text-sm">{event.location}</span>
                    </div>
                  </div>

                  <p className="text-text-muted text-sm line-clamp-2">
                    {event.description}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
