import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Input, { Textarea } from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const EMPTY = { title: '', date: '', location: '', description: '' };

function EventForm({ onSave, onCancel, loading }) {
  const [form, setForm] = useState(EMPTY);
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="bg-surf-low border border-outline-var rounded-xl p-5 mb-6 animate-fade-in">
      <h3 className="text-title-s text-on-surf font-semibold mb-4">Nuevo Evento</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Título" value={form.title} onChange={set('title')} required />
          <Input label="Fecha" type="date" value={form.date} onChange={set('date')} required />
        </div>
        <Input label="Ubicación" value={form.location} onChange={set('location')} placeholder="Ej: Salón Principal" />
        <Textarea label="Descripción" rows={3} value={form.description} onChange={set('description')} />
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="filled" onClick={() => onSave(form)} disabled={loading || !form.title}>
            <span className="ms" style={{ fontSize: 14 }}>check</span>
            {loading ? 'Guardando…' : 'Guardar'}
          </Button>
          <Button size="sm" variant="text" onClick={onCancel}>
            <span className="ms" style={{ fontSize: 14 }}>close</span>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-6 h-6 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
  </div>
);

export default function AdminEvents() {
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = () =>
    apiClient.get('/events/')
      .then(r => setEvents(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      await apiClient.post('/admin/events/', form);
      toast.success('Evento creado');
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este evento?')) return;
    try {
      await apiClient.delete(`/admin/events/${id}`);
      toast.success('Evento eliminado');
      setEvents(prev => prev.filter(e => e.ID !== id));
    } catch { toast.error('Error al eliminar'); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-headline-s text-on-surf font-black">Eventos</h1>
        {!showForm && (
          <Button size="sm" variant="filled" onClick={() => setShowForm(true)}>
            <span className="ms" style={{ fontSize: 14 }}>add</span>
            Nuevo evento
          </Button>
        )}
      </div>

      {showForm && (
        <EventForm onSave={handleSave} onCancel={() => setShowForm(false)} loading={saving} />
      )}

      {loading ? <Spinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.length === 0 ? (
            <div className="md:col-span-2 text-center py-16 text-on-surf-var text-body-s bg-surf-low border border-outline-var rounded-xl">
              No hay eventos. Crea el primero con el botón de arriba.
            </div>
          ) : events.map(ev => (
            <div key={ev.ID}
              className="bg-surf-low border border-outline-var rounded-xl p-5 hover:shadow-elev-1 transition-all group">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-title-s text-on-surf font-semibold">{ev.title}</h3>
                <button
                  onClick={() => handleDelete(ev.ID)}
                  className="opacity-0 group-hover:opacity-100 text-on-surf-var hover:text-err transition-all p-1"
                >
                  <span className="ms" style={{ fontSize: 16 }}>delete</span>
                </button>
              </div>
              <div className="space-y-1.5">
                {ev.date && (
                  <div className="flex items-center gap-2 text-on-surf-var">
                    <span className="ms text-ter shrink-0" style={{ fontSize: 14 }}>calendar_month</span>
                    <span className="text-body-s">
                      {new Date(ev.date + 'T12:00:00').toLocaleDateString('es-ES', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                {ev.location && (
                  <div className="flex items-center gap-2 text-on-surf-var">
                    <span className="ms text-ter shrink-0" style={{ fontSize: 14 }}>location_on</span>
                    <span className="text-body-s">{ev.location}</span>
                  </div>
                )}
                {ev.description && (
                  <p className="text-body-s text-on-surf-var mt-2 line-clamp-2 leading-relaxed">{ev.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
