import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Mail, Shield, Target, Plus, Check, Trash2 } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import Button from '../../components/ui/Button';

export default function ProfilePage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

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
    } finally {
      setAdding(false);
    }
  };

  const toggleGoal = async (g) => {
    try {
      await apiClient.put(`/profile/goals/${g.ID}`, { completed: !g.completed });
      loadGoals();
    } catch (err) {
      toast.error('Error al actualizar');
    }
  };

  const deleteGoal = async (id) => {
    try {
      await apiClient.delete(`/profile/goals/${id}`);
      loadGoals();
      toast.success('Meta eliminada');
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  const soon = () => toast('Próximamente disponible');

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-black text-ink mb-8">Mi Perfil</h1>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-xl bg-blue/10 flex items-center justify-center">
          <span className="text-blue font-black text-xl">
            {(user?.name || user?.email || '?')[0].toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-bold text-ink">{user?.name || 'Sin nombre'}</p>
          <p className="text-sm text-ink-3">{user?.email}</p>
          <p className="text-xs text-ink-3 capitalize mt-0.5">{user?.role || 'usuario'}</p>
        </div>
      </div>

      <div className="bg-card border border-line rounded-xl overflow-hidden mb-8">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-line">
          <Mail size={15} className="text-ink-3" />
          <div>
            <p className="text-xs text-ink-3 font-medium">Correo electrónico</p>
            <p className="text-sm text-ink font-medium mt-0.5">{user?.email || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-line">
          <Shield size={15} className="text-ink-3" />
          <div>
            <p className="text-xs text-ink-3 font-medium">Rol</p>
            <p className="text-sm text-ink font-medium mt-0.5 capitalize">{user?.role || 'usuario'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-4">
          <User size={15} className="text-ink-3" />
          <div>
            <p className="text-xs text-ink-3 font-medium">Estado de cuenta</p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-ok/10 text-ok mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-ok" /> Activa
            </span>
          </div>
        </div>
      </div>

      {/* Metas */}
      <div className="mb-8">
        <h2 className="font-bold text-ink mb-4 flex items-center gap-2">
          <Target size={18} /> Mis metas
        </h2>
        <form onSubmit={addGoal} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Nueva meta..."
            className="flex-1 px-4 py-2.5 rounded-lg border border-line bg-transparent text-ink text-sm placeholder:text-ink-3 focus:outline-none focus:border-blue"
          />
          <Button type="submit" variant="navy" disabled={adding || !newTitle.trim()}>
            <Plus size={16} />
          </Button>
        </form>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 rounded-full border-2 border-line border-t-blue animate-spin" />
          </div>
        ) : goals.length === 0 ? (
          <p className="text-sm text-ink-3 py-4">Aún no tienes metas. ¡Agrega una!</p>
        ) : (
          <div className="space-y-2">
            {goals.map(g => (
              <div
                key={g.ID}
                className={`flex items-center gap-3 p-4 rounded-xl border border-line bg-card ${
                  g.completed ? 'opacity-70' : ''
                }`}
              >
                <button
                  onClick={() => toggleGoal(g)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    g.completed ? 'bg-ok border-ok text-white' : 'border-line hover:border-blue'
                  }`}
                >
                  {g.completed && <Check size={14} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-ink text-sm ${g.completed ? 'line-through text-ink-3' : ''}`}>
                    {g.title}
                  </p>
                  {g.target_date && (
                    <p className="text-xs text-ink-3 mt-0.5">Para: {g.target_date}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteGoal(g.ID)}
                  className="text-ink-3 hover:text-red-500 p-1 shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={soon}>Editar perfil</Button>
        <Button variant="ghost" onClick={soon}>Cambiar contraseña</Button>
      </div>
    </div>
  );
}
