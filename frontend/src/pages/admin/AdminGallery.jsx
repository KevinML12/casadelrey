import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Button, { IconButton } from '../../components/ui/Button';
import Paginator from '../../components/ui/Paginator';

const fieldCls = 'w-full px-4 py-2.5 rounded border border-outline-var bg-transparent text-body-s text-on-surf placeholder:text-on-surf-var hover:border-on-surf-var focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all';

const EMPTY = { title: '', description: '', url: '', thumbnail_url: '', sort_order: 0, is_active: true };

function PhotoForm({ onSave, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.url) { toast.error('La URL de la foto es obligatoria'); return; }
    setLoading(true);
    try {
      await apiClient.post('/admin/gallery/', form);
      toast.success('Foto agregada');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-label-l text-on-surf-var mb-1.5">URL de la foto <span className="text-err">*</span></label>
        <input value={form.url} onChange={set('url')} className={fieldCls} placeholder="https://…" required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-label-l text-on-surf-var mb-1.5">Título</label>
          <input value={form.title} onChange={set('title')} className={fieldCls} placeholder="Nombre de la foto" />
        </div>
        <div>
          <label className="block text-label-l text-on-surf-var mb-1.5">URL miniatura</label>
          <input value={form.thumbnail_url} onChange={set('thumbnail_url')} className={fieldCls} placeholder="https://… (opcional)" />
        </div>
      </div>
      <div>
        <label className="block text-label-l text-on-surf-var mb-1.5">Descripción</label>
        <textarea rows={2} value={form.description} onChange={set('description')}
          className={`${fieldCls} resize-none`} placeholder="Descripción breve…" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-label-l text-on-surf-var mb-1.5">Orden</label>
          <input type="number" value={form.sort_order} onChange={set('sort_order')} className={fieldCls} min={0} />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active}
              onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
              className="rounded" />
            <span className="text-body-s text-on-surf">Activa</span>
          </label>
        </div>
      </div>
      <div className="flex gap-3 pt-2 border-t border-outline-var">
        <Button type="submit" variant="filled" disabled={loading} className="flex-1 justify-center">
          <span className="ms" style={{ fontSize: 16 }}>save</span>
          {loading ? 'Guardando…' : 'Agregar foto'}
        </Button>
        <Button type="button" variant="text" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

export default function AdminGallery() {
  const [photos, setPhotos]   = useState([]);
  const [meta,   setMeta]     = useState(null);
  const [page,   setPage]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = (p = page) => {
    setLoading(true);
    apiClient.get(`/admin/gallery/?page=${p}&limit=24`)
      .then(r => { setPhotos(r.data.data || []); setMeta(r.data.meta); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(page); }, [page]);

  const handleToggle = async (photo) => {
    try {
      await apiClient.put(`/admin/gallery/${photo.ID}`, { ...photo, is_active: !photo.is_active });
      toast.success(photo.is_active ? 'Foto ocultada' : 'Foto activada');
      load(page);
    } catch { toast.error('Error al actualizar'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta foto?')) return;
    try {
      await apiClient.delete(`/admin/gallery/${id}`);
      toast.success('Foto eliminada');
      load(page);
    } catch { toast.error('Error al eliminar'); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-ter-con flex items-center justify-center shrink-0">
            <span className="ms text-on-ter-con" style={{ fontSize: 22 }}>photo_library</span>
          </div>
          <div>
            <h1 className="text-headline-s text-on-surf font-black leading-tight">Galería</h1>
            <p className="text-body-s text-on-surf-var mt-0.5">{meta?.total ?? 0} foto{meta?.total !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Button variant="filled" onClick={() => setShowForm(s => !s)}>
          <span className="ms" style={{ fontSize: 18 }}>{showForm ? 'close' : 'add_photo_alternate'}</span>
          {showForm ? 'Cancelar' : 'Agregar foto'}
        </Button>
      </div>

      {showForm && (
        <div className="mb-8 p-6 rounded-2xl bg-surf-low border border-outline-var">
          <p className="text-label-l text-pri font-semibold uppercase tracking-widest mb-5">Nueva foto</p>
          <PhotoForm onSave={() => { setShowForm(false); load(1); setPage(1); }} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
        </div>
      ) : photos.length === 0 ? (
        <div className="bg-surf-low border border-outline-var rounded-2xl flex flex-col items-center py-20 gap-4">
          <div className="w-16 h-16 rounded-[28px] bg-surf-high flex items-center justify-center">
            <span className="ms text-on-surf-var" style={{ fontSize: 32 }}>photo_library</span>
          </div>
          <p className="text-body-l text-on-surf font-medium">Sin fotos</p>
          <p className="text-body-s text-on-surf-var">Agrega la primera foto con el botón de arriba.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map(p => (
            <div key={p.ID} className="group relative rounded-xl overflow-hidden bg-surf-low border border-outline-var aspect-square">
              <img
                src={p.thumbnail_url || p.url}
                alt={p.title}
                className={`w-full h-full object-cover transition-opacity ${p.is_active ? 'opacity-100' : 'opacity-40'}`}
                onError={e => { e.target.src = 'https://placehold.co/200x200?text=Foto'; }}
              />
              {!p.is_active && (
                <div className="absolute top-2 left-2 bg-black/60 text-ink text-xs px-2 py-0.5 rounded-full">
                  Oculta
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <IconButton onClick={() => handleToggle(p)} title={p.is_active ? 'Ocultar' : 'Mostrar'}
                  className="bg-white/90 text-on-surf hover:bg-white w-8 h-8">
                  <span className="ms" style={{ fontSize: 16 }}>{p.is_active ? 'visibility_off' : 'visibility'}</span>
                </IconButton>
                <IconButton onClick={() => handleDelete(p.ID)} title="Eliminar"
                  className="bg-err/90 text-ink hover:bg-err w-8 h-8">
                  <span className="ms" style={{ fontSize: 16 }}>delete</span>
                </IconButton>
              </div>
              {p.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-xs text-ink font-medium line-clamp-1">{p.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Paginator meta={meta} onPage={setPage} />
    </div>
  );
}
