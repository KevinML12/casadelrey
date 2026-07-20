import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Button, { IconButton } from '../../components/ui/Button';
import { FilterChip } from '../../components/ui/Chip';
import Paginator from '../../components/ui/Paginator';
import { Icon } from '../../components/ui/Glass';

const TARGETS = [
  { value: 'all',    label: 'Todos',     icon: 'public' },
  { value: 'member', label: 'Miembros',  icon: 'person' },
  { value: 'leader', label: 'Líderes',   icon: 'star' },
  { value: 'admin',  label: 'Admins',    icon: 'admin_panel_settings' },
];

const EMPTY = { title: '', content: '', role_target: 'all', is_active: true, publish_now: true };

const fieldCls = 'w-full px-4 py-2.5 rounded border border-bg/10 bg-transparent text-body-s text-bg placeholder:text-bg/50 hover:border-bg/20 focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all';

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
        <label className="block text-label-l text-bg/50 mb-1.5">Título <span className="text-err">*</span></label>
        <input value={form.title} onChange={set('title')} className={fieldCls} placeholder="Título del anuncio" required />
      </div>
      <div>
        <label className="block text-label-l text-bg/50 mb-1.5">Contenido <span className="text-err">*</span></label>
        <textarea rows={4} value={form.content} onChange={set('content')}
          className={`${fieldCls} resize-none`} placeholder="Describe el anuncio…" required />
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
          <Icon name="save" className="w-[16px] h-[16px]" stroke={1.8} />
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
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-bg flex items-center justify-center shrink-0">
            <Icon name="campaign" className="w-[22px] h-[22px] text-white" stroke={1.8} />
          </div>
          <div>
            <h1 className="text-headline-s text-bg font-black leading-tight">Anuncios</h1>
            <p className="text-body-s text-bg/50 mt-0.5">{meta?.total ?? 0} anuncio{meta?.total !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Button variant="filled" onClick={() => { setEditing(null); setShowForm(s => !s); }}>
          <Icon name={showForm ? 'close' : 'add'} className="w-[18px] h-[18px]" stroke={1.8} />
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
          <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-pri animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="glass-light rounded-[24px] card-spring flex flex-col items-center py-20 gap-4 text-bg/50">
          <div className="w-16 h-16 rounded-[28px] bg-bg/8 flex items-center justify-center">
            <Icon name="campaign" className="w-[32px] h-[32px]" stroke={1.8} />
          </div>
          <p className="text-body-l text-bg font-medium">Sin anuncios</p>
          <p className="text-body-s text-bg/50">Crea el primero con el botón de arriba.</p>
        </div>
      ) : (
        <div className="glass-light rounded-[24px] card-spring overflow-hidden divide-y divide-bg/8">
          {items.map(a => (
            <div key={a.ID} className="flex items-start gap-4 p-5 hover:bg-bg/8 transition-colors group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${a.is_active ? 'bg-bg' : 'bg-bg/8'}`}>
                <Icon name="campaign" className={`w-[18px] h-[18px] ${a.is_active ? 'text-white' : 'text-bg/50'}`} stroke={1.8} />
              </div>
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
              <div className="flex items-center gap-1 opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity shrink-0">
                <IconButton onClick={() => { setEditing(a); setShowForm(true); }} title="Editar">
                  <Icon name="edit" className="w-[16px] h-[16px] text-bg/50" stroke={1.8} />
                </IconButton>
                <IconButton onClick={() => handleDelete(a.ID)} title="Eliminar"
                  className="text-bg/50 hover:text-err hover:bg-err-con">
                  <Icon name="delete" className="w-[16px] h-[16px]" stroke={1.8} />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <Paginator meta={meta} onPage={setPage} />
    </div>
  );
}
