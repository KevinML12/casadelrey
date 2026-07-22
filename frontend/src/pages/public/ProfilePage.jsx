// ============================================================
//  ProfilePage — perfil del usuario en el lenguaje PÚBLICO (Liquid
//  Glass). Antes estaba construida con los tokens Material Design 3
//  del panel admin (bg-surf, text-on-surf, bg-pri-con...) — la guía
//  prohíbe mezclar los dos sistemas en la cara pública.
// ============================================================
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import apiClient from '../../lib/apiClient';
import { Icon, Eyebrow } from '../../components/ui/Glass';
import Reveal from '../../components/ui/Reveal';
import Tilt from '../../components/ui/Tilt';
import ParallaxImg from '../../components/ui/ParallaxImg';
import { useSitePhoto } from '../../lib/feed';

const PRESS = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.97 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
};

export default function ProfilePage() {
  const { user } = useAuth();
  const heroImg = useSitePhoto('hero_perfil', '/images/bg-hero.jpg');
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
    <main className="relative bg-bg w-full min-h-screen overflow-hidden">
      {/* Hero de fondo presente en toda la página */}
      <ParallaxImg src={heroImg} alt="" className="opacity-45" />
      <div className="absolute inset-0 bg-gradient-to-b from-bg/75 via-bg/55 to-bg pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-6 pt-40 pb-28">
        <Reveal>
          <Eyebrow>Tu espacio</Eyebrow>
          <h1 className="display-mega text-white mt-4 mb-10" style={{ fontSize: 'clamp(2.6rem, 6vw, 4.5rem)' }}>
            Mi Perfil
          </h1>
        </Reveal>

        {/* Identidad */}
        <Reveal delay={0.05}>
          <Tilt max={3} glass className="liquid-glass rounded-[24px] p-7 md:p-8 mb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                <span className="text-26 font-bold text-white">{initial}</span>
              </div>
              <div className="min-w-0">
                <p className="text-20 font-bold text-white leading-tight truncate">{user?.name || 'Sin nombre'}</p>
                <p className="text-14 text-white/60 truncate">{user?.email}</p>
                <span className="inline-flex items-center gap-1.5 mt-2 bg-white/10 border border-white/15 text-white/80 px-2.5 py-0.5 rounded-full text-12 font-semibold capitalize">
                  <span className="w-1.5 h-1.5 rounded-full bg-celeste" />
                  {user?.role || 'usuario'} · cuenta activa
                </span>
              </div>
            </div>
          </Tilt>
        </Reveal>

        {/* Metas */}
        <Reveal delay={0.1}>
          <Tilt max={2} glass className="liquid-glass rounded-[24px] p-7 md:p-8">
            <h2 className="text-20 font-bold text-white tracking-tight mb-5 flex items-center gap-2.5">
              <Icon name="spark" className="w-5 h-5 text-celeste" />
              Mis metas
            </h2>

            <form onSubmit={addGoal} className="flex gap-2.5 mb-5">
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Nueva meta..."
                className="input-squircle flex-1"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)', color: '#fff' }}
              />
              <motion.button
                type="submit"
                {...PRESS}
                disabled={adding || !newTitle.trim()}
                aria-label="Agregar meta"
                className="w-11 h-11 rounded-full bg-white text-bg flex items-center justify-center text-22 font-bold focus-ring disabled:opacity-50 shrink-0"
              >
                +
              </motion.button>
            </form>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              </div>
            ) : goals.length === 0 ? (
              <p className="text-15 text-white/50 py-3">Aún no tienes metas. ¡Agrega una!</p>
            ) : (
              <div className="space-y-2.5">
                {goals.map(g => (
                  <div key={g.ID}
                    className={`flex items-center gap-3.5 p-4 rounded-[16px] bg-white/5 border border-white/10 ${g.completed ? 'opacity-60' : ''}`}>
                    <button
                      onClick={() => toggleGoal(g)}
                      aria-label={g.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors focus-ring ${
                        g.completed ? 'bg-celeste border-celeste text-white' : 'border-white/30 hover:border-white/60'
                      }`}
                    >
                      {g.completed && <Icon name="check" className="w-3.5 h-3.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-15 font-medium text-white ${g.completed ? 'line-through text-white/50' : ''}`}>
                        {g.title}
                      </p>
                      {g.target_date && (
                        <p className="text-12 text-white/50 mt-0.5">Para: {g.target_date}</p>
                      )}
                    </div>
                    <button onClick={() => deleteGoal(g.ID)} aria-label="Eliminar meta"
                      className="text-white/40 hover:text-white p-1 shrink-0 transition-colors focus-ring rounded-full">
                      <Icon name="close" className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Tilt>
        </Reveal>
      </div>
    </main>
  );
}
