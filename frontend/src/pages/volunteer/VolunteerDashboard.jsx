import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Input, { Textarea } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import StatCard from '../../components/ui/StatCard';
import { useVolunteerAreas } from '../../lib/volunteerAreas';
import VolunteerReportForm from '../../components/sections/VolunteerReportForm';
import ModalWrapper from '../../components/ui/ModalWrapper';
const Spinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-acento animate-spin" />
  </div>
);

function GoalCard({ goal, onToggle, onDelete }) {
  return (
    <div className={`flex items-start gap-4 p-4 transition-colors ${goal.completed ? 'opacity-60' : 'hover:bg-bg/6'}`}>
      <button
        onClick={() => onToggle(goal)}
        className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          goal.completed ? 'bg-acento-soft border-transparent' : 'border-bg/10 hover:border-acento'
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-body-m font-medium ${goal.completed ? 'line-through text-bg/50' : 'text-bg'}`}>
          {goal.title}
        </p>
        {goal.description && (
          <p className="text-body-s text-bg/50 mt-1 leading-relaxed">{goal.description}</p>
        )}
        {goal.target_date && (
          <p className="text-label-s text-bg/50 mt-2">
            {new Date(goal.target_date + 'T12:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>
      <button
        onClick={() => onDelete(goal.ID)}
        className="shrink-0 text-13 font-semibold text-bg/55 hover:text-rose transition-colors"
      >
        Eliminar
      </button>
    </div>
  );
}

function NewGoalForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ title: '', description: '', target_date: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('El título es obligatorio'); return; }
    setLoading(true);
    try {
      await apiClient.post('/profile/goals', form);
      toast.success('Meta creada');
      onSave();
    } catch { toast.error('Error al crear la meta'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-light rounded-[24px] card-spring space-y-3 p-4">
      <Input
        value={form.title}
        onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
        placeholder="¿Cuál es tu meta?"
        required
        autoFocus
      />
      <Textarea
        rows={2}
        value={form.description}
        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
        placeholder="Descripción (opcional)"
      />
      <Input
        type="date"
        value={form.target_date}
        onChange={e => setForm(p => ({ ...p, target_date: e.target.value }))}
      />
      <div className="flex gap-2 pt-1">
        <Button type="submit" variant="filled" disabled={loading}>
          {loading ? 'Guardando…' : 'Guardar'}
        </Button>
        <Button type="button" variant="text" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

export default function VolunteerDashboard() {
  const { user } = useAuth();
  // Departamentos reales (DB, editable desde /admin/volunteer-areas) --
  // antes este dashboard tenia su PROPIA copia hardcodeada (DEPT_INFO)
  // con iconos y descripciones que podian desincronizarse de las que ve
  // el publico.
  const areas = useVolunteerAreas();
  const [volunteer, setVolunteer] = useState(null);
  const [leaders,   setLeaders]   = useState([]);
  const [goals,     setGoals]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [goalsRes, volRes, leadersRes] = await Promise.allSettled([
        apiClient.get('/profile/goals'),
        apiClient.get('/volunteer/me'),
        apiClient.get('/leaders'),
      ]);
      if (goalsRes.status === 'fulfilled')   setGoals(goalsRes.value.data || []);
      if (volRes.status === 'fulfilled')     setVolunteer(volRes.value.data);
      if (leadersRes.status === 'fulfilled') setLeaders(leadersRes.value.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const toggleGoal = async (goal) => {
    try {
      await apiClient.put(`/profile/goals/${goal.ID}`, { ...goal, completed: !goal.completed });
      setGoals(prev => prev.map(g => g.ID === goal.ID ? { ...g, completed: !g.completed } : g));
    } catch { toast.error('Error al actualizar meta'); }
  };

  const deleteGoal = async (id) => {
    if (!confirm('¿Eliminar esta meta?')) return;
    try {
      await apiClient.delete(`/profile/goals/${id}`);
      setGoals(prev => prev.filter(g => g.ID !== id));
      toast.success('Meta eliminada');
    } catch { toast.error('Error al eliminar'); }
  };

  const deptArea = volunteer?.department ? areas.find(a => a.value === volunteer.department) : null;
  const dept = deptArea ? { label: deptArea.title, desc: deptArea.desc } : null;

  // "Tu líder": cruza el nombre del líder asignado con el directorio
  // público (/leaders, curado en /admin/leaders) para foto y contacto.
  const normName = (x) => (x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const myLeader = volunteer?.assigned_leader_name
    ? leaders.find(l => normName(l.name) === normName(volunteer.assigned_leader_name))
    : null;
  const pending   = goals.filter(g => !g.completed).length;
  const completed = goals.filter(g => g.completed).length;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">

      {/* Bienvenida */}
      <div className="glass-light rounded-[24px] card-spring overflow-hidden">
        <div className="px-6 py-5">
          <p className="text-label-m text-bg/50 mb-1">Bienvenido,</p>
          <h1 className="text-headline-s text-bg font-black leading-tight">{user?.name}</h1>
          {dept && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-label-l text-bg font-medium">{dept.label}</span>
            </div>
          )}
        </div>
        {dept && (
          <div className="px-6 py-4 border-t border-bg/10">
            <p className="text-body-s text-bg/50 leading-relaxed">{dept.desc}</p>
          </div>
        )}
      </div>

      {/* Tu líder — comunicación directa (directorio /admin/leaders) */}
      {volunteer?.assigned_leader_name ? (
        <section className="glass-light rounded-[24px] card-spring p-5">
          <p className="text-label-s text-bg/50 uppercase tracking-widest mb-3">Tu líder</p>
          <div className="flex items-center gap-4">
            {myLeader?.photo_url ? (
              <img src={myLeader.photo_url} alt={volunteer.assigned_leader_name}
                className="w-14 h-14 rounded-full object-cover border border-bg/10 shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-bg/8 border border-bg/10 grid place-items-center shrink-0 text-title-m font-bold text-bg/50">
                {(volunteer.assigned_leader_name || '?')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-title-s text-bg font-medium truncate">{volunteer.assigned_leader_name}</p>
              {myLeader?.area && <p className="text-body-s text-bg/50 truncate">{myLeader.area}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              {myLeader?.phone && (
                <a
                  href={`https://wa.me/${myLeader.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${volunteer.assigned_leader_name.split(' ')[0]}, soy ${user?.name || 'voluntario'} de ${dept?.label || 'voluntariado'}.`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-bg text-white text-label-m font-semibold hover:opacity-90 transition-opacity"
                >
                  WhatsApp
                </a>
              )}
              {myLeader?.email && (
                <a href={`mailto:${myLeader.email}`} title={myLeader.email}
                  className="flex items-center px-4 py-2 rounded-full border border-bg/10 text-bg/50 text-label-m font-semibold hover:text-bg hover:border-bg/20 transition-colors truncate max-w-[160px]">
                  {myLeader.email}
                </a>
              )}
            </div>
          </div>
          {!myLeader && (
            <p className="text-body-s text-bg/50 mt-3">
              Tu líder aún no tiene contacto en el directorio — pídele al equipo que lo agregue en el panel.
            </p>
          )}
        </section>
      ) : volunteer && (
        <section className="glass-light rounded-[24px] card-spring border-dashed p-5 text-center">
          <p className="text-body-s text-bg/50">
            Aún no te asignan líder. El equipo se comunicará contigo pronto.
          </p>
        </section>
      )}

      {/* Stats rápidas */}
      <div className="flex items-center justify-between mb-4 mt-8">
        <h2 className="text-title-l text-bg font-bold">Resumen</h2>
        <Button variant="filled" size="sm" onClick={() => setShowReportForm(true)}>
          Nuevo Reporte
        </Button>
      </div>
      
      {showReportForm && (
        <ModalWrapper>
          <div className="bg-paper rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto relative animate-fade-in shadow-xl">
            <button
              onClick={() => setShowReportForm(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-bg/5 flex items-center justify-center text-bg/50 hover:text-bg hover:bg-bg/10 transition-colors"
            >
              ✕
            </button>
            <VolunteerReportForm onSuccess={() => setShowReportForm(false)} />
          </div>
        </ModalWrapper>
      )}

      <div className="grid grid-cols-2 gap-4">
        <StatCard icon="task_alt" label="Pendientes" value={pending} tint="pri" />
        <StatCard icon="check_circle" label="Completadas" value={completed} tint="ok" />
      </div>

      {/* Mis metas */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title-l text-bg font-bold">Mis metas</h2>
          <Button variant="filled" size="sm" onClick={() => setShowForm(s => !s)}>
            {showForm ? 'Cancelar' : 'Nueva meta'}
          </Button>
        </div>

        {showForm && (
          <div className="mb-4">
            <NewGoalForm
              onSave={() => { setShowForm(false); loadData(); }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {loading ? <Spinner /> : goals.length === 0 ? (
          <div className="glass-light rounded-[24px] card-spring flex flex-col items-center py-12 text-bg/50 gap-3">
            <p className="text-body-m">Aún no tienes metas registradas.</p>
            <button onClick={() => setShowForm(true)}
              className="text-label-m text-bg hover:underline font-medium">
              Crear tu primera meta →
            </button>
          </div>
        ) : (
          <div className="glass-light rounded-[24px] card-spring overflow-hidden divide-y divide-bg/8">
            {/* Pendientes primero */}
            {goals.filter(g => !g.completed).map(g => (
              <GoalCard key={g.ID} goal={g} onToggle={toggleGoal} onDelete={deleteGoal} />
            ))}
            {/* Completadas abajo */}
            {goals.filter(g => g.completed).map(g => (
              <GoalCard key={g.ID} goal={g} onToggle={toggleGoal} onDelete={deleteGoal} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
