import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Chip, { FilterChip } from '../../components/ui/Chip';
import CellCodePicker from '../../components/ui/CellCodePicker';

const ROLES = ['member', 'leader', 'volunteer', 'admin'];

const ROLE_CONFIG = {
  admin:     { label: 'Admin',      color: 'error',     icon: 'shield' },
  leader:    { label: 'Líder',      color: 'primary',   icon: 'star' },
  volunteer: { label: 'Voluntario', color: 'secondary', icon: 'favorite' },
  member:    { label: 'Miembro',    color: 'default',   icon: 'person' },
};

// Modal para editar el código de célula de un líder
function CellModal({ user, onClose, onSaved }) {
  const [cellCode, setCellCode] = useState(user.cell_code || '');
  const [cellType, setCellType] = useState(user.cell_type || '');
  const [saving,   setSaving]   = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/admin/users/${user.ID}/cell`, { cell_code: cellCode, cell_type: cellType });
      toast.success('Código de célula actualizado');
      onSaved(user.ID, cellCode, cellType);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-surf rounded-2xl border border-outline-var shadow-elev-3 w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-title-l text-on-surf font-bold">Código de célula</h3>
            <p className="text-body-s text-on-surf-var mt-0.5">{user.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surf-dim text-on-surf-var transition-colors">
            <span className="ms" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        <CellCodePicker
          cellCode={cellCode}
          cellType={cellType}
          onChange={({ cell_code, cell_type }) => { setCellCode(cell_code); setCellType(cell_type); }}
        />

        <div className="flex gap-3 mt-6 pt-4 border-t border-outline-var">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-pri text-on-pri text-label-l font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <span className="ms" style={{ fontSize: 16 }}>save</span>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button onClick={onClose} className="px-4 h-10 rounded-xl text-label-l text-on-surf-var hover:bg-surf-dim transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleSelect({ userId, currentRole, onUpdated }) {
  const [saving, setSaving] = useState(false);

  const change = async (e) => {
    const role = e.target.value;
    setSaving(true);
    try {
      await apiClient.put(`/admin/users/${userId}/role`, { role });
      toast.success('Rol actualizado');
      onUpdated(userId, role);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar');
    } finally { setSaving(false); }
  };

  return (
    <select value={currentRole} onChange={change} disabled={saving}
      className="text-label-m h-8 px-3 rounded-lg border border-outline-var bg-transparent text-on-surf focus:outline-none focus:border-pri transition-colors cursor-pointer">
      {ROLES.map(r => <option key={r} value={r}>{ROLE_CONFIG[r]?.label || r}</option>)}
    </select>
  );
}

function UserAvatar({ name }) {
  const initials = (name || '?').split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
  return (
    <div className="w-10 h-10 rounded-xl bg-sec-con flex items-center justify-center shrink-0">
      <span className="text-label-l text-on-sec-con font-bold">{initials || '?'}</span>
    </div>
  );
}

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-6 h-6 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
  </div>
);

export default function AdminUsers() {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState('');
  const [cellModal,  setCellModal]  = useState(null); // user object o null

  useEffect(() => {
    apiClient.get('/admin/users')
      .then(r => setUsers(r.data || []))
      .catch(() => toast.error('No se pudieron cargar usuarios'))
      .finally(() => setLoading(false));
  }, []);

  const updateRole = (id, role) =>
    setUsers(prev => prev.map(u => u.ID === id ? { ...u, role } : u));

  const updateCell = (id, cell_code, cell_type) =>
    setUsers(prev => prev.map(u => u.ID === id ? { ...u, cell_code, cell_type } : u));

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchFilter = !filter || u.role === filter;
    return matchSearch && matchFilter;
  });

  const counts = ROLES.reduce((acc, r) => {
    acc[r] = users.filter(u => u.role === r).length;
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {cellModal && (
        <CellModal
          user={cellModal}
          onClose={() => setCellModal(null)}
          onSaved={updateCell}
        />
      )}

      {/* Page header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-pri-con flex items-center justify-center shrink-0">
          <span className="ms text-on-pri-con" style={{ fontSize: 22 }}>manage_accounts</span>
        </div>
        <div>
          <h1 className="text-headline-s text-on-surf font-black leading-tight">Usuarios</h1>
          <p className="text-body-s text-on-surf-var mt-0.5">{users.length} personas registradas</p>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 relative">
          <span className="ms absolute left-3 top-1/2 -translate-y-1/2 text-on-surf-var pointer-events-none" style={{ fontSize: 18 }}>search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o correo…"
            className="w-full pl-10 pr-4 py-2.5 rounded border border-outline-var bg-transparent text-body-s text-on-surf placeholder:text-on-surf-var hover:border-on-surf-var focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all" />
        </div>
      </div>

      {/* Filter chips por rol */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <FilterChip selected={filter === ''} icon="apps" onClick={() => setFilter('')}>
          Todos
        </FilterChip>
        {ROLES.map(r => {
          const cfg = ROLE_CONFIG[r];
          return (
            <FilterChip key={r} selected={filter === r} icon={cfg.icon}
              count={counts[r] || 0}
              onClick={() => setFilter(r)}>
              {cfg.label}
            </FilterChip>
          );
        })}
      </div>

      {/* Lista */}
      <div className="bg-surf-low border border-outline-var rounded-2xl overflow-hidden">
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-4 text-on-surf-var">
            <div className="w-16 h-16 rounded-[28px] bg-surf-high flex items-center justify-center">
              <span className="ms" style={{ fontSize: 32 }}>person_search</span>
            </div>
            <div className="text-center">
              <p className="text-body-l text-on-surf font-medium">Sin resultados</p>
              <p className="text-body-s text-on-surf-var mt-1">
                {search ? `No hay usuarios que coincidan con "${search}".` : 'No hay usuarios con ese rol.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-outline-var">
            {filtered.map(u => {
              const cfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.member;
              return (
                <div key={u.ID} className="flex items-center gap-4 px-5 py-4 hover:bg-surf-high transition-colors">

                  {/* Avatar */}
                  <UserAvatar name={u.name} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-body-l text-on-surf font-medium truncate">{u.name || '(sin nombre)'}</span>
                      <Chip color={cfg.color} icon={cfg.icon}>{cfg.label}</Chip>
                      {u.cell_code && (
                        <Chip color="default">{u.cell_code}</Chip>
                      )}
                    </div>
                    <p className="text-body-s text-on-surf-var truncate">{u.email}</p>
                    {u.cell_type && (
                      <p className="text-label-s text-on-surf-var capitalize mt-0.5">{u.cell_type}</p>
                    )}
                  </div>

                  {/* Botón código célula — solo visible para líderes */}
                  {u.role === 'leader' && (
                    <button
                      onClick={() => setCellModal(u)}
                      className="shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-lg border border-outline-var text-label-m text-on-surf-var hover:border-pri hover:text-pri transition-colors font-mono"
                      title="Editar código de célula"
                    >
                      <span className="ms" style={{ fontSize: 14 }}>tag</span>
                      {u.cell_code || 'Sin código'}
                    </button>
                  )}

                  {/* Role selector */}
                  <div className="shrink-0">
                    <RoleSelect userId={u.ID} currentRole={u.role} onUpdated={updateRole} />
                  </div>

                  {/* Date */}
                  <p className="text-label-s text-on-surf-var shrink-0 hidden sm:block">
                    {u.CreatedAt ? new Date(u.CreatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
