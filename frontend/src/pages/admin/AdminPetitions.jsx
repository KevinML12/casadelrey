import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-6 h-6 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
  </div>
);

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
    } catch { toast.error('Error al actualizar'); }
  };

  const unread = petitions.filter(p => !p.is_answered).length;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-headline-s text-on-surf font-black">Peticiones</h1>
          {unread > 0 && (
            <p className="text-label-s text-on-surf-var mt-0.5">{unread} sin responder</p>
          )}
        </div>
        {unread > 0 && (
          <span className="px-3 py-1 rounded-full bg-pri-con text-on-pri-con text-label-m font-bold">
            {unread} nueva{unread > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? <Spinner /> : petitions.length === 0 ? (
        <div className="text-center py-16 bg-surf-low border border-outline-var rounded-xl">
          <div className="leading-icon mx-auto mb-3">
            <span className="ms" style={{ fontSize: 24 }}>inbox</span>
          </div>
          <p className="text-body-s text-on-surf-var">No hay peticiones aún.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {petitions.map(p => (
            <div key={p.ID}
              className={`bg-surf-low border rounded-xl p-5 transition-all ${
                p.is_answered ? 'border-outline-var opacity-70' : 'border-pri/30 shadow-elev-1'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-title-s text-on-surf font-semibold">{p.name}</span>
                    {!p.is_answered && (
                      <span className="px-2 py-0.5 rounded-full text-label-s font-bold bg-pri-con text-on-pri-con">Nueva</span>
                    )}
                  </div>
                  {p.email   && <p className="text-label-s text-on-surf-var">{p.email}</p>}
                  {p.subject && <p className="text-body-s text-on-surf font-medium mt-0.5">{p.subject}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-label-s text-on-surf-var">
                    {p.CreatedAt ? new Date(p.CreatedAt).toLocaleDateString('es-ES') : '—'}
                  </span>
                  {!p.is_answered && (
                    <button
                      onClick={() => markRead(p.ID)}
                      className="w-8 h-8 rounded-lg bg-ter-con text-on-ter-con hover:opacity-80 flex items-center justify-center transition-opacity"
                      title="Marcar como respondida"
                    >
                      <span className="ms" style={{ fontSize: 16 }}>check</span>
                    </button>
                  )}
                </div>
              </div>
              {p.message && (
                <p className="text-body-s text-on-surf-var leading-relaxed bg-surf border border-outline-var rounded-lg px-4 py-3 mt-2">
                  {p.message}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
