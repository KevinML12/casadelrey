import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, X, Check, Trash2, ImagePlus, Eye, EyeOff, Bold, Italic, List, ListOrdered, Heading2, Link as LinkIcon, Undo, Redo, AlignLeft } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

// ── Slugify helper ────────────────────────────────────────────────────────────
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// ── Toolbar para el editor ────────────────────────────────────────────────────
function EditorToolbar({ editor }) {
  if (!editor) return null;

  const btn = (active, onClick, icon, title) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-blue text-white'
          : 'text-ink-2 hover:bg-card-2 hover:text-ink'
      }`}
    >
      {icon}
    </button>
  );

  const addLink = () => {
    const url = window.prompt('URL del enlace:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-line bg-bg rounded-t-lg">
      {btn(editor.isActive('bold'),            () => editor.chain().focus().toggleBold().run(),           <Bold size={14} />,         'Negrita')}
      {btn(editor.isActive('italic'),          () => editor.chain().focus().toggleItalic().run(),         <Italic size={14} />,       'Cursiva')}
      <div className="w-px h-4 bg-line mx-1" />
      {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 size={14} />, 'Título H2')}
      {btn(editor.isActive('bulletList'),      () => editor.chain().focus().toggleBulletList().run(),     <List size={14} />,         'Lista')}
      {btn(editor.isActive('orderedList'),     () => editor.chain().focus().toggleOrderedList().run(),    <ListOrdered size={14} />,  'Lista numerada')}
      <div className="w-px h-4 bg-line mx-1" />
      {btn(editor.isActive('link'),            addLink,                                                   <LinkIcon size={14} />,     'Insertar enlace')}
      {btn(false,                              () => editor.chain().focus().undo().run(),                  <Undo size={14} />,         'Deshacer')}
      {btn(false,                              () => editor.chain().focus().redo().run(),                  <Redo size={14} />,         'Rehacer')}
      <div className="w-px h-4 bg-line mx-1" />
      {btn(editor.isActive('blockquote'),      () => editor.chain().focus().toggleBlockquote().run(),     <AlignLeft size={14} />,    'Cita')}
    </div>
  );
}

// ── Formulario de post ────────────────────────────────────────────────────────
const EMPTY = { title: '', slug: '', excerpt: '', cover_image: '', status: 'draft' };

function PostForm({ initial = EMPTY, onSave, onCancel, loading }) {
  const [form,        setForm]        = useState({ ...EMPTY, ...initial });
  const [preview,     setPreview]     = useState(false);
  const [uploading,   setUploading]   = useState(false);

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm(prev => {
      const next = { ...prev, [k]: val };
      if (k === 'title' && !initial.ID) next.slug = slugify(val);
      return next;
    });
  };

  // ── Editor Tiptap ───────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue underline' } }),
      Placeholder.configure({ placeholder: 'Escribe el contenido del post aquí…' }),
    ],
    content: initial.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none min-h-[280px] px-4 py-3 focus:outline-none text-ink text-sm leading-relaxed',
      },
    },
  });

  // ── Upload de imagen de portada ─────────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Solo se aceptan imágenes'); return; }
    if (file.size > 5 * 1024 * 1024)    { toast.error('La imagen no puede superar 5 MB'); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiClient.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(p => ({ ...p, cover_image: res.data.url }));
      toast.success('Imagen subida');
    } catch {
      toast.error('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  // ── Insertar imagen dentro del contenido ────────────────────────────────────
  const insertContentImage = useCallback(() => {
    const url = window.prompt('URL de la imagen a insertar:');
    if (url) editor?.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const handleSave = () => {
    if (!editor) return;
    onSave({ ...form, content: editor.getHTML() });
  };

  return (
    <div className="bg-card border border-line rounded-xl p-5 mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-ink">{initial.ID ? 'Editar Post' : 'Nuevo Post'}</h3>
        <button onClick={onCancel} className="text-ink-3 hover:text-ink transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Título + Slug */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Título *" value={form.title} onChange={set('title')} required />
          <Input label="Slug" value={form.slug} onChange={set('slug')} helperText="url-del-post" required />
        </div>

        {/* Imagen de portada */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Imagen de portada</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://... o sube un archivo →"
              value={form.cover_image}
              onChange={set('cover_image')}
              className="flex-1 px-3 py-2.5 rounded-lg border border-line bg-transparent text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-blue focus:ring-2 focus:ring-blue/15 transition-all"
            />
            <label className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line text-sm font-medium cursor-pointer transition-colors ${uploading ? 'opacity-50' : 'hover:border-blue/40 hover:text-blue'} text-ink-2`}>
              <ImagePlus size={15} />
              {uploading ? 'Subiendo…' : 'Subir'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
          </div>
          {form.cover_image && (
            <div className="mt-2 relative">
              <img src={form.cover_image} alt="Portada" className="w-full max-h-40 object-cover rounded-lg border border-line" />
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, cover_image: '' }))}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Extracto */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Extracto <span className="text-ink-3 font-normal">(resumen visible en la lista)</span></label>
          <textarea
            rows={2}
            value={form.excerpt}
            onChange={set('excerpt')}
            placeholder="Breve descripción del post…"
            className="w-full px-3 py-2.5 rounded-lg border border-line bg-transparent text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-blue focus:ring-2 focus:ring-blue/15 transition-all resize-none"
          />
        </div>

        {/* Editor de contenido */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-ink">Contenido *</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={insertContentImage}
                className="flex items-center gap-1 text-xs text-ink-3 hover:text-blue transition-colors"
              >
                <ImagePlus size={12} /> Insertar imagen
              </button>
              <button
                type="button"
                onClick={() => setPreview(p => !p)}
                className="flex items-center gap-1 text-xs text-ink-3 hover:text-blue transition-colors"
              >
                {preview ? <EyeOff size={12} /> : <Eye size={12} />}
                {preview ? 'Editor' : 'Preview'}
              </button>
            </div>
          </div>

          {preview ? (
            <div
              className="prose prose-slate max-w-none min-h-[200px] px-4 py-3 rounded-lg border border-line bg-bg text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '' }}
            />
          ) : (
            <div className="rounded-lg border border-line overflow-hidden focus-within:border-blue focus-within:ring-2 focus-within:ring-blue/15 transition-all">
              <EditorToolbar editor={editor} />
              <EditorContent editor={editor} />
            </div>
          )}
        </div>

        {/* Publicar */}
        <label className="flex items-center gap-2 text-sm text-ink cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.status === 'published'}
            onChange={e => setForm(p => ({ ...p, status: e.target.checked ? 'published' : 'draft' }))}
            className="rounded border-line accent-blue w-4 h-4"
          />
          Publicar inmediatamente
        </label>

        {/* Acciones */}
        <div className="flex gap-2 pt-1 border-t border-line">
          <Button size="sm" onClick={handleSave} disabled={loading}>
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

// ── Página principal ──────────────────────────────────────────────────────────
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
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-ink">Blog</h1>
        {!showForm && !editing && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus size={14} /> Nuevo post
          </Button>
        )}
      </div>

      {showForm && !editing && (
        <PostForm
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          loading={saving}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-line border-t-blue animate-spin" />
        </div>
      ) : (
        <div className="bg-card border border-line rounded-xl overflow-hidden">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-ink-3 text-sm">No hay posts. Crea el primero con el botón de arriba.</p>
            </div>
          ) : posts.map(post => (
            <div key={post.ID}>
              {editing?.ID === post.ID ? (
                <div className="p-4">
                  <PostForm
                    initial={{ ...post, content: post.content }}
                    onSave={handleSave}
                    onCancel={() => setEditing(null)}
                    loading={saving}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 px-5 py-4 border-b border-line last:border-0 hover:bg-bg transition-colors group">
                  {/* Miniatura */}
                  {post.cover_image ? (
                    <img src={post.cover_image} alt="" className="w-12 h-10 rounded object-cover shrink-0 border border-line" />
                  ) : (
                    <div className="w-12 h-10 rounded bg-card-2 border border-line flex items-center justify-center shrink-0">
                      <ImagePlus size={14} className="text-ink-3" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink text-sm truncate">{post.title}</p>
                    <p className="text-xs text-ink-3 mt-0.5 truncate">{post.slug}</p>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      post.status === 'published' ? 'bg-ok/10 text-ok' : 'bg-line text-ink-3'
                    }`}>
                      {post.status === 'published' ? 'Publicado' : 'Borrador'}
                    </span>
                    <button
                      onClick={() => { setEditing(post); setShowForm(false); }}
                      className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-blue transition-all p-1"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(post.ID)}
                      className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-err transition-all p-1"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
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
