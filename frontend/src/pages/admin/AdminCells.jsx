import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input, { Select, Textarea } from '../../components/ui/Input';
import ModalWrapper from '../../components/ui/ModalWrapper';
import AdminResourceState from '../../components/ui/AdminResourceState';
import CellAdminNav from '../../components/ui/CellAdminNav';
import { CELL_TYPES } from '../../components/ui/CellCodePicker';

const EMPTY = { code: '', name: '', type: '', description: '', leader_id: '', zone: '', day: '', time: '', what_to_expect: '', address: '', map_url: '' };

function CellForm({ onSave, onCancel, initialData, leaders, onBusy }) {
  const [form, setForm] = useState({ ...EMPTY, ...initialData });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.name || !form.type || !form.leader_id) {
      toast.error('Código, nombre, tipo y líder son obligatorios');
      return;
    }
    setLoading(true); onBusy(true); setError('');
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
      setError(err.response?.data?.error || 'No se pudo guardar. Tus cambios siguen en el formulario.');
    } finally { setLoading(false); onBusy(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p role="alert" className="rounded-xl bg-rose/10 p-3 text-14 text-bg">{error}</p>}
      <fieldset disabled={loading} className="space-y-5">
      <h3 className="text-15 font-bold">Identificación y responsable</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Código *" value={form.code} onChange={set('code')} placeholder="Ej. H1" helperText="Conserva el código existente; los nuevos usan H, M, J, P o N y un número." required />
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

        {/* Día y hora: es lo primero que pregunta quien quiere ir, y hasta
            ago-2026 el sitio público no lo decía en ningún lado. Texto
            libre a propósito -- "Cada 15 días" o "Sábados alternos" son
            respuestas reales que un selector de días no admite. El líder
            también puede editarlos desde su panel, que es quien se entera
            primero si esta semana cambió la hora. */}
        <Input label="Día" value={form.day || ''} onChange={set('day')} placeholder="Ej. Miércoles" />
        <Input label="Hora" value={form.time || ''} onChange={set('time')} placeholder="Ej. 7:00 PM" />
      </div>

      <h3 className="text-15 font-bold">Ubicación y reunión</h3>
      <p className="text-13 text-bg/60">La zona, dirección y mapa que guardes se muestran en la información pública de esta célula.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Textarea
          label="Dirección exacta"
          value={form.address || ''}
          onChange={set('address')}
          rows={2}
          placeholder="Ej. 4a Calle 10-30, Zona 1..."
        />
        <Textarea
          label="Enlace del Mapa (Google Maps / Waze)"
          value={form.map_url || ''}
          onChange={set('map_url')}
          rows={2}
          placeholder="https://maps.app.goo.gl/..."
        />
      </div>

      <Textarea
        label="¿Qué esperar en una reunión?"
        value={form.what_to_expect || ''}
        onChange={set('what_to_expect')}
        rows={2}
        placeholder="Lo que pasa en una reunión típica -- es la pregunta silenciosa de quien nunca ha ido a orar a casa de un desconocido."
      />

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
        <Button type="button" variant="text" onClick={onCancel} disabled={loading}>Cancelar</Button>
      </div>
      </fieldset>
    </form>
  );
}

