import { useEffect, useState } from 'react';
import PageHero from '../../components/layout/PageHero';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';

const fieldCls = 'w-full px-4 py-2.5 rounded border border-outline-var bg-transparent text-body-s text-on-surf placeholder:text-on-surf-var hover:border-on-surf-var focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all';

function RSVPModal({ event, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', attendee_count: 1, notes: '' });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.type === 'number' ? parseInt(e.target.value) : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error('Nombre y correo son obligatorios'); return; }
    setLoading(true);
    try {
      await apiClient.post(`/events/${event.ID}/rsvp`, form);
      toast.success('¡Registro confirmado! Te esperamos.');
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al registrar';
      toast.error(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surf rounded-[28px] w-full max-w-md p-6 shadow-elev-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-label-l text-pri font-semibold uppercase tracking-widest">Confirmar asistencia</p>
            <p className="text-body-s text-on-surf-var mt-0.5">{event.title}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-surf-high flex items-center justify-center hover:bg-outline-var transition-colors">
            <span className="ms text-on-surf-var" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-label-l text-on-surf-var mb-1">Nombre <span className="text-err">*</span></label>
              <input value={form.name} onChange={set('name')} className={fieldCls} placeholder="Tu nombre completo" required />
            </div>
            <div>
              <label className="block text-label-l text-on-surf-var mb-1">Correo <span className="text-err">*</span></label>
              <input type="email" value={form.email} onChange={set('email')} className={fieldCls} placeholder="tu@correo.com" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-label-l text-on-surf-var mb-1">Teléfono</label>
                <input value={form.phone} onChange={set('phone')} className={fieldCls} placeholder="+502 …" />
              </div>
              <div>
                <label className="block text-label-l text-on-surf-var mb-1">Asistentes</label>
                <input type="number" min={1} max={20} value={form.attendee_count} onChange={set('attendee_count')} className={fieldCls} />
              </div>
            </div>
            <div>
              <label className="block text-label-l text-on-surf-var mb-1">Notas</label>
              <textarea rows={2} value={form.notes} onChange={set('notes')} className={`${fieldCls} resize-none`} placeholder="¿Algo que debamos saber?" />
            </div>
          </div>
          <div className="flex gap-3 pt-2 border-t border-outline-var">
            <Button type="submit" variant="filled" disabled={loading} className="flex-1 justify-center">
              <span className="ms" style={{ fontSize: 16 }}>check_circle</span>
              {loading ? 'Registrando…' : 'Confirmar asistencia'}
            </Button>
            <Button type="button" variant="outlined" onClick={onClose}>Cancelar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
  const [rsvpEvent, setRsvpEvent] = useState(null);

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
            <p className="text-body-m text-on-surf-var">No se pudo conectar con el servidor.</p>
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
                  <div className="px-5 pb-5">
                    <Button variant="tonal" onClick={() => setRsvpEvent(ev)} className="w-full justify-center">
                      <span className="ms" style={{ fontSize: 16 }}>check_circle</span>
                      Confirmar asistencia
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {rsvpEvent && <RSVPModal event={rsvpEvent} onClose={() => setRsvpEvent(null)} />}
    </main>
  );
}
