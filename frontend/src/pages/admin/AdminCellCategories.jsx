// ============================================================
//  AdminCellCategories — CRUD de las categorías de células que se ven
//  en /celulas y en la vista previa del Home (Adolescentes, Varones,
//  Mujeres...). Antes vivían hardcodeadas en CelulasPage.jsx (nombre,
//  edad, descripción) -- esto es lo que las hace administrables de
//  verdad: crear, renombrar, describir, reordenar o borrar una
//  categoría sin tocar código. La FOTO de cada una se sube aparte, en
//  Fotos del sitio (busca "Categorías de células").
//
//  Type key: liga la categoría a uno de los 5 tipos estructurales de
//  célula (el mismo H/M/J/P/N que usan el código de célula y los
//  reportes semanales) para saber qué células le pertenecen. Una
//  categoría sin type key no agrupa células automáticamente -- sirve
//  para una categoría puramente informativa. Células cuyo tipo no
//  tenga ninguna categoría activa con ese type key caen en "Otros" en
//  la página pública, nunca desaparecen en silencio.
// ============================================================
import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Button, { IconButton } from '../../components/ui/Button';
import Input, { Select, Textarea } from '../../components/ui/Input';
import { Icon } from '../../components/ui/Glass';

const TYPE_KEY_OPTIONS = [
  { value: '', label: 'Sin type key (no agrupa células automáticamente)' },
  { value: 'hombres', label: 'Hombres' },
  { value: 'mujeres', label: 'Mujeres' },
  { value: 'jovenes', label: 'Jóvenes' },
  { value: 'prejus', label: 'Prejuveniles' },
  { value: 'ninos', label: 'Niños' },
];

const EMPTY = { name: '', age_group: '', description: '', type_key: '', sort_order: 0 };

function CategoryForm({ onSave, onCancel, initialData }) {
  const [form, setForm] = useState(initialData || EMPTY);
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, sort_order: Number(form.sort_order) || 0 };
      if (form.ID) {
        await apiClient.put(`/admin/cell-categories/${form.ID}`, payload);
        toast.success('Categoría actualizada');
      } else {
        await apiClient.post('/admin/cell-categories', payload);
        toast.success('Categoría creada');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Nombre *" value={form.name} onChange={set('name')} placeholder="ej. Adolescentes" required />
        <Input label="Grupo de edad" value={form.age_group} onChange={set('age_group')} placeholder="ej. 15 a 24 años" />
        <Select
          label="Type key (qué células le pertenecen)"
          value={form.type_key}
          onChange={set('type_key')}
          options={TYPE_KEY_OPTIONS.filter(t => t.value !== '')}
          placeholder="Sin type key (no agrupa células automáticamente)"
        />
        <Input type="number" label="Orden" value={form.sort_order} onChange={set('sort_order')} />
      </div>

      <Textarea
        label="Descripción"
        value={form.description}
        onChange={set('description')}
        rows={2}
        placeholder="Qué hace especial a esta clasificación..."
      />

      <div className="flex gap-3 pt-2 border-t border-bg/10">
        <Button type="submit" variant="filled" disabled={loading} className="flex-1 justify-center">
          <Icon name="save" className="w-[16px] h-[16px]" stroke={1.8} />
          {loading ? 'Guardando…' : (form.ID ? 'Actualizar' : 'Crear categoría')}
        </Button>
        <Button type="button" variant="text" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

export default function AdminCellCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    apiClient.get('/admin/cell-categories')
      .then(res => setCategories(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (cat) => {
    try {
      await apiClient.put(`/admin/cell-categories/${cat.ID}`, { ...cat, is_active: !cat.is_active });
      toast.success(cat.is_active ? 'Ocultada del sitio' : 'Visible en el sitio');
      load();
    } catch { toast.error('Error al actualizar'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría? Las células que apuntaban a su type key seguirán visibles en "Otros".')) return;
    try {
      await apiClient.delete(`/admin/cell-categories/${id}`);
      toast.success('Eliminada');
      load();
    } catch { toast.error('Error al eliminar'); }
  };

  const typeKeyLabel = (value) => TYPE_KEY_OPTIONS.find(t => t.value === value)?.label || value;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-bg flex items-center justify-center shrink-0">
            <Icon name="tag" className="w-[22px] h-[22px] text-white" stroke={1.8} />
          </div>
          <div>
            <h1 className="text-headline-s text-bg font-black leading-tight">Categorías de células</h1>
            <p className="text-body-m text-bg/50 mt-0.5">
              Las clasificaciones que se muestran en /celulas y en la vista previa del Home. La foto
              de cada una se sube aparte, en Fotos del sitio (busca "Categorías de células").
            </p>
          </div>
        </div>
        <Button variant="filled" onClick={() => { setEditing(null); setShowForm(!showForm); }}>
          <Icon name={showForm ? 'close' : 'add'} className="w-[18px] h-[18px]" stroke={1.8} />
          {showForm ? 'Cancelar' : 'Nueva categoría'}
        </Button>
      </div>

      {showForm && (
        <div className="glass-light rounded-[24px] card-spring p-4 sm:p-6">
          <h2 className="text-title-m mb-4">{editing ? 'Editar categoría' : 'Nueva categoría'}</h2>
          <CategoryForm
            initialData={editing}
            onSave={() => { setShowForm(false); setEditing(null); load(); }}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-celeste animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="glass-light rounded-[24px] card-spring flex flex-col items-center py-16 gap-4">
          <div className="w-16 h-16 rounded-[28px] bg-bg/8 flex items-center justify-center">
            <Icon name="tag" className="w-[32px] h-[32px] text-bg/50" stroke={1.8} />
          </div>
          <p className="text-body-l text-bg font-medium">Sin categorías todavía</p>
        </div>
      ) : (
        <div className="glass-light rounded-[24px] card-spring overflow-hidden divide-y divide-bg/8">
          {categories.map(cat => (
            <div key={cat.ID} className={`p-4 flex flex-col sm:flex-row gap-4 sm:items-center hover:bg-bg/6 transition-colors ${cat.is_active ? '' : 'opacity-60'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <p className="text-title-s text-bg font-medium">{cat.name}</p>
                  {cat.age_group && <span className="text-label-s text-bg/50 px-2 py-0.5 rounded-full bg-bg/8">{cat.age_group}</span>}
                  {cat.type_key && <span className="text-label-s text-bg/50 px-2 py-0.5 rounded-full bg-bg/8 font-mono">{typeKeyLabel(cat.type_key)}</span>}
                </div>
                {cat.description && <p className="text-body-s text-bg/50">{cat.description}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                <IconButton onClick={() => { setEditing(cat); setShowForm(true); }} title="Editar">
                  <Icon name="edit" className="w-[18px] h-[18px]" stroke={1.8} />
                </IconButton>
                <IconButton onClick={() => handleToggle(cat)} title={cat.is_active ? 'Ocultar' : 'Mostrar'}>
                  <Icon name={cat.is_active ? 'visibility' : 'visibility_off'} className="w-[18px] h-[18px]" stroke={1.8} />
                </IconButton>
                <IconButton onClick={() => handleDelete(cat.ID)} title="Eliminar"
                  className="text-bg/50 hover:text-rose hover:bg-rose/8">
                  <Icon name="delete" className="w-[18px] h-[18px]" stroke={1.8} />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
