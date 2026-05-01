import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Chip from '../../components/ui/Chip';
import { IconButton } from '../../components/ui/Button';

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-6 h-6 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
  </div>
);

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-20 gap-4 text-on-surf-var">
      <div className="w-16 h-16 rounded-[28px] bg-surf-high flex items-center justify-center">
        <span className="ms" style={{ fontSize: 32 }}>inbox</span>
      </div>
      <div className="text-center">
        <p className="text-body-l text-on-surf font-medium">Sin peticiones</p>
        <p className="text-body-s text-on-surf-var mt-1">Las peticiones de oración aparecerán aquí.</p>
      </div>
    </div>
  );
}

export default function AdminPetitions() {
  const [petitions, setPetitions] = useState([]);
  const [loading,   setLoading]   = useState(true);

  const load = () =>
    apiClient.get('/admin/petitions')
      .then(r => setPetitions(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try {
      await apiClient.put(`/admin/petitions/${id}/read`);
      setPetitions(prev => prev.map(p => p.ID === id ? { ...p, is_answered: true } : p));
      toast.success('Marcada como respondida');
    } catch { toast.error('Error al actualizar'); }
  };

  const unread = petitions.filter(p => !p.is_answered).length;

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-ter-con flex items-center justify-center shrink-0">
            <span className="ms text-on-ter-con" style={{ fontSize: 22 }}>volunteer_activism</span>
          </div>
          <div>
            <h1 className="text-headline-s text-on-surf font-black leading-tight">Peticiones</h1>
            <p className="text-body-s text-on-surf-var mt-0.5">
              {unread > 0
                ? <><span className="text-pri font-semibold">{unread}</span> sin responder</>
                : 'Todas respondidas'}
            </p>
          </div>
        </div>
        {unread > 0 && (
          <Chip color="primary">{unread} nueva{unread > 1 ? 's' : ''}</Chip>
        )}
      </div>

      {loading ? <Spinner /> : petitions.length === 0 ? (
        <div className="bg-surf-low border border-outline-var rounded-2xl overflow-hidden">
          <EmptyState />
        </div>
      ) : (
        <div className="bg-surf-low border border-outline-var rounded-2xl overflow-hidden divide-y divide-outline-var">
          {petitions.map(p => (
            <div key={p.ID}
              className={`flex items-start gap-4 p-5 transition-colors ${
                p.is_answered ? 'opacity-60' : 'hover:bg-surf-high'
              }`}
            >
              {/* Leading icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                p.is_answered ? 'bg-surf-high' : 'bg-ter-con'
              }`}>
                <span className={`ms ${p.is_answered ? 'text-on-surf-var' : 'text-on-ter-con'}`}
                  style={{ fontSize: 18 }}>
                  {p.is_answered ? 'mark_email_read' : 'volunteer_activism'}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-body-l text-on-surf font-medium">{p.name}</span>
                  {p.subject && (
                    <span className="text-body-s text-on-surf-var">· {p.subject}</span>
                  )}
                  {!p.is_answered && (
                    <Chip color="primary">Nueva</Chip>
                  )}
                </div>
                {p.email && (
                  <p className="text-body-s text-on-surf-var mb-2">{p.email}</p>
                )}
                {p.message && (
                  <p className="text-body-s text-on-surf-var leading-relaxed bg-surf border border-outline-var rounded-xl px-4 py-3">
                    {p.message}
                  </p>
                )}
                <p className="text-label-s text-on-surf-var mt-2">
                  {p.CreatedAt ? new Date(p.CreatedAt).toLocaleDateString('es-ES', {
                    day: '2-digit', month: 'long', year: 'numeric'
                  }) : '—'}
                </p>
              </div>

              {/* Trailing action */}
              {!p.is_answered && (
                <IconButton
                  variant="tonal"
                  onClick={() => markRead(p.ID)}
                  title="Marcar como respondida"
                  className="shrink-0 mt-0.5"
                >
                  <span className="ms" style={{ fontSize: 18 }}>check</span>
                </IconButton>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
