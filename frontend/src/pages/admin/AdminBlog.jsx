import { useEffect, useState } from 'react';
import { Plus, Pencil, X, Check } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Input, { Textarea } from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const EMPTY = { title: '', slug: '', excerpt: '', content: '', is_published: false };

function PostForm({ initial = EMPTY, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="bg-card border border-line rounded-xl p-5 mb-6 animate-fade-in">
      <h3 className="font-bold text-ink mb-4">{initial.id ? 'Editar Post' : 'Nuevo Post'}</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Título" value={form.title} onChange={set('title')} required />
          <Input label="Slug" value={form.slug} onChange={set('slug')} helperText="url-del-post" required />
        </div>
        <Textarea label="Excerpt" rows={2} value={form.excerpt} onChange={set('excerpt')} />
        <Textarea label="Contenido (HTML)" rows={8} value={form.content} onChange={set('content')} />
        <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
          <input type="checkbox" checked={form.is_published}
            onChange={e => setForm(p => ({ ...p, is_published: e.target.checked }))}
            className="rounded border-line accent-blue" />
          Publicado
        </label>
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

export default function AdminBlog() {
  const [posts,    setPosts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);

  const load = () => apiClient.get('/blog/posts').then(r => setPosts(r.data || [])).catch(console.error).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editing) {
        await apiClient.put(`/admin/blog/${editing.id}`, form);
        toast.success('Post actualizado');
      } else {
        await apiClient.post('/admin/blog', form);
        toast.success('Post creado');
      }
      setShowForm(false);
      setEditing(null);
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
        <h1 className="text-2xl font-black text-ink">Blog</h1>
        {!showForm && (
          <Button size="sm" onClick={() => { setShowForm(true); setEditing(null); }}>
            <Plus size={14} /> Nuevo post
          </Button>
        )}
      </div>

      {(showForm && !editing) && (
        <PostForm onSave={handleSave} onCancel={() => setShowForm(false)} loading={saving} />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-line border-t-blue animate-spin" />
        </div>
      ) : (
        <div className="bg-card border border-line rounded-xl overflow-hidden">
          {posts.length === 0 ? (
            <p className="text-center py-12 text-ink-3 text-sm">No hay posts aún.</p>
          ) : posts.map(post => (
            <div key={post.id}>
              {editing?.id === post.id ? (
                <div className="p-4">
                  <PostForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} loading={saving} />
                </div>
              ) : (
                <div className="flex items-center justify-between px-5 py-4 border-b border-line last:border-0 hover:bg-bg transition-colors">
                  <div>
                    <p className="font-medium text-ink text-sm">{post.title}</p>
                    <p className="text-xs text-ink-3 mt-0.5">{post.slug}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${post.is_published ? 'bg-ok/10 text-ok' : 'bg-line text-ink-3'}`}>
                      {post.is_published ? 'Publicado' : 'Borrador'}
                    </span>
                    <button onClick={() => setEditing(post)}
                      className="text-ink-3 hover:text-blue transition-colors p-1">
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
