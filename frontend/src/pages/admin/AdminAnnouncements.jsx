import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input, { Textarea } from '../../components/ui/Input';
import { FilterChip } from '../../components/ui/Chip';
import Paginator from '../../components/ui/Paginator';

const TARGETS = [
  { value: 'all',    label: 'Todos',     icon: 'public' },
  { value: 'member', label: 'Miembros',  icon: 'person' },
  { value: 'leader', label: 'Líderes',   icon: 'star' },
  { value: 'admin',  label: 'Admins',    icon: 'admin_panel_settings' },
];

const EMPTY = { title: '', content: '', role_target: 'all', is_active: true, publish_now: true };

function AnnouncementForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      toast.error('Título y contenido son obligatorios');
      return;
    }
    setLoading(true);
    try {
      if (initial?.ID) {
        await apiClient.put(`/admin/announcements/${initial.ID}`, form);
        toast.success('Anuncio actualizado');
      } else {
        await apiClient.post('/admin/announcements/', form);
        toast.success('Anuncio creado');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input value={form.title} onChange={set('title')} label={<>Título <span className="text-rose">*</span></>} placeholder="Título del anuncio" required />
      </div>
      <div>
        <Textarea rows={4} value={form.content} onChange={set('content')}
          label={<>Contenido <span className="text-rose">*</span></>} placeholder="Describe el anuncio…" required />
      </div>
      <div>
        <label className="block text-label-l text-bg/50 mb-2">Visible para</label>
        <div className="flex gap-2 flex-wrap">
          {TARGETS.map(t => (
            <FilterChip key={t.value} selected={form.role_target === t.value} icon={t.icon}
              onClick={() => setForm(p => ({ ...p, role_target: t.value }))}>
              {t.label}
            </FilterChip>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_active}
            onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
            className="rounded border-bg/10" />
          <span className="text-body-s text-bg">Activo</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.publish_now}
            onChange={e => setForm(p => ({ ...p, publish_now: e.target.checked }))}
            className="rounded border-bg/10" />
          <span className="text-body-s text-bg">Publicar ahora</span>
        </label>
      </div>
      <div className="flex gap-3 pt-2 border-t border-bg/10">
        <Button type="submit" variant="filled" disabled={loading} className="flex-1 justify-center">
          {loading ? 'Guardando…' : initial?.ID ? 'Actualizar' : 'Crear anuncio'}
        </Button>
        <Button type="button" variant="text" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

export default function AdminAnnouncements() {
  const [items, setItems]     = useState([]);
  const [meta,  setMeta]      = useState(null);
  const [page,  setPage]      = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);

  const load = (p = page) => {
    setLoading(true);
    apiClient.get(`/admin/announcements/?page=${p}&limit=20`)
      .then(r => { setItems(r.data.data || []); setMeta(r.data.meta); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(page); }, [page]);

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este anuncio?')) return;
    try {
      await apiClient.delete(`/admin/announcements/${id}`);
      toast.success('Eliminado');
      load(page);
    } catch { toast.error('Error al eliminar'); }
  };

  const targetLabel = v => TARGETS.find(t => t.value === v)?.label || v;

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-headline-s text-bg font-black leading-tight">Anuncios</h1>
          <p className="text-body-s text-bg/50 mt-0.5">{meta?.total ?? 0} anuncio{meta?.total !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="filled" onClick={() => { setEditing(null); setShowForm(s => !s); }}>
          {showForm ? 'Cancelar' : 'Nuevo anuncio'}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass-light rounded-[24px] card-spring mb-8 p-6">
          <p className="text-label-l text-bg/45 font-semibold uppercase tracking-widest mb-5">
            {editing ? 'Editar anuncio' : 'Nuevo anuncio'}
          </p>
          <AnnouncementForm
            initial={editing}
            onSave={() => { setShowForm(false); setEditing(null); load(1); setPage(1); }}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-celeste animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="glass-light rounded-[24px] card-spring flex flex-col items-center py-20 gap-4 text-bg/50">
          <p className="text-body-l text-bg font-medium">Sin anuncios</p>
          <p className="text-body-s text-bg/50">Crea el primero con el botón de arriba.</p>
        </div>
      ) : (
        <div className="glass-light rounded-[24px] card-spring overflow-hidden divide-y divide-bg/8">
          {items.map(a => (
            <div key={a.ID} className="flex items-start gap-4 p-5 hover:bg-bg/8 transition-colors group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-body-l text-bg font-medium">{a.title}</span>
                  <span className="text-label-s text-bg/50 px-2 py-0.5 rounded-full bg-bg/8">
                    {targetLabel(a.role_target)}
                  </span>
                  {!a.is_active && (
                    <span className="text-label-s text-bg/50 px-2 py-0.5 rounded-full bg-bg/8">Inactivo</span>
                  )}
                </div>
                <p className="text-body-s text-bg/50 line-clamp-2">{a.content}</p>
              </div>
              <div className="flex items-center gap-3 text-13 font-semibold opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => { setEditing(a); setShowForm(true); }} className="text-bg/55 hover:text-bg transition-colors">
                  Editar
                </button>
                <span className="text-bg/20">·</span>
                <button onClick={() => handleDelete(a.ID)} className="text-bg/55 hover:text-rose transition-colors">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Paginator meta={meta} onPage={setPage} />
    </div>
  );
}
