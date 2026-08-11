// ============================================================
//  AdminCells — CRUD de células individuales (H1, M2, J3...). Antes
//  no existía forma de editarlas sin tocar código del frontend: vivían
//  hardcodeadas como fallback en CelulasPage.jsx. Esto es lo que las
//  hace de verdad administrables, con descripción propia por célula.
// ============================================================
import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input, { Select, Textarea } from '../../components/ui/Input';
import { CELL_TYPES } from '../../components/ui/CellCodePicker';

const EMPTY = { code: '', name: '', type: '', description: '', leader_id: '', zone: '' };

function CellForm({ onSave, onCancel, initialData, leaders }) {
  const [form, setForm] = useState(initialData || EMPTY);
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.name || !form.type || !form.leader_id) {
      toast.error('Código, nombre, tipo y líder son obligatorios');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, leader_id: Number(form.leader_id) };
      if (form.ID) {
        await apiClient.put(`/admin/cells/${form.ID}`, payload);
        toast.success('Célula actualizada');
      } else {
        await apiClient.post('/admin/cells', payload);
        toast.success('Célula creada');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Código *" value={form.code} onChange={set('code')} placeholder="Ej. H1" required />
        <Input label="Nombre *" value={form.name} onChange={set('name')} placeholder="Ej. Guerreros del Rey" required />
        <Select
          label="Tipo *"
          value={form.type}
          onChange={set('type')}
          options={CELL_TYPES}
          placeholder="Selecciona un tipo…"
          required
        />
        <Select
          label="Líder *"
          value={form.leader_id}
          onChange={set('leader_id')}
          options={leaders.map(l => ({ value: l.id, label: l.name }))}
          placeholder="Selecciona un líder…"
          required
        />
        <div className="sm:col-span-2">
          <Input
            label="Zona (aproximada, sin dirección exacta)"
            value={form.zone}
            onChange={set('zone')}
            placeholder="Ej. Zona 4"
          />
        </div>
      </div>

      <Textarea
        label="Descripción"
        value={form.description}
        onChange={set('description')}
        rows={3}
        placeholder="Qué hace especial a esta célula, a quién está dirigida…"
      />

      <div className="flex gap-3 pt-2 border-t border-bg/10">
        <Button type="submit" variant="filled" disabled={loading} className="flex-1 justify-center">
          {loading ? 'Guardando…' : (form.ID ? 'Actualizar' : 'Crear célula')}
        </Button>
        <Button type="button" variant="text" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

export default function AdminCells() {
  const [cells,   setCells]   = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      apiClient.get('/admin/cells'),
      apiClient.get('/admin/leaders'),
    ]).then(([cellsRes, leadersRes]) => {
      setCells(cellsRes.data || []);
      setLeaders(leadersRes.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (cell) => {
    try {
      await apiClient.put(`/admin/cells/${cell.ID}`, { ...cell, leader_id: cell.leader_id, is_active: !cell.is_active });
      toast.success(cell.is_active ? 'Ocultada del sitio' : 'Visible en el sitio');
      load();
    } catch { toast.error('Error al actualizar'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta célula?')) return;
    try {
      await apiClient.delete(`/admin/cells/${id}`);
      toast.success('Eliminada');
      load();
    } catch { toast.error('Error al eliminar'); }
  };

  const typeLabel = (value) => CELL_TYPES.find(t => t.value === value)?.label || value;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-headline-s text-bg font-black leading-tight">Células</h1>
            <p className="text-body-m text-bg/50 mt-0.5">
              Cada célula individual (código, líder, descripción) que se muestra en la
              página pública de Células al abrir un tipo.
            </p>
          </div>
        </div>
        <Button variant="filled" onClick={() => { setEditing(null); setShowForm(!showForm); }}>
          {showForm ? 'Cancelar' : 'Nueva célula'}
        </Button>
      </div>

      {showForm && (
        <div className="glass-light rounded-[24px] card-spring p-4 sm:p-6">
          <h2 className="text-title-m mb-4">{editing ? 'Editar célula' : 'Nueva célula'}</h2>
          <CellForm
            initialData={editing}
            leaders={leaders}
            onSave={() => { setShowForm(false); setEditing(null); load(); }}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-acento animate-spin" />
        </div>
      ) : cells.length === 0 ? (
        <div className="glass-light rounded-[24px] card-spring flex flex-col items-center py-16 gap-4">
          <p className="text-body-l text-bg font-medium">Sin células todavía</p>
        </div>
      ) : (
        <div className="glass-light rounded-[24px] card-spring overflow-hidden divide-y divide-bg/8">
          {cells.map(cell => (
            <div key={cell.ID} className={`p-4 flex flex-col sm:flex-row gap-4 sm:items-center hover:bg-bg/6 transition-colors ${cell.is_active ? '' : 'opacity-60'}`}>
              <div className="w-11 h-11 rounded-xl bg-bg text-white flex items-center justify-center shrink-0 font-mono font-bold text-13">
                {cell.code}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <p className="text-title-s text-bg font-medium">{cell.name}</p>
                  <span className="text-label-s text-bg/50 px-2 py-0.5 rounded-full bg-bg/8">{typeLabel(cell.type)}</span>
                  {cell.zone && <span className="text-label-s text-bg/50 px-2 py-0.5 rounded-full bg-bg/8">{cell.zone}</span>}
                </div>
                <p className="text-body-s text-bg/50">Líder: {cell.leader?.name || '—'}</p>
                {cell.description && (
                  <p className="text-label-s text-bg/45 mt-1 line-clamp-2">{cell.description}</p>
                )}
              </div>
              <div className="flex items-center gap-3 text-13 font-semibold shrink-0 self-end sm:self-center">
                <button onClick={() => { setEditing({ ...cell, leader_id: cell.leader_id }); setShowForm(true); }}
                  className="text-bg/55 hover:text-bg transition-colors">Editar</button>
                <span className="text-bg/20">·</span>
                <button onClick={() => handleToggle(cell)} className="text-bg/55 hover:text-bg transition-colors">
                  {cell.is_active ? 'Ocultar' : 'Mostrar'}
                </button>
                <span className="text-bg/20">·</span>
                <button onClick={() => handleDelete(cell.ID)} className="text-bg/55 hover:text-rose transition-colors">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