const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function AdminCells() {
  const [cells, setCells] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [visibility, setVisibility] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const load = async () => {
    setLoading(true); setError('');
    try {
      const [cellRes, leaderRes] = await Promise.all([apiClient.get('/admin/cells'), apiClient.get('/admin/leaders')]);
      if (!Array.isArray(cellRes.data) || !Array.isArray(leaderRes.data)) throw new Error();
      setCells(cellRes.data);
      const assigned = cellRes.data.filter(cell => cell.leader?.name).map(cell => ({ id: cell.leader_id, name: cell.leader.name }));
      const choices = [...leaderRes.data.map(leader => ({ ...leader, id: leader.id || leader.ID })), ...assigned];
      setLeaders([...new Map(choices.map(leader => [leader.id, leader])).values()]);
    } catch { setError('No pudimos cargar las células y sus responsables.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const toggle = async cell => {
    setUpdating(cell.ID);
    try {
      await apiClient.put(`/admin/cells/${cell.ID}`, { ...cell, is_active: !cell.is_active });
      setCells(rows => rows.map(row => row.ID === cell.ID ? { ...row, is_active: !cell.is_active } : row));
      toast.success(cell.is_active ? 'Célula oculta' : 'Célula publicada');
    } catch { toast.error('No se pudo cambiar la visibilidad. Inténtalo de nuevo.'); }
    finally { setUpdating(null); }
  };
  const filtered = cells.filter(cell => (!type || cell.type === type) && (!visibility || (cell.is_active ? 'visible' : 'hidden') === visibility) && normalize([cell.name, cell.code, cell.zone, cell.leader?.name].join(' ')).includes(normalize(search)));
  const types = [...CELL_TYPES, ...[...new Set(cells.map(cell => cell.type))].filter(value => value && !CELL_TYPES.some(item => item.value === value)).map(value => ({ value, label: value }))];
  const close = () => { if (!busy) setEditing(null); };
  return <div className="mx-auto max-w-5xl space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl"><h1 className="text-28 font-bold tracking-tightish">Células</h1><p className="mt-2 text-15 leading-relaxed text-bg/65">Edita grupos, líderes y horarios. Cambia las fotografías en Categorías y fotos.</p></div>
      <Button onClick={() => setEditing({})} disabled={loading || !!error}>Nueva célula</Button>
    </header>
    <CellAdminNav />
    {loading || error ? <AdminResourceState loading={loading} error={error} onRetry={load} /> : <>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-14 text-bg/65"><p><strong className="text-bg">{cells.length}</strong> células</p><p><strong className="text-bg">{cells.filter(cell => cell.is_active).length}</strong> publicadas</p><p><strong className="text-bg">{cells.filter(cell => !cell.is_active).length}</strong> ocultas</p></div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex min-w-0 flex-1 items-end gap-2">
        <Input label="Buscar células" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Nombre, código, zona o líder" />
        <Button variant="outlined" className="sm:hidden" aria-expanded={filtersOpen} aria-controls="cell-filters" onClick={() => setFiltersOpen(value => !value)}>Filtrar{type || visibility ? ' ·' : ''}</Button></div>
        <div id="cell-filters" className={`${filtersOpen ? 'grid' : 'hidden'} min-w-0 gap-4 sm:grid sm:grid-cols-2 lg:w-[45%]`}>
        <Select label="Tipo de célula" value={type} onChange={event => setType(event.target.value)} options={types} placeholder="Todos los tipos" />
        <Select label="Visibilidad" value={visibility} onChange={event => setVisibility(event.target.value)} options={[{ value: 'visible', label: 'Publicadas' }, { value: 'hidden', label: 'Ocultas' }]} placeholder="Todas" />
        </div>
      </div>
      <p role="status" className="text-13 text-bg/60">{filtered.length} de {cells.length} células</p>
      {!filtered.length ? <AdminResourceState empty={cells.length ? 'No hay células con esos filtros.' : 'Todavía no hay células. Crea la primera para publicarla.'} /> : <div className="glass-light overflow-hidden rounded-[16px] divide-y divide-bg/10">
        {filtered.map(cell => <article key={cell.ID} aria-label={cell.name} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-bg/5 px-2 py-1 font-mono text-12 font-bold">{cell.code}</span><h2 className="text-17 font-bold">{cell.name}</h2><span className={`rounded-md px-2 py-1 text-11 font-semibold ${cell.is_active ? 'bg-bg text-white' : 'bg-bg/5 text-bg/60'}`}>{cell.is_active ? 'Publicada' : 'Oculta'}</span></div>
            <p className="mt-2 text-13 text-bg/65">{types.find(item => item.value === cell.type)?.label || cell.type} · {cell.leader?.name || 'Sin responsable'}{cell.zone ? ` · ${cell.zone}` : ''}</p>
            <p className="mt-1 text-13 text-bg/65">{[cell.day, cell.time].filter(Boolean).join(' · ') || 'Horario pendiente de definir'}</p>
          </div>
          <div className="flex flex-wrap gap-2"><Button variant="outlined" onClick={() => setEditing(cell)}>Editar</Button><Button variant="text" onClick={() => toggle(cell)} disabled={updating === cell.ID}>{updating === cell.ID ? 'Guardando…' : cell.is_active ? 'Ocultar' : 'Mostrar'}</Button></div>
        </article>)}
      </div>}
    </>}
    {editing && <ModalWrapper wide busy={busy} ariaLabel={editing.ID ? 'Editar célula' : 'Nueva célula'} onClose={close}>
      <h2 className="mb-6 text-24 font-bold">{editing.ID ? 'Editar célula' : 'Nueva célula'}</h2>
      {!leaders.length && <p className="mb-5 text-14 text-bg/65">Para publicar una célula necesitas asignar un usuario con rol de líder desde Usuarios.</p>}
      <CellForm key={editing.ID || 'new'} initialData={editing} leaders={leaders} onBusy={setBusy} onCancel={close} onSave={() => { setEditing(null); load(); }} />
    </ModalWrapper>}
  </div>;
}
