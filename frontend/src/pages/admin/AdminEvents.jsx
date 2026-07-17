import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Input, { Textarea } from '../../components/ui/Input';
import Button, { IconButton } from '../../components/ui/Button';
import Chip from '../../components/ui/Chip';
import { Icon } from '../../components/ui/Glass';

const EMPTY = {
  title: '', date: '', time: '', location: '', description: '', cover_image: '',
  requires_payment: false, price_gtq: '', payment_deadline: '',
};

function EventForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [uploading, setUploading] = useState(false);
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const fieldCls = 'w-full px-3 py-2.5 rounded border border-bg/10 bg-transparent text-body-s text-bg placeholder:text-bg/50 hover:border-bg/20 focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all';

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Solo se aceptan imágenes'); return; }
    if (file.size > 5 * 1024 * 1024)    { toast.error('Máx 5 MB'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiClient.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(p => ({ ...p, cover_image: res.data.url }));
      toast.success('Imagen subida');
    } catch { toast.error('Error al subir'); }
    finally { setUploading(false); }
  };

  const handleSubmit = () => {
    onSave({
      ...form,
      price_gtq: form.requires_payment ? Number(form.price_gtq) || 0 : 0,
      payment_deadline: form.requires_payment ? form.payment_deadline : '',
    });
  };

  return (
    <div className="glass-light rounded-[24px] card-spring p-6 mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <p className="text-label-l text-bg/45 font-semibold uppercase tracking-widest">{initial?.ID ? 'Editar evento' : 'Nuevo evento'}</p>
        <IconButton onClick={onCancel}>
          <Icon name="close" className="w-[18px] h-[18px]" stroke={1.8} />
        </IconButton>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Título *" value={form.title} onChange={set('title')} required />
          <Input label="Fecha *" type="date" value={form.date} onChange={set('date')} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Hora" type="time" value={form.time} onChange={set('time')} />
          <Input label="Ubicación" value={form.location} onChange={set('location')} placeholder="Ej: Salón Principal" />
        </div>
        <Textarea label="Descripción" rows={3} value={form.description} onChange={set('description')} />

        <div>
          <label className="block text-label-l text-bg/50 mb-1.5">Foto de portada</label>
          <div className="flex gap-2">
            <input type="text" placeholder="https://..." value={form.cover_image} onChange={set('cover_image')}
              className={`flex-1 ${fieldCls}`} />
            <label className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border border-bg/10 text-label-m font-medium cursor-pointer transition-colors ${uploading ? 'opacity-50' : 'hover:border-pri/40 hover:text-pri'} text-bg/50`}>
              <Icon name="image" className="w-[16px] h-[16px]" stroke={1.8} />
              {uploading ? 'Subiendo…' : 'Subir'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
          </div>
          {form.cover_image && (
            <div className="mt-2 relative">
              <img src={form.cover_image} alt="Portada" className="w-full max-h-40 object-cover rounded-lg border border-bg/10" />
              <button type="button" onClick={() => setForm(p => ({ ...p, cover_image: '' }))}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-bg/40 text-ink flex items-center justify-center hover:bg-black/70">
                <Icon name="close" className="w-[14px] h-[14px]" stroke={1.8} />
              </button>
            </div>
          )}
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer w-fit">
          <input type="checkbox" checked={form.requires_payment}
            onChange={e => setForm(p => ({ ...p, requires_payment: e.target.checked }))}
            className="w-4 h-4 accent-pri" />
          <span className="text-body-s text-bg">Este evento requiere pago</span>
        </label>

        {form.requires_payment && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-1 border-l-2 border-pri/30 pl-4">
            <Input label="Precio (Q)" type="number" min="0" step="0.01" value={form.price_gtq} onChange={set('price_gtq')} />
            <Input label="Fecha límite de pago" type="date" value={form.payment_deadline} onChange={set('payment_deadline')} />
          </div>
        )}

        <div className="flex gap-3 pt-2 border-t border-bg/10">
          <Button variant="filled" onClick={handleSubmit} disabled={loading || !form.title || uploading}>
            <Icon name="check" className="w-[16px] h-[16px]" stroke={1.8} />
            {loading ? 'Guardando…' : initial?.ID ? 'Guardar cambios' : 'Guardar evento'}
          </Button>
          <Button variant="text" onClick={onCancel}>Cancelar</Button>
        </div>
      </div>
    </div>
  );
}

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-pri animate-spin" />
  </div>
);

const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function EventDate({ dateStr }) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T12:00:00');
  return (
    <div className="w-12 h-12 rounded-xl bg-bg flex flex-col items-center justify-center shrink-0">
      <span className="text-label-s text-white font-bold uppercase leading-none">{MONTH_SHORT[d.getMonth()]}</span>
      <span className="text-headline-s text-white font-black leading-tight">{d.getDate()}</span>
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
        const data = r.data?.data || [];
        setRsvps(data);
        setTotAtts(r.data?.total_attendees || data.reduce((s, x) => s + (x.attendee_count || 1), 0));
      })
      .catch(() => setRsvps([]))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return (
    <div className="px-5 pb-4 flex items-center gap-2 text-body-s text-bg/50">
      <div className="w-4 h-4 rounded-full border-2 border-bg/10 border-t-pri animate-spin" />
      Cargando confirmaciones…
    </div>
  );

  if (!rsvps?.length) return (
    <p className="px-5 pb-4 text-body-s text-bg/50">Sin confirmaciones aún.</p>
  );

  return (
    <div className="px-5 pb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-label-s text-bg/50 uppercase tracking-widest">
          {rsvps.length} confirmaciones · {totAtts} asistentes estimados
        </span>
      </div>
      <div className="bg-bg/4 border border-bg/10 rounded-xl overflow-hidden divide-y divide-bg/8">
        {rsvps.map(r => (
          <div key={r.ID} className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-bg flex items-center justify-center shrink-0">
              <Icon name="person" className="w-[14px] h-[14px] text-white" stroke={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-s text-bg font-medium">{r.name}</p>
              <p className="text-label-s text-bg/50">{r.email}{r.phone ? ` · ${r.phone}` : ''}</p>
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
  const [editing,  setEditing]  = useState(null);
  const [expanded, setExpanded] = useState(null);

  // /events/ es el endpoint PÚBLICO con Cache-Control de 20s (para que la
  // página pública no golpee la DB en cada visita) — el panel admin lo
  // reutiliza porque no hay uno propio, pero eso significa que crear/
  // editar/borrar un evento y refrescar puede devolver la respuesta
  // cacheada de hace segundos, sin el cambio recién hecho. Cache-bust
  // con un query param propio para que el admin SIEMPRE vea el estado
  // real tras guardar (detectado por la suite E2E: el evento creado no
  // aparecía en la lista hasta pasados ~20s).
  const load = () =>
    apiClient.get(`/events/?_t=${Date.now()}`)
      .then(r => setEvents(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editing) {
        await apiClient.put(`/admin/events/${editing.ID}`, form);
        toast.success('Evento actualizado');
      } else {
        await apiClient.post('/admin/events/', form);
        toast.success('Evento creado');
      }
      setShowForm(false);
      setEditing(null);
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
          <div className="w-12 h-12 rounded-2xl bg-bg flex items-center justify-center shrink-0">
            <Icon name="calendar_month" className="w-[22px] h-[22px] text-white" stroke={1.8} />
          </div>
          <div>
            <h1 className="text-headline-s text-bg font-black leading-tight">Eventos</h1>
            <p className="text-body-s text-bg/50 mt-0.5">{events.length} evento{events.length !== 1 ? 's' : ''} programado{events.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {!showForm && (
          <Button variant="filled" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Icon name="add" className="w-[18px] h-[18px]" stroke={1.8} />
            Nuevo evento
          </Button>
        )}
      </div>

      {showForm && (
        <EventForm initial={editing} onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }} loading={saving} />
      )}

      {loading ? <Spinner /> : events.length === 0 ? (
        <div className="glass-light rounded-[24px] card-spring flex flex-col items-center py-20 gap-4 text-bg/50">
          <div className="w-16 h-16 rounded-[28px] bg-bg/8 flex items-center justify-center">
            <Icon name="calendar_month" className="w-[32px] h-[32px]" stroke={1.8} />
          </div>
          <div className="text-center">
            <p className="text-body-l text-bg font-medium">Sin eventos</p>
            <p className="text-body-s text-bg/50 mt-1">Crea el primero con el botón de arriba.</p>
          </div>
        </div>
      ) : (
        <div className="glass-light rounded-[24px] card-spring overflow-hidden divide-y divide-bg/8">
          {events.map(ev => (
            <div key={ev.ID} className="group">
              <div
                className="flex items-start gap-4 p-5 hover:bg-bg/8 transition-colors cursor-pointer"
                onClick={() => setExpanded(p => p === ev.ID ? null : ev.ID)}
              >

                {/* Leading: date badge */}
                <EventDate dateStr={ev.date} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-body-l text-bg font-medium mb-1">{ev.title}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-body-s text-bg/50">
                    {ev.date && (
                      <span className="flex items-center gap-1.5">
                        <Icon name="calendar_today" className="w-[14px] h-[14px]" stroke={1.8} />
                        {new Date(ev.date + 'T12:00:00').toLocaleDateString('es-ES', {
                          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </span>
                    )}
                    {ev.location && (
                      <span className="flex items-center gap-1.5">
                        <Icon name="location_on" className="w-[14px] h-[14px]" stroke={1.8} />
                        {ev.location}
                      </span>
                    )}
                  </div>
                  {ev.description && (
                    <p className="text-body-s text-bg/50 mt-2 line-clamp-2 leading-relaxed">{ev.description}</p>
                  )}
                </div>

                {/* Trailing */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-bg/40" style={{ transition: 'transform .2s', transform: expanded === ev.ID ? 'rotate(180deg)' : '' }}>
                    <Icon name="expand_more" className="w-[18px] h-[18px]" stroke={1.8} />
                  </span>
                  <IconButton
                    onClick={(e) => { e.stopPropagation(); setEditing(ev); setShowForm(true); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-bg/50 hover:text-bg hover:bg-bg/8"
                  >
                    <Icon name="edit" className="w-[18px] h-[18px]" stroke={1.8} />
                  </IconButton>
                  <IconButton
                    onClick={(e) => { e.stopPropagation(); handleDelete(ev.ID); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-bg/50 hover:text-rose hover:bg-rose/8"
                  >
                    <Icon name="delete" className="w-[18px] h-[18px]" stroke={1.8} />
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
