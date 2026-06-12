import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import apiClient from '../../lib/apiClient';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function ProfilePage() {
  const { user } = useAuth();
  const [goals,    setGoals]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [adding,   setAdding]   = useState(false);

  const loadGoals = () => {
    apiClient.get('/profile/goals')
      .then(r => setGoals(r.data || []))
      .catch(() => setGoals([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadGoals(); }, []);

  const addGoal = async (e) => {
    e?.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      await apiClient.post('/profile/goals', { title: newTitle.trim() });
      setNewTitle('');
      loadGoals();
      toast.success('Meta agregada');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al agregar');
    } finally { setAdding(false); }
  };

  const toggleGoal = async (g) => {
    try {
      await apiClient.put(`/profile/goals/${g.ID}`, { completed: !g.completed });
      loadGoals();
    } catch { toast.error('Error al actualizar'); }
  };

  const deleteGoal = async (id) => {
    try {
      await apiClient.delete(`/profile/goals/${id}`);
      loadGoals();
      toast.success('Meta eliminada');
    } catch { toast.error('Error al eliminar'); }
  };

  const initial = (user?.name || user?.email || '?')[0].toUpperCase();

  return (
    <div className="min-h-screen bg-surf py-12">
      <div className="max-w-xl mx-auto px-6">
        <h1 className="text-headline-s text-on-surf font-black mb-8">Mi Perfil</h1>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-pri-con flex items-center justify-center shrink-0">
            <span className="text-on-pri-con text-headline-s font-black">{initial}</span>
          </div>
          <div>
            <p className="text-title-l text-on-surf font-bold">{user?.name || 'Sin nombre'}</p>
            <p className="text-body-s text-on-surf-var">{user?.email}</p>
            <p className="text-label-s text-on-surf-var capitalize mt-0.5">{user?.role || 'usuario'}</p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-surf-low border border-outline-var rounded-xl overflow-hidden mb-8">
          {[
            { icon: 'mail',   label: 'Correo electrónico', value: user?.email || '—' },
            { icon: 'shield', label: 'Rol',                value: user?.role || 'usuario', capitalize: true },
          ].map(({ icon, label, value, capitalize }) => (
            <div key={label} className="flex items-center gap-3 px-5 py-4 border-b border-outline-var last:border-0">
              <span className="ms text-on-surf-var" style={{ fontSize: 18 }}>{icon}</span>
              <div>
                <p className="text-label-s text-on-surf-var font-medium">{label}</p>
                <p className={`text-body-s text-on-surf font-medium mt-0.5 ${capitalize ? 'capitalize' : ''}`}>{value}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3 px-5 py-4">
            <span className="ms text-on-surf-var" style={{ fontSize: 18 }}>person</span>
            <div>
              <p className="text-label-s text-on-surf-var font-medium">Estado de cuenta</p>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-label-s font-medium bg-ter-con text-on-ter-con mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ter" />
                Activa
              </span>
            </div>
          </div>
        </div>

        {/* Metas */}
        <div className="mb-8">
          <h2 className="text-title-l text-on-surf font-bold mb-4 flex items-center gap-2">
            <span className="ms text-pri" style={{ fontSize: 22 }}>flag</span>
            Mis metas
          </h2>
          <form onSubmit={addGoal} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Nueva meta..."
              className="flex-1 px-4 py-2.5 rounded-full border border-outline-var bg-transparent text-body-s text-on-surf placeholder:text-on-surf-var focus:outline-none focus:border-pri transition-colors"
            />
            <button
              type="submit"
              disabled={adding || !newTitle.trim()}
              className="w-10 h-10 rounded-full bg-pri text-on-pri flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <span className="ms" style={{ fontSize: 20 }}>add</span>
            </button>
          </form>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
            </div>
          ) : goals.length === 0 ? (
            <p className="text-body-s text-on-surf-var py-4">Aún no tienes metas. ¡Agrega una!</p>
          ) : (
            <div className="space-y-2">
              {goals.map(g => (
                <div key={g.ID}
                  className={`flex items-center gap-3 p-4 rounded-xl border border-outline-var bg-surf-low ${g.completed ? 'opacity-60' : ''}`}>
                  <button
                    onClick={() => toggleGoal(g)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      g.completed ? 'bg-ter border-ter text-ink' : 'border-outline hover:border-pri'
                    }`}
                  >
                    {g.completed && <span className="ms" style={{ fontSize: 14 }}>check</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-body-s text-on-surf font-medium ${g.completed ? 'line-through text-on-surf-var' : ''}`}>
                      {g.title}
                    </p>
                    {g.target_date && (
                      <p className="text-label-s text-on-surf-var mt-0.5">Para: {g.target_date}</p>
                    )}
                  </div>
                  <button onClick={() => deleteGoal(g.ID)}
                    className="text-on-surf-var hover:text-err p-1 shrink-0 transition-colors">
                    <span className="ms" style={{ fontSize: 16 }}>delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="tonal" onClick={() => toast('Próximamente disponible')}>
            <span className="ms" style={{ fontSize: 16 }}>edit</span>
            Editar perfil
          </Button>
          <Button variant="outlined" onClick={() => toast('Próximamente disponible')}>
            <span className="ms" style={{ fontSize: 16 }}>lock</span>
            Cambiar contraseña
          </Button>
        </div>
      </div>
    </div>
  );
}
