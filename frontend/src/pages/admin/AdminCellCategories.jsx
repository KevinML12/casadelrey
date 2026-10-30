import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { CELL_TYPES } from '../../components/ui/CellCodePicker';
import Input, { Select, Textarea } from '../../components/ui/Input';
import ModalWrapper from '../../components/ui/ModalWrapper';
import AdminResourceState from '../../components/ui/AdminResourceState';
import CellAdminNav from '../../components/ui/CellAdminNav';

const EMPTY = { name: '', age_group: '', description: '', type_key: '', sort_order: 0, image_url: '' };

function CategoryForm({ initialData, onSave, onClose, onBusy }) {
  const [form, setForm] = useState({ ...EMPTY, ...initialData });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const set = key => event => setForm(values => ({ ...values, [key]: event.target.value }));
  const upload = async event => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) { setError('Elige una imagen de hasta 10 MB.'); return; }
    setUploading(true); onBusy(true); setError('');
    try {
      const data = new FormData(); data.append('file', file);
      const response = await apiClient.post('/upload?folder=celulas', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (!response.data.url) throw new Error();
      setForm(values => ({ ...values, image_url: response.data.url }));
    } catch { setError('No pudimos subir la fotografía. Puedes volver a intentarlo.'); }
    finally { setUploading(false); onBusy(false); }
  };
  const submit = async event => {
    event.preventDefault();
    setSaving(true); onBusy(true); setError('');
    try {
      const data = { ...form, name: form.name.trim(), sort_order: Number(form.sort_order) || 0 };
      if (form.ID) await apiClient.put(`/admin/cell-categories/${form.ID}`, data);
      else await apiClient.post('/admin/cell-categories', data);
      toast.success('Categoría guardada'); onSave();
    } catch (err) { setError(err.response?.data?.error || 'No se pudo guardar. Tus cambios siguen en el formulario.'); }
    finally { setSaving(false); onBusy(false); }
  };
  return <form onSubmit={submit}>
    {error && <p role="alert" className="mb-5 rounded-xl bg-rose/10 p-3 text-14">{error}</p>}
    <fieldset disabled={saving || uploading} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nombre *" value={form.name} onChange={set('name')} required />
        <Input label="Grupo de edad" value={form.age_group} onChange={set('age_group')} />
        <Select label="Tipo de célula que agrupa" value={form.type_key} onChange={set('type_key')} options={CELL_TYPES} placeholder="Categoría informativa" helperText="Las células de este tipo aparecerán en esta categoría." />
        <Input type="number" step="1" label="Orden de aparición" value={form.sort_order} onChange={set('sort_order')} helperText="Los números menores aparecen primero." />
      </div>
      <Textarea label="Descripción" value={form.description} onChange={set('description')} rows={3} />
      <div className="rounded-[12px] border border-bg/15 p-4">
        <h3 className="text-15 font-bold">Fotografía de la categoría</h3>
        <p className="mt-2 text-13 text-bg/65">Elige una panorámica o foto grupal. Se usa como fondo en Inicio y Células. Conservamos la calidad de la imagen que subas.</p>
        {form.image_url && <img src={form.image_url} alt="Vista previa de la categoría" className="mt-4 aspect-video w-full rounded-[10px] object-cover" />}
        <label className="mt-4 block text-13 font-bold" htmlFor="category-photo">{uploading ? 'Subiendo fotografía…' : 'Subir fotografía'}</label>
        <input id="category-photo" type="file" accept="image/*" onChange={upload} className="mt-2 block w-full text-13 file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-bg file:px-4 file:font-semibold file:text-white" />
        <div className="mt-4"><Input label="Enlace de la fotografía" inputMode="url" value={form.image_url} onChange={set('image_url')} helperText="También puedes pegar el enlace de una imagen que ya tengas publicada." /></div>
      </div>
      <div className="flex flex-wrap gap-3 border-t border-bg/10 pt-5"><Button type="submit" disabled={!form.name.trim() || saving || uploading}>{saving ? 'Guardando…' : 'Guardar categoría'}</Button><Button type="button" variant="text" onClick={onClose}>Cancelar</Button></div>
    </fieldset>
  </form>;
}

export default function AdminCellCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [updating, setUpdating] = useState(null);
  const load = async () => {
    setLoading(true); setError('');
    try {
      const response = await apiClient.get('/admin/cell-categories');
      if (!Array.isArray(response.data)) throw new Error();
      setCategories(response.data);
    } catch { setError('No pudimos cargar las categorías.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const toggle = async category => {
    setUpdating(category.ID);
    try {
      await apiClient.put(`/admin/cell-categories/${category.ID}`, { is_active: !category.is_active });
      setCategories(rows => rows.map(row => row.ID === category.ID ? { ...row, is_active: !row.is_active } : row));
      toast.success(category.is_active ? 'Categoría oculta; sus células siguen disponibles en Otros' : 'Categoría publicada');
    } catch { toast.error('No se pudo cambiar la visibilidad.'); }
    finally { setUpdating(null); }
  };
  const close = () => { if (!busy) setEditing(null); };
  return <div className="mx-auto max-w-5xl space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div className="max-w-2xl"><h1 className="text-28 font-bold tracking-tightish">Categorías y fotos</h1><p className="mt-2 text-15 leading-relaxed text-bg/65">Organiza las células que se muestran en Inicio y Células. Cambia su nombre, descripción, fotografía y orden desde aquí.</p></div><Button onClick={() => setEditing({})} disabled={loading || !!error}>Nueva categoría</Button></header>
    <CellAdminNav />
    {loading || error ? <AdminResourceState loading={loading} error={error} onRetry={load} /> : !categories.length ? <AdminResourceState empty="Todavía no hay categorías. Crea una para agrupar tus células." /> : <div className="glass-light overflow-hidden rounded-[16px] divide-y divide-bg/10">
      {categories.map(category => <article key={category.ID} aria-label={category.name} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        {category.image_url ? <img src={category.image_url} alt="" loading="lazy" className="aspect-video w-full rounded-[10px] object-cover sm:w-28 sm:shrink-0" /> : <span className="flex h-16 w-28 shrink-0 items-center justify-center rounded-[10px] border border-bg/10 text-12 text-bg/50">Sin fotografía</span>}
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-17 font-bold">{category.name}</h2><span className="rounded-md bg-bg/5 px-2 py-1 text-11 font-semibold">{category.is_active ? 'Publicada' : 'Oculta'}</span></div><p className="mt-2 text-13 text-bg/65">{[category.age_group, CELL_TYPES.find(type => type.value === category.type_key)?.label || category.type_key || 'Informativa', `Orden ${category.sort_order || 0}`].filter(Boolean).join(' · ')}</p>{category.description && <p className="mt-1 line-clamp-2 text-13 text-bg/65">{category.description}</p>}</div>
        <div className="flex flex-wrap gap-2"><Button variant="outlined" onClick={() => setEditing(category)}>Editar</Button><Button variant="text" disabled={updating === category.ID} onClick={() => toggle(category)}>{updating === category.ID ? 'Guardando…' : category.is_active ? 'Ocultar' : 'Mostrar'}</Button></div>
      </article>)}
    </div>}
    {editing && <ModalWrapper wide busy={busy} ariaLabel={editing.ID ? 'Editar categoría' : 'Nueva categoría'} onClose={close}><h2 className="mb-6 text-24 font-bold">{editing.ID ? 'Editar categoría' : 'Nueva categoría'}</h2><CategoryForm key={editing.ID || 'new'} initialData={editing} onBusy={setBusy} onClose={close} onSave={() => { setEditing(null); load(); }} /></ModalWrapper>}
  </div>;
}
