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
import { Icon } from '../../components/ui/Glass';
import { CELL_TYPES } from '../../components/ui/CellCodePicker';

const fieldCls = 'w-full px-4 py-2.5 rounded border border-bg/10 bg-transparent text-body-s text-bg placeholder:text-bg/50 hover:border-bg/20 focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all';

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
        <div>
          <label className="block text-label-l text-bg/50 mb-1.5">Código <span className="text-err">*</span></label>
          <input value={form.code} onChange={set('code')} className={fieldCls} placeholder="Ej. H1" required />
        </div>
        <div>
          <label className="block text-label-l text-bg/50 mb-1.5">Nombre <span className="text-err">*</span></label>
          <input value={form.name} onChange={set('name')} className={fieldCls} placeholder="Ej. Guerreros del Rey" required />
        </div>
        <div>
          <label className="block text-label-l text-bg/50 mb-1.5">Tipo <span className="text-err">*</span></label>
          <select value={form.type} onChange={set('type')} className={fieldCls} required>
            <option value="">Selecciona un tipo…</option>
            {CELL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-label-l text-bg/50 mb-1.5">Líder <span className="text-err">*</span></label>
          <select value={form.leader_id} onChange={set('leader_id')} className={fieldCls} required>
            <option value="">Selecciona un líder…</option>
            {leaders.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-label-l text-bg/50 mb-1.5">Zona (aproximada, sin dirección exacta)</label>
          <input value={form.zone} onChange={set('zone')} className={fieldCls} placeholder="Ej. Zona 4" />
        </div>
      </div>

      <div>
        <label className="block text-label-l text-bg/50 mb-1.5">Descripción</label>
        <textarea value={form.description} onChange={set('description')} rows={3}
          className={fieldCls} placeholder="Qué hace especial a esta célula, a quién está dirigida…" />
      </div>

      <div className="flex gap-3 pt-2 border-t border-bg/10">
        <Button type="submit" variant="filled" disabled={loading} className="flex-1 justify-center">
          <Icon name="save" className="w-[16px] h-[16px]" stroke={1.8} />
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-title-l text-bg mb-1">Células</h1>
          <p className="text-body-m text-bg/50">
            Cada célula individual (código, líder, descripción) que se muestra en la
            página pública de Células al abrir un tipo.
          </p>
        </div>
        <Button variant="filled" onClick={() => { setEditing(null); setShowForm(!showForm); }}>
          <Icon name={showForm ? 'close' : 'add'} className="w-[18px] h-[18px]" stroke={1.8} />
          {showForm ? 'Cancelar' : 'Nueva célula'}
        </Button>
      </div>

      {showForm && (
        <div className="p-4 sm:p-6 rounded-2xl bg-bg/4 border border-bg/10">
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
        <div className="text-center py-12 text-bg/50">Cargando...</div>
      ) : cells.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-bg/10 text-bg/50">
          Aún no hay células registradas. Agrégalas con "Nueva célula".
        </div>
      ) : (
        <div className="space-y-3">
          {cells.map(cell => (
            <div key={cell.ID} className={`p-4 rounded-2xl border flex flex-col sm:flex-row gap-4 sm:items-center ${cell.is_active ? 'bg-bg/4 border-bg/10' : 'bg-bg/8 border-bg/15 opacity-70'}`}>
              <div className="w-11 h-11 rounded-xl bg-bg text-white flex items-center justify-center shrink-0 font-mono font-bold text-[13px]">
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
              <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                <button onClick={() => { setEditing({ ...cell, leader_id: cell.leader_id }); setShowForm(true); }} title="Editar"
                  className="p-1.5 rounded-full hover:bg-bg/8 text-bg/50 hover:text-bg transition-colors">
                  <Icon name="edit" className="w-[18px] h-[18px]" stroke={1.8} />
                </button>
                <button onClick={() => handleToggle(cell)} title={cell.is_active ? 'Ocultar' : 'Mostrar'}
                  className="p-1.5 rounded-full hover:bg-bg/8 text-bg/50 hover:text-bg transition-colors">
                  <Icon name={cell.is_active ? 'visibility' : 'visibility_off'} className="w-[18px] h-[18px]" stroke={1.8} />
                </button>
                <button onClick={() => handleDelete(cell.ID)} title="Eliminar"
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
