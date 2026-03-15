import { useEffect, useState } from 'react';
import { Plus, Calendar, MapPin, X, Check } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Input, { Textarea } from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const EMPTY = { title: '', date: '', location: '', description: '' };

function EventForm({ onSave, onCancel, loading }) {
  const [form, setForm] = useState(EMPTY);
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="bg-card border border-line rounded-xl p-5 mb-6 animate-fade-in">
      <h3 className="font-bold text-ink mb-4">Nuevo Evento</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Título" value={form.title} onChange={set('title')} required />
          <Input label="Fecha" type="date" value={form.date} onChange={set('date')} required />
        </div>
        <Input label="Ubicación" value={form.location} onChange={set('location')} />
        <Textarea label="Descripción" rows={3} value={form.description} onChange={set('description')} />
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={() => onSave(form)} disabled={loading}>
            <Check size={14} /> {loading ? 'Guardando…' : 'Guardar'}
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X size={14} /> Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminEvents() {
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = () => apiClient.get('/events').then(r => setEvents(r.data || [])).catch(console.error).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      await apiClient.post('/admin/events', form);
      toast.success('Evento creado');
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-ink">Eventos</h1>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus size={14} /> Nuevo evento
          </Button>
        )}
      </div>

      {showForm && <EventForm onSave={handleSave} onCancel={() => setShowForm(false)} loading={saving} />}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-line border-t-blue animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.length === 0 ? (
            <div className="md:col-span-2 text-center py-16 text-ink-3 text-sm bg-card border border-line rounded-xl">
              No hay eventos aún.
            </div>
          ) : events.map(ev => (
            <div key={ev.id} className="bg-card border border-line rounded-xl p-5 hover:border-blue/20 transition-colors">
              <h3 className="font-bold text-ink mb-2">{ev.title}</h3>
              <div className="space-y-1 text-sm text-ink-3">
                {ev.date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-gold" />
                    {new Date(ev.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                )}
                {ev.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-gold" />
                    {ev.location}
                  </div>
                )}
              </div>
              {ev.description && <p className="text-xs text-ink-3 mt-2 line-clamp-2">{ev.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
