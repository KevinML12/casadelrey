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
import Input, { Textarea } from '../../components/ui/Input';

const EMPTY = { value: '', title: '', description: '', why: '', testimonial: '', testimonial_author: '', sort_order: 0 };

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
        <Input
          label="Value (clave estable) *"
          value={form.value}
          onChange={set('value')}
          placeholder="ej. alabanza"
          required
          helperText="Sin espacios ni tildes -- esta es la clave que usan las inscripciones y la foto en /admin/site-photos. No la cambies si ya hay inscripciones con este departamento."
        />
        <Input label="Título *" value={form.title} onChange={set('title')} placeholder="ej. Alabanza" required />
        <Input type="number" label="Orden" value={form.sort_order} onChange={set('sort_order')} />
      </div>

      <Textarea
        label="Descripción"
        value={form.description}
        onChange={set('description')}
        rows={2}
        placeholder="Qué hace este departamento..."
      />

      <Textarea
        label="¿Por qué aquí? (se muestra al abrir el departamento)"
        value={form.why}
        onChange={set('why')}
        rows={2}
        placeholder="Por qué le conviene a alguien servir en este departamento..."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-bg/10">
        <div className="sm:col-span-2">
          <Textarea
            label="Testimonio (opcional)"
            value={form.testimonial}
            onChange={set('testimonial')}
            rows={2}
            placeholder="Cita textual de un voluntario real de este departamento -- déjalo vacío si aún no tienes una."
            helperText="Solo pon citas reales de personas reales que dieron su permiso -- no se muestra nada si lo dejas vacío."
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Autor del testimonio"
            value={form.testimonial_author}
            onChange={set('testimonial_author')}
            placeholder="ej. Ana López, voluntaria desde 2023"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t border-bg/10">
        <Button type="submit" variant="filled" disabled={loading} className="flex-1 justify-center">
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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-s text-bg font-black leading-tight">Voluntariado — Departamentos</h1>
          <p className="text-body-m text-bg/50 mt-0.5">
            Los departamentos que se muestran en la página pública de Voluntariado. La foto de
            cada uno se sube aparte, en Fotos del sitio (busca "Voluntariado").
          </p>
        </div>
        <Button variant="filled" onClick={() => { setEditing(null); setShowForm(!showForm); }}>
          {showForm ? 'Cancelar' : 'Nuevo departamento'}
        </Button>
      </div>

      {showForm && (
        <div className="glass-light rounded-[24px] card-spring p-4 sm:p-6">
          <h2 className="text-title-m mb-4">{editing ? 'Editar departamento' : 'Nuevo departamento'}</h2>
          <AreaForm
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
      ) : areas.length === 0 ? (
        <div className="glass-light rounded-[24px] card-spring flex flex-col items-center py-16 gap-4">
          <p className="text-body-l text-bg font-medium">Sin departamentos todavía</p>
        </div>
      ) : (
        <div className="glass-light rounded-[24px] card-spring overflow-hidden divide-y divide-bg/8">
          {areas.map(area => (
            <div key={area.ID} className={`p-4 flex flex-col sm:flex-row gap-4 sm:items-center hover:bg-bg/6 transition-colors ${area.is_active ? '' : 'opacity-60'}`}>
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
              <div className="flex items-center gap-3 text-13 font-semibold shrink-0 self-end sm:self-center">
                <button onClick={() => { setEditing(area); setShowForm(true); }} className="text-bg/55 hover:text-bg transition-colors">
                  Editar
                </button>
                <span className="text-bg/20">·</span>
                <button onClick={() => handleToggle(area)} className="text-bg/55 hover:text-bg transition-colors">
                  {area.is_active ? 'Ocultar' : 'Mostrar'}
                </button>
                <span className="text-bg/20">·</span>
                <button onClick={() => handleDelete(area.ID)} className="text-bg/55 hover:text-rose transition-colors">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
