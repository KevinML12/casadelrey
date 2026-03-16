import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
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

export default function EventsPage() {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    apiClient.get('/events/')
      .then(r => setEvents(r.data || []))
      .catch(err => { console.error(err); setError(true); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  if (error) return (
    <main className="min-h-screen bg-bg">
      <PageHero icon={Calendar} title="Eventos y Cultos" subtitle="Conéctate con nuestra comunidad en persona." />
      <div className="container mx-auto px-6 py-24 text-center">
        <p className="text-ink-3 text-sm">No se pudo conectar con el servidor. Asegúrate de que el backend está corriendo.</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-bg">
      <PageHero icon={Calendar} title="Eventos y Cultos" subtitle="Conéctate con nuestra comunidad en persona." />

      <div className="container mx-auto px-6 py-16">
        {events.length === 0 ? (
          <div className="text-center py-24">
            <Calendar size={40} className="mx-auto text-ink-3 mb-4" />
            <h3 className="text-xl font-bold text-ink mb-2">Sin eventos próximos</h3>
            <p className="text-ink-2 text-sm">Pronto publicaremos nuevos eventos. ¡Vuelve pronto!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map(ev => (
              <Card key={ev.ID} className="hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200">
                <h3 className="font-bold text-ink mb-3 leading-snug">{ev.title}</h3>
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-2 text-ink-2 text-sm">
                    <Calendar size={13} className="text-gold shrink-0" />
                    {ev.date ? new Date(ev.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                  </div>
                  {ev.location && (
                    <div className="flex items-center gap-2 text-ink-2 text-sm">
                      <MapPin size={13} className="text-gold shrink-0" />
                      {ev.location}
                    </div>
                  )}
                </div>
                {ev.description && (
                  <p className="text-ink-3 text-sm line-clamp-2 leading-relaxed">{ev.description}</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
