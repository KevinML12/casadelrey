import { useEffect, useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const STATUS_LABELS = {
  pendiente: 'Pendiente',
  asignado: 'Asignado',
  coordinando: 'Coordinando',
  usuario_creado: 'Usuario creado',
};

export default function AdminVolunteers() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [volunteers, setVolunteers] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null);
  const [createModal, setCreateModal] = useState(null);
  const [password, setPassword] = useState('');

  const load = () =>
    apiClient.get('/admin/volunteers')
      .then(r => setVolunteers(r.data || []))
      .catch(() => toast.error('Error al cargar voluntarios'))
      .finally(() => setLoading(false));

  const loadLeaders = () =>
    apiClient.get('/admin/leaders')
      .then(r => setLeaders(r.data || []))
      .catch(() => {});

  useEffect(() => { load(); }, []);
  useEffect(() => { if (isAdmin) loadLeaders(); }, [isAdmin]);

  const handleAssign = async (id, leaderId) => {
    if (!leaderId) return;
    setAssigning(id);
    try {
      await apiClient.put(`/admin/volunteers/${id}/assign`, { leader_id: leaderId });
      toast.success('Voluntario asignado');
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al asignar');
    } finally {
      setAssigning(null);
    }
  };

  const handleCreateUser = async () => {
    if (!createModal || password.length < 6) {
      toast.error('La contraseña debe tener mínimo 6 caracteres');
      return;
    }
    try {
      await apiClient.post(`/admin/volunteers/${createModal}/create-user`, { password });
      toast.success('Usuario creado. Se envió correo de verificación.');
      setCreateModal(null);
      setPassword('');
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al crear usuario');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-ink">Voluntarios</h1>
          <p className="text-xs text-ink-3 mt-0.5">
            {isAdmin ? 'Inscripciones de interés. Asigna a un líder y crea usuarios cuando estén listos.' : 'Voluntarios asignados a ti. Crea su usuario cuando hayan coordinado.'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-line border-t-blue animate-spin" />
        </div>
      ) : volunteers.length === 0 ? (
        <div className="text-center py-16 bg-card border border-line rounded-xl">
          <Users size={32} className="mx-auto text-ink-3 mb-3" />
          <p className="text-ink-3 text-sm">No hay voluntarios aún.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {volunteers.map(v => (
            <div
              key={v.ID}
              className="bg-card border border-line rounded-xl p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-ink text-sm">{v.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      v.status === 'usuario_creado' ? 'bg-green-500/10 text-green-600' :
                      v.status === 'asignado' ? 'bg-blue/10 text-blue' :
                      'bg-ink-3/10 text-ink-3'
                    }`}>
                      {STATUS_LABELS[v.status] || v.status}
                    </span>
                  </div>
                  <p className="text-xs text-ink-3">{v.email}</p>
                  {v.phone && <p className="text-xs text-ink-3">{v.phone}</p>}
                  {v.area && <p className="text-xs text-ink-2 mt-0.5">Área: {v.area}</p>}
                  {v.message && <p className="text-xs text-ink-3 mt-1 line-clamp-2">{v.message}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isAdmin && v.status !== 'usuario_creado' && (
                    <select
                      className="text-xs rounded-md border border-line bg-transparent px-2 py-1.5 text-ink"
                      value={v.assigned_leader_id || ''}
                      onChange={(e) => handleAssign(v.ID, e.target.value ? Number(e.target.value) : null)}
                      disabled={!!assigning}
                    >
                      <option value="">Sin asignar</option>
                      {leaders.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  )}
                  {v.status !== 'usuario_creado' && (
                    <button
                      onClick={() => setCreateModal(v.ID)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-navy text-white text-xs font-medium hover:opacity-90"
                    >
                      <UserPlus size={12} /> Crear usuario
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {createModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => { setCreateModal(null); setPassword(''); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-line rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-ink mb-4">Crear usuario</h3>
              <p className="text-sm text-ink-3 mb-4">
                Se creará la cuenta con el nombre y correo del voluntario. Define una contraseña temporal.
              </p>
              <Input
                label="Contraseña temporal"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText="Mínimo 6 caracteres"
              />
              <div className="flex gap-2 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => { setCreateModal(null); setPassword(''); }}>
                  Cancelar
                </Button>
                <Button variant="navy" className="flex-1" onClick={handleCreateUser} disabled={password.length < 6}>
                  Crear usuario
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
