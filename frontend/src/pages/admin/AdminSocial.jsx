import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Input, { Select } from '../../components/ui/Input';
import { compressImageIfNeeded } from '../../lib/compressImage';

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram', icon: 'photo_camera' },
  { value: 'facebook',  label: 'Facebook',  icon: 'thumb_up' },
  { value: 'youtube',   label: 'YouTube',   icon: 'play_circle' },
  { value: 'tiktok',    label: 'TikTok',    icon: 'music_video' },
];

const SIZES = [
  { value: 'small',  label: 'Pequeña', span: 'col-span-1 row-span-1' },
  { value: 'medium', label: 'Mediana', span: 'col-span-2 row-span-1' },
  { value: 'large',  label: 'Grande',  span: 'col-span-2 row-span-2' },
];

const EMPTY = { platform: 'instagram', post_url: '', caption: '', image_url: '', featured_size: 'medium', is_active: true, sort_order: 0 };

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-celeste animate-spin" />
  </div>
);

function Form({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [uploading, setUploading] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImageIfNeeded(file);
      const fd = new FormData();
      fd.append('file', compressed);
      const res = await apiClient.post('/upload?folder=social', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(p => ({ ...p, image_url: res.data.url }));
      toast.success('Imagen subida');
    } catch { toast.error('Error al subir'); }
    finally { setUploading(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.image_url || !form.post_url) {
      toast.error('La imagen y la URL del post son obligatorias');
      return;
    }
    setLoading(true);
    try {
      if (initial?.ID) {
        await apiClient.put(`/admin/social/${initial.ID}`, form);
        toast.success('Actualizado');
      } else {
        await apiClient.post('/admin/social', form);
        toast.success('Agregado');
      }
      onSave();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="glass-light rounded-[24px] card-spring space-y-5 p-6">

      {/* Imagen */}
      <div>
        <label className="block text-label-l text-bg/50 mb-2">Imagen del post *</label>
        {form.image_url ? (
          <div className="flex items-center gap-4">
            <img src={form.image_url} alt="post" className="w-24 h-24 rounded-xl object-cover border border-bg/10" />
            <button type="button" onClick={() => setForm(p => ({ ...p, image_url: '' }))}
              className="text-label-m text-rose hover:underline">Cambiar imagen</button>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-bg/10 cursor-pointer hover:border-celeste transition-colors">
            <p className="text-body-s text-bg">{uploading ? 'Subiendo…' : 'Subir foto del post'}</p>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploading} />
          </label>
        )}
      </div>

      {/* Plataforma + URL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Plataforma *" value={form.platform} onChange={set('platform')} options={PLATFORMS} />
        <Input label="URL del post *" type="url" value={form.post_url} onChange={set('post_url')}
          placeholder="https://instagram.com/p/..." required />
      </div>

      {/* Caption */}
      <Input label="Caption (opcional)" value={form.caption} onChange={set('caption')}
        placeholder="Breve descripción que se muestra en hover" />

      {/* Tamaño en el grid */}
      <div>
        <label className="block text-label-l text-bg/50 mb-2">Tamaño en el grid editorial</label>
        <div className="flex gap-2 flex-wrap">
          {SIZES.map(s => (
            <button key={s.value} type="button"
              onClick={() => setForm(p => ({ ...p, featured_size: s.value }))}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-lg text-label-m font-semibold transition-colors ${
                form.featured_size === s.value
                  ? 'bg-bg text-white'
                  : 'border border-bg/10 text-bg/50 hover:bg-bg/8'
              }`}>
              {s.label}
            </button>
          ))}
        </div>
        <p className="text-label-s text-bg/50 mt-1.5">
          Mezcla tamaños para crear un layout editorial estilo Wallpaper.
        </p>
      </div>

      {/* Orden + activo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Orden (menor = primero)" type="number" value={form.sort_order} onChange={set('sort_order')} />
        <label className="flex items-end gap-2 text-body-s text-bg cursor-pointer pb-2">
          <input type="checkbox" checked={form.is_active} onChange={set('is_active')}
            className="rounded accent-celeste w-4 h-4" />
          Visible en el sitio
        </label>
      </div>

      <div className="flex gap-3 pt-2 border-t border-bg/10">
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-bg text-white text-label-l font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
          {loading ? 'Guardando…' : initial?.ID ? 'Actualizar' : 'Agregar'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 h-10 rounded-xl text-label-l text-bg/50 hover:bg-bg/8 transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function AdminSocial() {
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = () => {
    setLoading(true);
    apiClient.get('/admin/social')
      .then(r => setPosts(r.data?.data || r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!confirm('¿Eliminar esta publicación?')) return;
    try {
      await apiClient.delete(`/admin/social/${id}`);
      toast.success('Eliminado');
      load();
    } catch { toast.error('Error'); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-2 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-headline-s text-bg font-black">Galería desde redes</h1>
          </div>
          <p className="text-body-s text-bg/50 mt-1 max-w-xl">
            Sube fotos de tus posts de Instagram, Facebook, YouTube o TikTok y enlázalas al post original.
            Aparecerán en la página principal como grid editorial.
          </p>
        </div>
        {!editing && (
          <button onClick={() => setEditing({})}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-bg text-white text-label-l font-semibold hover:opacity-90 transition-opacity">
            Nueva publicación
          </button>
        )}
      </div>

      {editing && (
        <div className="my-6">
          <Form initial={editing} onSave={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} />
        </div>
      )}

      {loading ? <Spinner /> : posts.length === 0 ? (
        <div className="glass-light rounded-[24px] card-spring mt-6 flex flex-col items-center py-20 gap-4 text-bg/50">
          <div className="text-center">
            <p className="text-body-l text-bg font-medium">Sin publicaciones</p>
            <p className="text-body-s mt-1">Vincula tu primer post para que aparezca en la home.</p>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 auto-rows-[150px] gap-3">
          {posts.map(p => {
            const sizeClass = SIZES.find(s => s.value === p.featured_size)?.span || 'col-span-1 row-span-1';
            const plat = PLATFORMS.find(pl => pl.value === p.platform);
            return (
              <div key={p.ID}
                className={`relative rounded-xl overflow-hidden border border-bg/10 group ${sizeClass} ${!p.is_active ? 'opacity-50' : ''}`}>
                {p.image_url ? (
                  <img src={p.image_url} alt={p.caption} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-bg/8 flex items-center justify-center">
                    <span className="text-11 text-bg/50 font-medium">Sin imagen</span>
                  </div>
                )}
                {/* Badge plataforma */}
                <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
                  <span className="text-10 text-ink font-semibold uppercase tracking-wider">{plat?.label}</span>
                </div>
                {/* Hover overlay con acciones */}
                <div className="absolute inset-0 bg-black/70 opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-3">
                  {p.caption && <p className="text-label-s text-ink text-center line-clamp-2">{p.caption}</p>}
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditing(p)}
                      className="px-3 h-8 rounded-full bg-bg/20 hover:bg-bg/30 text-ink text-12 font-semibold transition-colors">
                      Editar
                    </button>
                    <a href={p.post_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center px-3 h-8 rounded-full bg-bg/20 hover:bg-bg/30 text-ink text-12 font-semibold transition-colors">
                      Ver post
                    </a>
                    <button onClick={() => remove(p.ID)}
                      className="px-3 h-8 rounded-full bg-rose/80 hover:bg-rose text-ink text-12 font-semibold transition-colors">
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
