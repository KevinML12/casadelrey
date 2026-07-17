// ============================================================
//  AdminProfile — perfil en el lenguaje del PANEL (modo claro estilo
//  Apple), usado por /admin/profile y /leader/profile. Antes ambas rutas
//  reusaban ProfilePage.jsx (la del sitio público, liquid-glass oscuro con
//  foto de fondo) — quedaba como el unico rincon del panel sin convertir,
//  rompiendo la consistencia con el resto (Dashboard, Eventos, etc).
// ============================================================
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import apiClient from '../../lib/apiClient';
import { Icon } from '../../components/ui/Glass';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function AdminProfile() {
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
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-bg flex items-center justify-center shrink-0">
          <Icon name="person" className="w-[22px] h-[22px] text-white" stroke={1.8} />
        </div>
        <div>
          <h1 className="text-headline-s text-bg font-black leading-tight">Mi Perfil</h1>
          <p className="text-body-s text-bg/50 mt-0.5">Tu cuenta y tus metas</p>
        </div>
      </div>

      {/* Identidad */}
      <div className="glass-light rounded-[24px] card-spring p-6 md:p-7 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-bg flex items-center justify-center shrink-0">
          <span className="text-[26px] font-bold text-white">{initial}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[18px] font-bold text-bg leading-tight truncate">{user?.name || 'Sin nombre'}</p>
          <p className="text-[13.5px] text-bg/50 truncate">{user?.email}</p>
          <span className="inline-flex items-center gap-1.5 mt-2 bg-bg/8 text-bg/70 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold capitalize">
            <span className="w-1.5 h-1.5 rounded-full bg-celeste" />
            {user?.role || 'usuario'} · cuenta activa
          </span>
        </div>
      </div>

      {/* Metas */}
      <div className="glass-light rounded-[24px] card-spring p-6 md:p-7 mb-6">
        <h2 className="text-[16px] font-bold text-bg tracking-tightish mb-5 flex items-center gap-2">
          <Icon name="spark" className="w-5 h-5 text-celeste" stroke={1.8} />
          Mis metas
        </h2>

        <form onSubmit={addGoal} className="flex gap-2.5 mb-5">
          <Input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Nueva meta…"
            className="flex-1"
          />
          <Button
            type="submit"
            variant="filled"
            disabled={adding || !newTitle.trim()}
            aria-label="Agregar meta"
            className="shrink-0"
          >
            {adding ? '…' : <Icon name="add" className="w-4 h-4" stroke={2} />}
          </Button>
        </form>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 rounded-full border-2 border-bg/12 border-t-celeste animate-spin" />
          </div>
        ) : goals.length === 0 ? (
          <p className="text-[13.5px] text-bg/50 py-3">Aún no tienes metas. ¡Agrega una!</p>
        ) : (
          <div className="space-y-2.5">
            {goals.map(g => (
              <div key={g.ID}
                className={`flex items-center gap-3.5 p-4 rounded-[16px] bg-bg/4 border border-bg/10 ${g.completed ? 'opacity-60' : ''}`}>
                <button
                  onClick={() => toggleGoal(g)}
                  aria-label={g.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors focus-ring ${
                    g.completed ? 'bg-celeste border-celeste text-white' : 'border-bg/25 hover:border-bg/50'
                  }`}
                >
                  {g.completed && <Icon name="check" className="w-3.5 h-3.5" stroke={2.5} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-[14px] font-medium text-bg ${g.completed ? 'line-through text-bg/45' : ''}`}>
                    {g.title}
                  </p>
                  {g.target_date && (
                    <p className="text-[12px] text-bg/45 mt-0.5">Para: {g.target_date}</p>
                  )}
                </div>
                <button onClick={() => deleteGoal(g.ID)} aria-label="Eliminar meta"
                  className="text-bg/40 hover:text-bg p-1 shrink-0 transition-colors focus-ring rounded-full">
                  <Icon name="close" className="w-4 h-4" stroke={1.8} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="filled" onClick={() => toast('Próximamente disponible')}>
          Editar perfil
        </Button>
        <Button variant="outlined" onClick={() => toast('Próximamente disponible')}>
          <Icon name="lock" className="w-4 h-4" stroke={1.8} />
          Cambiar contraseña
        </Button>
      </div>
    </div>
  );
}
