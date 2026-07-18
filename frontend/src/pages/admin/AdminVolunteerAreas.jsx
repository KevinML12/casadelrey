// ============================================================
//  AdminVolunteerAreas — CRUD de los departamentos de voluntariado
//  (Alabanza, Danza, Servidores...). Antes vivían hardcodeados en
//  frontend/src/lib/volunteerAreas.js -- esto es lo que los hace
//  administrables de verdad, sin tocar código. La FOTO de cada uno se
//  administra aparte, en /admin/site-photos (key voluntariado_<value>).
// ============================================================
import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { Icon } from '../../components/ui/Glass';

const fieldCls = 'w-full px-4 py-2.5 rounded border border-bg/10 bg-transparent text-body-s text-bg placeholder:text-bg/50 hover:border-bg/20 focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all';

// Iconos de contenido disponibles (los mismos del set público en
// Glass.jsx) -- no se listan los de uso exclusivo del panel (dashboard,
// settings, etc.), solo los que tienen sentido como icono de un
// departamento de servicio.
const ICON_OPTIONS = [
  'mic', 'spark', 'heart', 'book', 'users', 'music', 'chat', 'mail', 'phone',
  'crown', 'gift', 'flag', 'camera', 'headphones', 'pray', 'box', 'pin', 'clock', 'calendar',
];

const EMPTY = { value: '', icon: 'box', title: '', description: '', why: '', sort_order: 0 };

