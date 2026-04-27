import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const STATUS_CHIP = {
  pendiente:      { label: 'Pendiente',      cls: 'bg-surf-high text-on-surf-var' },
  asignado:       { label: 'Asignado',       cls: 'bg-pri-con text-on-pri-con' },
  coordinando:    { label: 'Coordinando',    cls: 'bg-sec-con text-on-sec-con' },
  usuario_creado: { label: 'Usuario creado', cls: 'bg-ter-con text-on-ter-con' },
};

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="w-6 h-6 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
  </div>
);

export default function LeaderVolunteers() {
  const [volunteers,   setVolunteers]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [createModal,  setCreateModal]  = useState(null);
  const [password,     setPassword]     = useState('');

  const load = () =>
    apiClient.get('/admin/volunteers')
      .then(r => setVolunteers(r.data || []))
      .catch(() => toast.error('Error al cargar voluntarios'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

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
      <div className="mb-6">
        <h1 className="text-headline-s text-on-surf font-black">Voluntarios asignados</h1>
        <p className="text-body-s text-on-surf-var mt-0.5">
          Coordina con estos voluntarios. Cuando estén listos, crea su usuario para que puedan acceder.
        </p>
      </div>

      {loading ? <Spinner /> : volunteers.length === 0 ? (
        <div className="text-center py-16 bg-surf-low border border-outline-var rounded-xl">
          <div className="leading-icon mx-auto mb-3">
            <span className="ms" style={{ fontSize: 28 }}>groups</span>
          </div>
          <p className="text-body-s text-on-surf-var">No tienes voluntarios asignados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {volunteers.map(v => {
            const chip = STATUS_CHIP[v.status] || STATUS_CHIP.pendiente;
            return (
              <div key={v.ID} className="bg-surf-low border border-outline-var rounded-xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-title-s text-on-surf font-semibold">{v.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-label-s font-medium ${chip.cls}`}>
                        {chip.label}
                      </span>
                    </div>
                    <p className="text-label-s text-on-surf-var">{v.email}</p>
                    {v.phone   && <p className="text-label-s text-on-surf-var">{v.phone}</p>}
                    {v.area    && <p className="text-body-s text-on-surf mt-0.5">Área: <strong>{v.area}</strong></p>}
                    {v.message && <p className="text-body-s text-on-surf-var mt-1 line-clamp-2">{v.message}</p>}
                  </div>
                  {v.status !== 'usuario_creado' && (
                    <button
                      onClick={() => setCreateModal(v.ID)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pri text-on-pri text-label-m font-medium hover:opacity-90 transition-opacity shrink-0"
                    >
                      <span className="ms" style={{ fontSize: 14 }}>person_add</span>
                      Crear usuario
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {createModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => { setCreateModal(null); setPassword(''); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-surf border border-outline-var rounded-xl p-6 w-full max-w-sm shadow-elev-5 animate-fade-in"
              onClick={e => e.stopPropagation()}>
              <h3 className="text-title-l text-on-surf font-bold mb-2">Crear usuario</h3>
              <p className="text-body-s text-on-surf-var mb-4 leading-relaxed">
                Define una contraseña temporal. El voluntario recibirá un correo para verificar su cuenta.
              </p>
              <Input
                label="Contraseña temporal"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                helperText="Mínimo 6 caracteres"
                autoFocus
              />
              <div className="flex gap-2 mt-6">
                <Button variant="outlined" className="flex-1" onClick={() => { setCreateModal(null); setPassword(''); }}>
                  Cancelar
                </Button>
                <Button variant="filled" className="flex-1" onClick={handleCreateUser} disabled={password.length < 6}>
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
