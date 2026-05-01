import { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function EditorToolbar({ editor }) {
  if (!editor) return null;

  const btn = (active, onClick, icon, title) => (
    <button
      type="button" onClick={onClick} title={title}
      className={`p-1.5 rounded-md transition-colors ${
        active ? 'bg-pri text-on-pri' : 'text-on-surf-var hover:bg-surf-high hover:text-on-surf'
      }`}
    >
      <span className="ms" style={{ fontSize: 16 }}>{icon}</span>
    </button>
  );

  const addLink = () => {
    const url = window.prompt('URL del enlace:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-outline-var bg-surf rounded-t-lg">
      {btn(editor.isActive('bold'),            () => editor.chain().focus().toggleBold().run(),           'format_bold',        'Negrita')}
      {btn(editor.isActive('italic'),          () => editor.chain().focus().toggleItalic().run(),         'format_italic',      'Cursiva')}
      <div className="w-px h-4 bg-outline-var mx-1" />
      {btn(editor.isActive('heading', {level:2}), () => editor.chain().focus().toggleHeading({level:2}).run(), 'title', 'Título H2')}
      {btn(editor.isActive('bulletList'),      () => editor.chain().focus().toggleBulletList().run(),     'format_list_bulleted', 'Lista')}
      {btn(editor.isActive('orderedList'),     () => editor.chain().focus().toggleOrderedList().run(),    'format_list_numbered', 'Numerada')}
      <div className="w-px h-4 bg-outline-var mx-1" />
      {btn(editor.isActive('link'),            addLink,                                                   'link',               'Enlace')}
      {btn(false,                              () => editor.chain().focus().undo().run(),                  'undo',               'Deshacer')}
      {btn(false,                              () => editor.chain().focus().redo().run(),                  'redo',               'Rehacer')}
      <div className="w-px h-4 bg-outline-var mx-1" />
      {btn(editor.isActive('blockquote'),      () => editor.chain().focus().toggleBlockquote().run(),     'format_quote',       'Cita')}
    </div>
  );
}

const EMPTY = { title: '', slug: '', excerpt: '', cover_image: '', redirect_url: '', status: 'draft' };

function PostForm({ initial = EMPTY, onSave, onCancel, loading }) {
  const [form,      setForm]      = useState({ ...EMPTY, ...initial });
  const [preview,   setPreview]   = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm(prev => {
      const next = { ...prev, [k]: val };
      if (k === 'title' && !initial.ID) next.slug = slugify(val);
      return next;
    });
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-pri underline' } }),
      Placeholder.configure({ placeholder: 'Escribe el contenido del post aquí…' }),
    ],
    content: initial.content || '',
    editorProps: {
      attributes: {
        class: 'prose max-w-none min-h-[280px] px-4 py-3 focus:outline-none text-on-surf text-body-s leading-relaxed',
      },
    },
  });

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

  const insertContentImage = useCallback(() => {
    const url = window.prompt('URL de la imagen:');
    if (url) editor?.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const handleSave = () => {
    if (!editor) return;
    onSave({ ...form, content: editor.getHTML() });
  };

  const fieldCls = 'w-full px-3 py-2.5 rounded border border-outline-var bg-transparent text-body-s text-on-surf placeholder:text-on-surf-var hover:border-on-surf-var focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all';

  return (
    <div className="bg-surf-low border border-outline-var rounded-2xl p-6 mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <p className="text-label-l text-pri font-semibold uppercase tracking-widest">{initial.ID ? 'Editar post' : 'Nuevo post'}</p>
        <button onClick={onCancel} className="text-on-surf-var hover:text-on-surf transition-colors">
          <span className="ms" style={{ fontSize: 20 }}>close</span>
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Título *" value={form.title} onChange={set('title')} required />
          <Input label="Slug" value={form.slug} onChange={set('slug')} helperText="url-del-post" required />
        </div>

        <div>
          <label className="block text-label-l text-on-surf-var mb-1.5">Imagen de portada</label>
          <div className="flex gap-2">
            <input type="text" placeholder="https://..." value={form.cover_image} onChange={set('cover_image')}
              className={`flex-1 ${fieldCls}`} />
            <label className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline-var text-label-m font-medium cursor-pointer transition-colors ${uploading ? 'opacity-50' : 'hover:border-pri/40 hover:text-pri'} text-on-surf-var`}>
              <span className="ms" style={{ fontSize: 16 }}>image</span>
              {uploading ? 'Subiendo…' : 'Subir'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
          </div>
          {form.cover_image && (
            <div className="mt-2 relative">
              <img src={form.cover_image} alt="Portada" className="w-full max-h-40 object-cover rounded-lg border border-outline-var" />
              <button type="button" onClick={() => setForm(p => ({ ...p, cover_image: '' }))}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70">
                <span className="ms" style={{ fontSize: 14 }}>close</span>
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-label-l text-on-surf-var mb-1.5">
            Enlace a red social <span className="font-normal text-on-surf-var/60">(opcional — redirige al hacer clic)</span>
          </label>
          <input type="url" placeholder="https://facebook.com/..." value={form.redirect_url} onChange={set('redirect_url')}
            className={fieldCls} />
        </div>

        <div>
          <label className="block text-label-l text-on-surf-var mb-1.5">
            Extracto <span className="font-normal">(resumen visible en la lista)</span>
          </label>
          <textarea rows={2} value={form.excerpt} onChange={set('excerpt')}
            placeholder="Breve descripción del post…"
            className={`${fieldCls} resize-none`} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-label-l text-on-surf-var">Contenido <span className="font-normal text-on-surf-var/60">(opcional si hay enlace)</span></label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={insertContentImage}
                className="flex items-center gap-1 text-label-s text-on-surf-var hover:text-pri transition-colors">
                <span className="ms" style={{ fontSize: 14 }}>image</span> Insertar imagen
              </button>
              <button type="button" onClick={() => setPreview(p => !p)}
                className="flex items-center gap-1 text-label-s text-on-surf-var hover:text-pri transition-colors">
                <span className="ms" style={{ fontSize: 14 }}>{preview ? 'edit' : 'preview'}</span>
                {preview ? 'Editor' : 'Preview'}
              </button>
            </div>
          </div>
          {preview ? (
            <div className="prose max-w-none min-h-[200px] px-4 py-3 rounded-lg border border-outline-var bg-surf text-body-s leading-relaxed"
              dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '' }} />
          ) : (
            <div className="rounded-lg border border-outline-var overflow-hidden focus-within:border-pri focus-within:ring-2 focus-within:ring-pri/15 transition-all">
              <EditorToolbar editor={editor} />
              <EditorContent editor={editor} />
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-body-s text-on-surf cursor-pointer select-none">
          <input type="checkbox" checked={form.status === 'published'}
            onChange={e => setForm(p => ({ ...p, status: e.target.checked ? 'published' : 'draft' }))}
            className="rounded border-outline-var accent-pri w-4 h-4" />
          Publicar inmediatamente
        </label>

        <div className="flex gap-2 pt-1 border-t border-outline-var">
          <Button size="sm" variant="filled" onClick={handleSave} disabled={loading}>
            <span className="ms" style={{ fontSize: 14 }}>check</span>
            {loading ? 'Guardando…' : 'Guardar'}
          </Button>
          <Button size="sm" variant="text" onClick={onCancel}>
            <span className="ms" style={{ fontSize: 14 }}>close</span>
            Cancelar
          </Button>
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

export default function AdminBlog() {
  const [posts,    setPosts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);

  const load = () =>
    apiClient.get('/admin/blog/')
      .then(r => setPosts(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editing) {
        await apiClient.put(`/admin/blog/${editing.ID}`, form);
        toast.success('Post actualizado');
      } else {
        await apiClient.post('/admin/blog/', form);
        toast.success('Post creado');
      }
      setShowForm(false);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este post permanentemente?')) return;
    try {
      await apiClient.delete(`/admin/blog/${id}`);
      toast.success('Post eliminado');
      setPosts(prev => prev.filter(p => p.ID !== id));
    } catch { toast.error('Error al eliminar'); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-pri-con flex items-center justify-center shrink-0">
            <span className="ms text-on-pri-con" style={{ fontSize: 22 }}>article</span>
          </div>
          <div>
            <h1 className="text-headline-s text-on-surf font-black leading-tight">Blog</h1>
            <p className="text-body-s text-on-surf-var mt-0.5">{posts.length} publicaciones</p>
          </div>
        </div>
        {!showForm && !editing && (
          <Button variant="filled" onClick={() => setShowForm(true)}>
            <span className="ms" style={{ fontSize: 18 }}>add</span>
            Nuevo post
          </Button>
        )}
      </div>

      {showForm && !editing && (
        <PostForm onSave={handleSave} onCancel={() => setShowForm(false)} loading={saving} />
      )}

      {loading ? <Spinner /> : (
        <div className="bg-surf-low border border-outline-var rounded-2xl overflow-hidden">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center py-20 gap-4 text-on-surf-var">
              <div className="w-16 h-16 rounded-[28px] bg-surf-high flex items-center justify-center">
                <span className="ms" style={{ fontSize: 32 }}>article</span>
              </div>
              <div className="text-center">
                <p className="text-body-l text-on-surf font-medium">Sin posts</p>
                <p className="text-body-s text-on-surf-var mt-1">Crea el primero con el botón de arriba.</p>
              </div>
            </div>
          ) : posts.map(post => (
            <div key={post.ID} className="divide-y divide-outline-var">
              {editing?.ID === post.ID ? (
                <div className="p-5">
                  <PostForm initial={{ ...post }} onSave={handleSave}
                    onCancel={() => setEditing(null)} loading={saving} />
                </div>
              ) : (
                <div className="flex items-center gap-4 px-5 py-4 border-b border-outline-var last:border-0 hover:bg-surf-high transition-colors group">
                  {post.cover_image ? (
                    <img src={post.cover_image} alt="" className="w-12 h-10 rounded-lg object-cover shrink-0 border border-outline-var" />
                  ) : (
                    <div className="w-12 h-10 rounded-lg bg-surf-high border border-outline-var flex items-center justify-center shrink-0">
                      <span className="ms text-on-surf-var" style={{ fontSize: 18 }}>article</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-body-m text-on-surf font-medium truncate">{post.title}</p>
                    <p className="text-label-s text-on-surf-var mt-0.5 truncate font-mono">{post.slug}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-label-s text-on-surf-var hidden sm:block">{post.view_count ?? 0} vistas</span>
                    <span className={`inline-flex items-center h-7 px-3 rounded-lg text-label-m font-medium ${
                      post.status === 'published'
                        ? 'bg-ter-con text-on-ter-con'
                        : 'bg-surf-high text-on-surf-var'
                    }`}>
                      {post.status === 'published' ? 'Publicado' : 'Borrador'}
                    </span>
                    {post.redirect_url && (
                      <span className="inline-flex items-center h-7 px-3 rounded-lg bg-sec-con text-on-sec-con text-label-m font-medium gap-1">
                        <span className="ms" style={{ fontSize: 12 }}>open_in_new</span>
                        Externo
                      </span>
                    )}
                    <button
                      onClick={() => { setEditing(post); setShowForm(false); }}
                      className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full flex items-center justify-center text-on-surf-var hover:text-pri hover:bg-pri-con transition-all"
                    >
                      <span className="ms" style={{ fontSize: 16 }}>edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(post.ID)}
                      className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full flex items-center justify-center text-on-surf-var hover:text-err hover:bg-err-con transition-all"
                    >
                      <span className="ms" style={{ fontSize: 16 }}>delete</span>
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
