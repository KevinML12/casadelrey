import { useEffect, useState } from 'react';
import PageHero from '../../components/layout/PageHero';
import apiClient from '../../lib/apiClient';

function Loader() {
  return (
    <div className="min-h-screen bg-surf flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
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

  return (
    <main className="min-h-screen bg-surf">
      <PageHero icon="calendar_month" title="Eventos y Cultos" subtitle="Conéctate con nuestra comunidad en persona." />

      <div className="max-w-[1200px] mx-auto px-6 py-16">
        {error ? (
          <div className="text-center py-24">
            <p className="text-body-m text-on-surf-var">No se pudo conectar con el servidor. Asegúrate de que el backend está corriendo.</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-24">
            <div className="leading-icon mx-auto mb-4" style={{ width: 56, height: 56 }}>
              <span className="ms" style={{ fontSize: 32 }}>calendar_month</span>
            </div>
            <h3 className="text-title-l text-on-surf font-bold mb-2">Sin eventos próximos</h3>
            <p className="text-body-m text-on-surf-var">Pronto publicaremos nuevos eventos. ¡Vuelve pronto!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map(ev => {
              const dateStr = ev.date
                ? new Date(ev.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                : '';
              const dayNum = ev.date ? new Date(ev.date + 'T12:00:00').getDate() : '';
              const monthStr = ev.date
                ? new Date(ev.date + 'T12:00:00').toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()
                : '';

              return (
                <div key={ev.ID} className="rounded-xl border border-outline-var bg-surf-low hover:shadow-elev-1 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
                  {/* Date avatar */}
                  <div className="flex items-center gap-4 p-5 border-b border-outline-var">
                    <div className="w-14 h-14 rounded-xl bg-pri-con flex flex-col items-center justify-center shrink-0">
                      <span className="text-headline-s text-on-pri-con font-black leading-none">{dayNum}</span>
                      <span className="text-label-s text-on-pri-con font-semibold">{monthStr}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-title-s text-on-surf font-bold leading-snug truncate">{ev.title}</h3>
                      <p className="text-label-s text-on-surf-var mt-0.5">{dateStr}</p>
                    </div>
                  </div>
                  <div className="p-5 flex-1 space-y-2">
                    {ev.location && (
                      <div className="flex items-center gap-2 text-on-surf-var">
                        <span className="ms shrink-0" style={{ fontSize: 16 }}>location_on</span>
                        <span className="text-body-s">{ev.location}</span>
                      </div>
                    )}
                    {ev.description && (
                      <p className="text-body-s text-on-surf-var line-clamp-2 leading-relaxed">{ev.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
