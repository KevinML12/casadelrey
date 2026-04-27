import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';

const fieldCls = 'w-full px-4 py-2.5 rounded-lg border border-outline-var bg-transparent text-body-s text-on-surf placeholder:text-on-surf-var focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all';

function getEmbedUrl(url, platform) {
  if (platform === 'instagram') {
    const match = url.match(/instagram\.com\/p\/([^/]+)/);
    return match ? `https://www.instagram.com/p/${match[1]}/embed` : url;
  }
  return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&width=500&show_text=true`;
}

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="w-6 h-6 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
  </div>
);

export default function AdminSocial() {
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({ platform: 'facebook', post_url: '', caption: '', is_active: true });

  const load = () =>
    apiClient.get('/admin/social')
      .then(r => setPosts(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await apiClient.put(`/admin/social/${editing.ID}`, form);
        toast.success('Actualizado');
      } else {
        await apiClient.post('/admin/social', form);
        toast.success('Agregado');
      }
      setEditing(null);
      setForm({ platform: 'facebook', post_url: '', caption: '', is_active: true });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta publicación?')) return;
    try {
      await apiClient.delete(`/admin/social/${id}`);
      toast.success('Eliminado');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <span className="ms text-on-surf" style={{ fontSize: 26 }}>share</span>
        <h1 className="text-headline-s text-on-surf font-black">Redes Sociales</h1>
      </div>
      <p className="text-body-s text-on-surf-var mb-6">
        Vincula publicaciones de Facebook e Instagram para que aparezcan en la página principal.
      </p>

      <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-xl bg-surf-low border border-outline-var space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-label-l text-on-surf-var mb-1.5">Plataforma</label>
            <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
              className={fieldCls}>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>
          <div>
            <label className="block text-label-l text-on-surf-var mb-1.5">URL de la publicación *</label>
            <input type="url" value={form.post_url}
              onChange={e => setForm(f => ({ ...f, post_url: e.target.value }))}
              placeholder="https://www.facebook.com/..."
              className={fieldCls} required />
          </div>
        </div>
        <div>
          <label className="block text-label-l text-on-surf-var mb-1.5">Caption (opcional)</label>
          <input type="text" value={form.caption}
            onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
            placeholder="Descripción breve"
            className={fieldCls} />
        </div>
        <label className="flex items-center gap-2 text-body-s text-on-surf cursor-pointer">
          <input type="checkbox" checked={form.is_active}
            onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
            className="rounded accent-pri w-4 h-4" />
          Visible en el sitio
        </label>
        <Button type="submit" variant="filled">
          <span className="ms" style={{ fontSize: 16 }}>{editing ? 'save' : 'add'}</span>
          {editing ? 'Actualizar' : 'Agregar'}
        </Button>
      </form>

      {loading ? <Spinner /> : posts.length === 0 ? (
        <div className="text-center py-16 bg-surf-low border border-outline-var rounded-xl">
          <div className="leading-icon mx-auto mb-3">
            <span className="ms" style={{ fontSize: 26 }}>inbox</span>
          </div>
          <p className="text-body-s text-on-surf-var">No hay publicaciones vinculadas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map(p => (
            <div key={p.ID} className="bg-surf-low border border-outline-var rounded-xl overflow-hidden">
              <div className="aspect-square bg-surf">
                <iframe src={getEmbedUrl(p.post_url, p.platform)}
                  className="w-full h-full" style={{ minHeight: 400 }}
                  title={p.caption || p.platform} />
              </div>
              <div className="p-4 flex justify-between items-center">
                <span className="text-label-m text-on-surf-var capitalize font-medium">{p.platform}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditing(p); setForm({ platform: p.platform, post_url: p.post_url, caption: p.caption || '', is_active: p.is_active }); }}
                    className="p-1.5 rounded-lg text-on-surf-var hover:bg-pri-con hover:text-on-pri-con transition-colors">
                    <span className="ms" style={{ fontSize: 16 }}>edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(p.ID)}
                    className="p-1.5 rounded-lg text-on-surf-var hover:bg-err-con hover:text-on-err-con transition-colors">
                    <span className="ms" style={{ fontSize: 16 }}>delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
