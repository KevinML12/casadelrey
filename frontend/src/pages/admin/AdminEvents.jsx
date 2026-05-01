import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Input, { Textarea } from '../../components/ui/Input';
import Button, { IconButton } from '../../components/ui/Button';
import Chip from '../../components/ui/Chip';

const EMPTY = { title: '', date: '', location: '', description: '' };

function EventForm({ onSave, onCancel, loading }) {
  const [form, setForm] = useState(EMPTY);
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="bg-surf-low border border-outline-var rounded-2xl p-6 mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <p className="text-label-l text-pri font-semibold uppercase tracking-widest">Nuevo evento</p>
        <IconButton onClick={onCancel}>
          <span className="ms" style={{ fontSize: 18 }}>close</span>
        </IconButton>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Título *" value={form.title} onChange={set('title')} required />
          <Input label="Fecha *" type="date" value={form.date} onChange={set('date')} required />
        </div>
        <Input label="Ubicación" value={form.location} onChange={set('location')} placeholder="Ej: Salón Principal" />
        <Textarea label="Descripción" rows={3} value={form.description} onChange={set('description')} />
        <div className="flex gap-3 pt-2 border-t border-outline-var">
          <Button variant="filled" onClick={() => onSave(form)} disabled={loading || !form.title}>
            <span className="ms" style={{ fontSize: 16 }}>check</span>
            {loading ? 'Guardando…' : 'Guardar evento'}
          </Button>
          <Button variant="text" onClick={onCancel}>Cancelar</Button>
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

const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function EventDate({ dateStr }) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T12:00:00');
  return (
    <div className="w-12 h-12 rounded-xl bg-pri-con flex flex-col items-center justify-center shrink-0">
      <span className="text-label-s text-on-pri-con font-bold uppercase leading-none">{MONTH_SHORT[d.getMonth()]}</span>
      <span className="text-headline-s text-on-pri-con font-black leading-tight">{d.getDate()}</span>
    </div>
  );
}

// ─── RSVPs inline per event ──────────────────────────────────────────────────

function EventRSVPs({ eventId }) {
  const [rsvps,    setRsvps]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [totAtts,  setTotAtts]  = useState(0);

  useEffect(() => {
    apiClient.get(`/admin/events/${eventId}/rsvps`)
      .then(r => {
        const data = r.data?.rsvps || [];
        setRsvps(data);
        setTotAtts(r.data?.total_attendees || data.reduce((s, x) => s + (x.attendee_count || 1), 0));
      })
      .catch(() => setRsvps([]))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return (
    <div className="px-5 pb-4 flex items-center gap-2 text-body-s text-on-surf-var">
      <div className="w-4 h-4 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
      Cargando confirmaciones…
    </div>
  );

  if (!rsvps?.length) return (
    <p className="px-5 pb-4 text-body-s text-on-surf-var">Sin confirmaciones aún.</p>
  );

  return (
    <div className="px-5 pb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-label-s text-on-surf-var uppercase tracking-widest">
          {rsvps.length} confirmaciones · {totAtts} asistentes estimados
        </span>
      </div>
      <div className="bg-surf border border-outline-var rounded-xl overflow-hidden divide-y divide-outline-var">
        {rsvps.map(r => (
          <div key={r.ID} className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-pri-con flex items-center justify-center shrink-0">
              <span className="ms text-on-pri-con" style={{ fontSize: 14 }}>person</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-s text-on-surf font-medium">{r.name}</p>
              <p className="text-label-s text-on-surf-var">{r.email}{r.phone ? ` · ${r.phone}` : ''}</p>
            </div>
            <Chip color="secondary">{r.attendee_count || 1} {r.attendee_count === 1 ? 'pers.' : 'pers.'}</Chip>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminEvents() {
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(null);

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
    } finally { setSaving(false); }
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

      {/* Page header */}
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-ter-con flex items-center justify-center shrink-0">
            <span className="ms text-on-ter-con" style={{ fontSize: 22 }}>calendar_month</span>
          </div>
          <div>
            <h1 className="text-headline-s text-on-surf font-black leading-tight">Eventos</h1>
            <p className="text-body-s text-on-surf-var mt-0.5">{events.length} evento{events.length !== 1 ? 's' : ''} programado{events.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {!showForm && (
          <Button variant="filled" onClick={() => setShowForm(true)}>
            <span className="ms" style={{ fontSize: 18 }}>add</span>
            Nuevo evento
          </Button>
        )}
      </div>

      {showForm && (
        <EventForm onSave={handleSave} onCancel={() => setShowForm(false)} loading={saving} />
      )}

      {loading ? <Spinner /> : events.length === 0 ? (
        <div className="bg-surf-low border border-outline-var rounded-2xl flex flex-col items-center py-20 gap-4 text-on-surf-var">
          <div className="w-16 h-16 rounded-[28px] bg-surf-high flex items-center justify-center">
            <span className="ms" style={{ fontSize: 32 }}>calendar_month</span>
          </div>
          <div className="text-center">
            <p className="text-body-l text-on-surf font-medium">Sin eventos</p>
            <p className="text-body-s text-on-surf-var mt-1">Crea el primero con el botón de arriba.</p>
          </div>
        </div>
      ) : (
        <div className="bg-surf-low border border-outline-var rounded-2xl overflow-hidden divide-y divide-outline-var">
          {events.map(ev => (
            <div key={ev.ID} className="group">
              <div
                className="flex items-start gap-4 p-5 hover:bg-surf-high transition-colors cursor-pointer"
                onClick={() => setExpanded(p => p === ev.ID ? null : ev.ID)}
              >

                {/* Leading: date badge */}
                <EventDate dateStr={ev.date} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-body-l text-on-surf font-medium mb-1">{ev.title}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-body-s text-on-surf-var">
                    {ev.date && (
                      <span className="flex items-center gap-1.5">
                        <span className="ms" style={{ fontSize: 14 }}>calendar_today</span>
                        {new Date(ev.date + 'T12:00:00').toLocaleDateString('es-ES', {
                          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </span>
                    )}
                    {ev.location && (
                      <span className="flex items-center gap-1.5">
                        <span className="ms" style={{ fontSize: 14 }}>location_on</span>
                        {ev.location}
                      </span>
                    )}
                  </div>
                  {ev.description && (
                    <p className="text-body-s text-on-surf-var mt-2 line-clamp-2 leading-relaxed">{ev.description}</p>
                  )}
                </div>

                {/* Trailing */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="ms text-on-surf-var" style={{ fontSize: 18, transition: 'transform .2s', transform: expanded === ev.ID ? 'rotate(180deg)' : '' }}>
                    expand_more
                  </span>
                  <IconButton
                    onClick={(e) => { e.stopPropagation(); handleDelete(ev.ID); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-on-surf-var hover:text-err hover:bg-err-con"
                  >
                    <span className="ms" style={{ fontSize: 18 }}>delete</span>
                  </IconButton>
                </div>
              </div>

              {/* RSVPs expandido */}
              {expanded === ev.ID && <EventRSVPs eventId={ev.ID} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
