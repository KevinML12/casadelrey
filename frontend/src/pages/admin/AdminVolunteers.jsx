import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button, { IconButton } from '../../components/ui/Button';
import Chip from '../../components/ui/Chip';

const STATUS_CHIP = {
  pendiente:      { label: 'Pendiente',      color: 'default' },
  asignado:       { label: 'Asignado',       color: 'primary' },
  coordinando:    { label: 'Coordinando',    color: 'secondary' },
  usuario_creado: { label: 'Usuario creado', color: 'tertiary' },
};

const DEPT_LABEL = {
  alabanza:              'Alabanza',
  danza:                 'Danza',
  servidores:            'Servidores',
  protocolo:             'Protocolo',
  pancartas:             'Pancartas',
  maestros_ninos:        'Maestros de Niños',
  tecnicos_audiovisuales:'Técnicos AV',
  multimedia:            'Multimedia',
  oracion:               'Oración',
  logistica:             'Logística',
};

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="w-6 h-6 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
  </div>
);

function EmptyState({ isAdmin }) {
  return (
    <div className="flex flex-col items-center py-20 gap-4 text-on-surf-var">
      <div className="w-16 h-16 rounded-[28px] bg-surf-high flex items-center justify-center">
        <span className="ms" style={{ fontSize: 32 }}>group_add</span>
      </div>
      <div className="text-center">
        <p className="text-body-l text-on-surf font-medium">Sin voluntarios</p>
        <p className="text-body-s text-on-surf-var mt-1">
          {isAdmin
            ? 'Las inscripciones del formulario público aparecerán aquí.'
            : 'Los voluntarios asignados a ti aparecerán aquí.'}
        </p>
      </div>
    </div>
  );
}

export default function AdminVolunteers() {
  const { user }   = useAuth();
  const isAdmin    = user?.role === 'admin';
  const [volunteers,   setVolunteers]   = useState([]);
  const [leaders,      setLeaders]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [assigning,    setAssigning]    = useState(null);
  const [createModal,  setCreateModal]  = useState(null);
  const [password,     setPassword]     = useState('');

  const load = () =>
    apiClient.get('/admin/volunteers')
      .then(r => setVolunteers(r.data?.data || r.data || []))
      .catch(() => toast.error('Error al cargar voluntarios'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (isAdmin) apiClient.get('/admin/leaders').then(r => setLeaders(r.data?.data || r.data || [])).catch(() => {});
  }, [isAdmin]);

  const handleAssign = async (id, leaderId) => {
    if (!leaderId) return;
    setAssigning(id);
    try {
      await apiClient.put(`/admin/volunteers/${id}/assign`, { leader_id: Number(leaderId) });
      toast.success('Voluntario asignado');
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al asignar');
    } finally { setAssigning(null); }
  };

  const handleCreateUser = async () => {
    if (!createModal || password.length < 6) { toast.error('Contraseña mínimo 6 caracteres'); return; }
    try {
      await apiClient.post(`/admin/volunteers/${createModal}/create-user`, { password });
      toast.success('Usuario creado. Se envió correo de verificación.');
      setCreateModal(null);
      setPassword('');
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Error al crear usuario'); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Page header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-sec-con flex items-center justify-center shrink-0">
          <span className="ms text-on-sec-con" style={{ fontSize: 22 }}>group_add</span>
        </div>
        <div>
          <h1 className="text-headline-s text-on-surf font-black leading-tight">Voluntarios</h1>
          <p className="text-body-s text-on-surf-var mt-0.5">
            {isAdmin
              ? 'Inscripciones de interés. Asigna a un líder y crea usuarios.'
              : 'Voluntarios asignados a ti.'}
          </p>
        </div>
      </div>

      {loading ? <Spinner /> : volunteers.length === 0 ? (
        <div className="bg-surf-low border border-outline-var rounded-2xl">
          <EmptyState isAdmin={isAdmin} />
        </div>
      ) : (
        <div className="bg-surf-low border border-outline-var rounded-2xl overflow-hidden divide-y divide-outline-var">
          {volunteers.map(v => {
            const chip = STATUS_CHIP[v.status] || STATUS_CHIP.pendiente;
            const deptLabel = DEPT_LABEL[v.department] || v.department || v.area;
            return (
              <div key={v.ID} className="flex items-start gap-4 p-5 hover:bg-surf-high transition-colors">

                {/* Leading icon */}
                <div className="w-10 h-10 rounded-xl bg-sec-con flex items-center justify-center shrink-0 mt-0.5">
                  <span className="ms text-on-sec-con" style={{ fontSize: 18 }}>person</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-body-l text-on-surf font-medium">{v.name}</span>
                    <Chip color={chip.color}>{chip.label}</Chip>
                    {deptLabel && (
                      <Chip color="secondary">{deptLabel}</Chip>
                    )}
                  </div>
                  <p className="text-body-s text-on-surf-var">{v.email}</p>
                  {v.phone && <p className="text-body-s text-on-surf-var">{v.phone}</p>}
                  {v.message && (
                    <p className="text-body-s text-on-surf-var mt-2 line-clamp-2 leading-relaxed">{v.message}</p>
                  )}
                </div>

                {/* Trailing actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {isAdmin && v.status !== 'usuario_creado' && (
                    <select
                      className="text-label-m rounded-lg border border-outline-var bg-surf px-3 py-1.5 text-on-surf focus:outline-none focus:border-pri transition-colors"
                      value={v.assigned_leader_id || ''}
                      onChange={e => handleAssign(v.ID, e.target.value)}
                      disabled={!!assigning}
                    >
                      <option value="">Sin asignar</option>
                      {leaders.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  )}
                  {v.status !== 'usuario_creado' && (
                    <Button variant="tonal" size="sm" onClick={() => setCreateModal(v.ID)}>
                      <span className="ms" style={{ fontSize: 16 }}>person_add</span>
                      Crear usuario
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* M3 Dialog — crear usuario */}
      {createModal && (
        <>
          <div className="fixed inset-0 bg-scrim/50 z-40 animate-fade-in"
            style={{ background: 'rgba(0,0,0,.5)' }}
            onClick={() => { setCreateModal(null); setPassword(''); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-surf rounded-[28px] p-6 w-full max-w-sm shadow-elev-5 animate-fade-in"
              onClick={e => e.stopPropagation()}>

              {/* Dialog icon */}
              <div className="w-12 h-12 rounded-2xl bg-pri-con flex items-center justify-center mx-auto mb-4">
                <span className="ms text-on-pri-con" style={{ fontSize: 24 }}>person_add</span>
              </div>

              <h3 className="text-headline-s text-on-surf font-black text-center mb-2">Crear usuario</h3>
              <p className="text-body-m text-on-surf-var text-center mb-6 leading-relaxed">
                Se creará la cuenta con el nombre y correo del voluntario. Define una contraseña temporal.
              </p>

              <Input
                label="Contraseña temporal"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                helperText="Mínimo 6 caracteres"
                autoFocus
              />

              <div className="flex gap-3 mt-6">
                <Button variant="text" className="flex-1 justify-center"
                  onClick={() => { setCreateModal(null); setPassword(''); }}>
                  Cancelar
                </Button>
                <Button variant="filled" className="flex-1 justify-center"
                  onClick={handleCreateUser} disabled={password.length < 6}>
                  Crear
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
