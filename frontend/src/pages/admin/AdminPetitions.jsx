import { useEffect, useState } from 'react';
import { Check, Inbox } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';

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
      setPetitions(prev => prev.map(p => p.id === id ? { ...p, read: true } : p));
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const unread = petitions.filter(p => !p.read).length;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-ink">Peticiones</h1>
          {unread > 0 && (
            <p className="text-xs text-ink-3 mt-0.5">{unread} sin leer</p>
          )}
        </div>
        {unread > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-blue/10 text-blue text-xs font-bold">{unread} nueva{unread > 1 ? 's' : ''}</span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-line border-t-blue animate-spin" />
        </div>
      ) : petitions.length === 0 ? (
        <div className="text-center py-16 bg-card border border-line rounded-xl">
          <Inbox size={32} className="mx-auto text-ink-3 mb-3" />
          <p className="text-ink-3 text-sm">No hay peticiones aún.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {petitions.map(p => (
            <div key={p.id}
              className={`bg-card border rounded-xl p-5 transition-all ${p.read ? 'border-line opacity-70' : 'border-blue/20 shadow-sm'}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-ink text-sm">{p.name}</span>
                    {!p.read && (
                      <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-blue/10 text-blue">Nueva</span>
                    )}
                  </div>
                  {p.email && <p className="text-xs text-ink-3">{p.email}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-ink-3">
                    {new Date(p.CreatedAt).toLocaleDateString('es-ES')}
                  </span>
                  {!p.read && (
                    <button onClick={() => markRead(p.id)}
                      className="w-7 h-7 rounded-lg bg-ok/10 text-ok hover:bg-ok/20 flex items-center justify-center transition-colors"
                      title="Marcar como leída">
                      <Check size={13} />
                    </button>
                  )}
                </div>
              </div>
              {p.request && (
                <p className="text-sm text-ink-2 leading-relaxed bg-bg-2 border border-line rounded-lg px-4 py-3 mt-2">
                  {p.request}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
