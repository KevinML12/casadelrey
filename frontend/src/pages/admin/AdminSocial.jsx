import { useEffect, useState } from 'react';
import { Share2, Plus, Pencil, Trash2, Inbox } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';

export default function AdminSocial() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ platform: 'facebook', post_url: '', caption: '', is_active: true });

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
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta publicación?')) return;
    try {
      await apiClient.delete(`/admin/social/${id}`);
      toast.success('Eliminado');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const getEmbedUrl = (url, platform) => {
    if (platform === 'instagram') {
      const match = url.match(/instagram\.com\/p\/([^/]+)/);
      return match ? `https://www.instagram.com/p/${match[1]}/embed` : url;
    }
    return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&width=500&show_text=true`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-black text-ink mb-6 flex items-center gap-2">
        <Share2 size={24} /> Redes Sociales
      </h1>
      <p className="text-ink-2 text-sm mb-6">
        Vincula publicaciones de Facebook e Instagram para que aparezcan en la página principal.
      </p>

      <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-xl bg-card border border-line space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Plataforma</label>
            <select
              value={form.platform}
              onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
              className="w-full px-4 py-2 rounded-md border border-line bg-transparent text-ink text-sm"
            >
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">URL de la publicación *</label>
            <input
              type="url"
              value={form.post_url}
              onChange={e => setForm(f => ({ ...f, post_url: e.target.value }))}
              placeholder="https://www.facebook.com/..."
              className="w-full px-4 py-2 rounded-md border border-line bg-transparent text-ink text-sm"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Caption (opcional)</label>
          <input
            type="text"
            value={form.caption}
            onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
            placeholder="Descripción breve"
            className="w-full px-4 py-2 rounded-md border border-line bg-transparent text-ink text-sm"
          />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
          <span className="text-sm text-ink">Visible en el sitio</span>
        </label>
        <Button type="submit">{editing ? 'Actualizar' : 'Agregar'}</Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-line border-t-blue animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-card border border-line rounded-xl">
          <Inbox size={32} className="mx-auto text-ink-3 mb-3" />
          <p className="text-ink-3 text-sm">No hay publicaciones vinculadas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map(p => (
            <div key={p.ID} className="bg-card border border-line rounded-xl overflow-hidden">
              <div className="aspect-square bg-bg">
                <iframe
                  src={getEmbedUrl(p.post_url, p.platform)}
                  className="w-full h-full"
                  style={{ minHeight: 400 }}
                  title={p.caption || p.platform}
                />
              </div>
              <div className="p-4 flex justify-between items-center">
                <span className="text-xs font-medium text-ink-3 capitalize">{p.platform}</span>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(p); setForm({ platform: p.platform, post_url: p.post_url, caption: p.caption || '', is_active: p.is_active }); }} className="p-1.5 rounded text-ink-3 hover:bg-blue/10 hover:text-blue">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(p.ID)} className="p-1.5 rounded text-ink-3 hover:bg-red-500/10 hover:text-red-500">
                    <Trash2 size={14} />
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