function AreaForm({ onSave, onCancel, initialData }) {
  const [form, setForm] = useState(initialData || EMPTY);
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.value.trim() || !form.title.trim()) {
      toast.error('Value y título son obligatorios');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, sort_order: Number(form.sort_order) || 0 };
      if (form.ID) {
        await apiClient.put(`/admin/volunteer-areas/${form.ID}`, payload);
        toast.success('Departamento actualizado');
      } else {
        await apiClient.post('/admin/volunteer-areas', payload);
        toast.success('Departamento creado');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-label-l text-bg/50 mb-1.5">
            Value (clave estable) <span className="text-err">*</span>
          </label>
          <input value={form.value} onChange={set('value')} className={fieldCls} placeholder="ej. alabanza" required />
          <p className="text-label-s text-bg/40 mt-1">
            Sin espacios ni tildes -- esta es la clave que usan las inscripciones y la foto en /admin/site-photos. No la cambies si ya hay inscripciones con este departamento.
          </p>
        </div>
        <div>
          <label className="block text-label-l text-bg/50 mb-1.5">Título <span className="text-err">*</span></label>
          <input value={form.title} onChange={set('title')} className={fieldCls} placeholder="ej. Alabanza" required />
        </div>
        <div>
          <label className="block text-label-l text-bg/50 mb-1.5">Icono</label>
          <select value={form.icon} onChange={set('icon')} className={fieldCls}>
            {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-label-l text-bg/50 mb-1.5">Orden</label>
          <input type="number" value={form.sort_order} onChange={set('sort_order')} className={fieldCls} />
        </div>
      </div>

      <div>
        <label className="block text-label-l text-bg/50 mb-1.5">Descripción</label>
        <textarea value={form.description} onChange={set('description')} rows={2}
          className={fieldCls} placeholder="Qué hace este departamento..." />
      </div>

      <div>
        <label className="block text-label-l text-bg/50 mb-1.5">¿Por qué aquí? (se muestra al abrir el departamento)</label>
        <textarea value={form.why} onChange={set('why')} rows={2}
          className={fieldCls} placeholder="Por qué le conviene a alguien servir en este departamento..." />
      </div>

      <div className="flex gap-3 pt-2 border-t border-bg/10">
        <Button type="submit" variant="filled" disabled={loading} className="flex-1 justify-center">
          <Icon name="save" className="w-[16px] h-[16px]" stroke={1.8} />
          {loading ? 'Guardando…' : (form.ID ? 'Actualizar' : 'Crear departamento')}
        </Button>
        <Button type="button" variant="text" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

export default function AdminVolunteerAreas() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    apiClient.get('/admin/volunteer-areas')
      .then(res => setAreas(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (area) => {
    try {
      await apiClient.put(`/admin/volunteer-areas/${area.ID}`, { ...area, is_active: !area.is_active });
      toast.success(area.is_active ? 'Ocultado del sitio' : 'Visible en el sitio');
      load();
    } catch { toast.error('Error al actualizar'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este departamento? Las inscripciones ya guardadas con este valor no se borran.')) return;
    try {
      await apiClient.delete(`/admin/volunteer-areas/${id}`);
      toast.success('Eliminado');
      load();
    } catch { toast.error('Error al eliminar'); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-title-l text-bg mb-1">Voluntariado — Departamentos</h1>
          <p className="text-body-m text-bg/50">
            Los departamentos que se muestran en la página pública de Voluntariado. La foto de
            cada uno se sube aparte, en Fotos del sitio (busca "Voluntariado").
          </p>
        </div>
        <Button variant="filled" onClick={() => { setEditing(null); setShowForm(!showForm); }}>
          <Icon name={showForm ? 'close' : 'add'} className="w-[18px] h-[18px]" stroke={1.8} />
          {showForm ? 'Cancelar' : 'Nuevo departamento'}
        </Button>
      </div>

      {showForm && (
        <div className="p-4 sm:p-6 rounded-2xl bg-bg/4 border border-bg/10">
          <h2 className="text-title-m mb-4">{editing ? 'Editar departamento' : 'Nuevo departamento'}</h2>
          <AreaForm
            initialData={editing}
            onSave={() => { setShowForm(false); setEditing(null); load(); }}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-bg/50">Cargando...</div>
      ) : areas.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-bg/10 text-bg/50">
          Aún no hay departamentos registrados. Agrégalos con "Nuevo departamento".
        </div>
      ) : (
        <div className="space-y-3">
          {areas.map(area => (
            <div key={area.ID} className={`p-4 rounded-2xl border flex flex-col sm:flex-row gap-4 sm:items-center ${area.is_active ? 'bg-bg/4 border-bg/10' : 'bg-bg/8 border-bg/15 opacity-70'}`}>
              <div className="w-11 h-11 rounded-xl bg-bg text-white flex items-center justify-center shrink-0">
                <Icon name={area.icon || 'box'} className="w-5 h-5" stroke={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <p className="text-title-s text-bg font-medium">{area.title}</p>
                  <span className="text-label-s text-bg/50 px-2 py-0.5 rounded-full bg-bg/8 font-mono">{area.value}</span>
                </div>
                {area.description && <p className="text-body-s text-bg/50">{area.description}</p>}
                {area.why && (
                  <p className="text-label-s text-bg/45 mt-1 line-clamp-2">¿Por qué aquí? {area.why}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                <button onClick={() => { setEditing(area); setShowForm(true); }} title="Editar"
                  className="p-1.5 rounded-full hover:bg-bg/8 text-bg/50 hover:text-bg transition-colors">
                  <Icon name="edit" className="w-[18px] h-[18px]" stroke={1.8} />
                </button>
                <button onClick={() => handleToggle(area)} title={area.is_active ? 'Ocultar' : 'Mostrar'}
                  className="p-1.5 rounded-full hover:bg-bg/8 text-bg/50 hover:text-bg transition-colors">
                  <Icon name={area.is_active ? 'visibility' : 'visibility_off'} className="w-[18px] h-[18px]" stroke={1.8} />
                </button>
                <button onClick={() => handleDelete(area.ID)} title="Eliminar"
                  className="p-1.5 rounded-full hover:bg-bg/8 text-bg/50 hover:text-rose transition-colors">
                  <Icon name="delete" className="w-[18px] h-[18px]" stroke={1.8} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
