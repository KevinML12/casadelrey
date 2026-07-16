import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { Icon } from '../../components/ui/Glass';

// Descripciones de cada departamento
const DEPT_INFO = {
  alabanza:               { label: 'Alabanza',               icon: 'mic',                desc: 'Lidera la adoración y la música en los servicios y células.' },
  danza:                  { label: 'Danza',                  icon: 'directions_run',     desc: 'Expresa la adoración a través del movimiento en los servicios.' },
  servidores:             { label: 'Servidores',             icon: 'waving_hand',        desc: 'Recibe a cada persona, cuida la recepción y la limpieza de la Iglesia.' },
  protocolo:              { label: 'Protocolo',              icon: 'star',               desc: 'Atención VIP a políticos, pastores invitados y personas de alto nivel.' },
  pancartas:              { label: 'Pancartas',              icon: 'flag',               desc: 'Porta y coordina las pancartas durante los días de culto.' },
  maestros_ninos:         { label: 'Maestros de Niños',      icon: 'child_care',         desc: 'Enseña e inspira a los más pequeños con creatividad y amor.' },
  tecnicos_audiovisuales: { label: 'Técnicos Audiovisuales', icon: 'spatial_audio',      desc: 'Sonido, proyección y streaming para que el servicio llegue más lejos.' },
  multimedia:             { label: 'Multimedia',             icon: 'video_camera_front', desc: 'Diseño gráfico, video y redes sociales para la comunicación de la Iglesia.' },
  oracion:                { label: 'Oración',                icon: 'self_improvement',   desc: 'Intercede por la iglesia, los miembros y las necesidades de la ciudad.' },
  logistica:              { label: 'Logística',              icon: 'local_shipping',     desc: 'Coordina recursos, transporte y organización de eventos y servicios.' },
};

const Spinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-pri animate-spin" />
  </div>
);

function GoalCard({ goal, onToggle, onDelete }) {
  return (
    <div className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors ${
      goal.completed ? 'border-white/10 bg-surf-low opacity-60' : 'border-white/10 bg-surf hover:bg-surf-low'
    }`}>
      <button
        onClick={() => onToggle(goal)}
        className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          goal.completed ? 'bg-ter-con border-transparent' : 'border-white/10 hover:border-pri'
        }`}
      >
        {goal.completed && <Icon name="check" className="w-[14px] h-[14px] text-on-ter-con" stroke={1.8} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-body-m font-medium ${goal.completed ? 'line-through text-on-surf-var' : 'text-on-surf'}`}>
          {goal.title}
        </p>
        {goal.description && (
          <p className="text-body-s text-on-surf-var mt-1 leading-relaxed">{goal.description}</p>
        )}
        {goal.target_date && (
          <p className="text-label-s text-on-surf-var mt-2 flex items-center gap-1">
            <Icon name="event" className="w-[12px] h-[12px]" stroke={1.8} />
            {new Date(goal.target_date + 'T12:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>
      <button
        onClick={() => onDelete(goal.ID)}
        className="text-on-surf-var hover:text-err transition-colors shrink-0 mt-0.5"
        title="Eliminar meta"
      >
        <Icon name="delete" className="w-[16px] h-[16px]" stroke={1.8} />
      </button>
    </div>
  );
}

function NewGoalForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ title: '', description: '', target_date: '' });
  const [loading, setLoading] = useState(false);
  const fieldCls = 'w-full px-4 py-2.5 rounded-xl border border-white/10 bg-transparent text-body-s text-on-surf placeholder:text-on-surf-var focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all';

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
    <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-2xl border border-pri/30 bg-pri-con/10">
      <input
        value={form.title}
        onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
        placeholder="¿Cuál es tu meta?"
        className={fieldCls}
        required
        autoFocus
      />
      <textarea
        rows={2}
        value={form.description}
        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
        placeholder="Descripción (opcional)"
        className={`${fieldCls} resize-none`}
      />
      <input
        type="date"
        value={form.target_date}
        onChange={e => setForm(p => ({ ...p, target_date: e.target.value }))}
        className={fieldCls}
      />
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pri text-on-pri text-label-l font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
          <Icon name="save" className="w-[16px] h-[16px]" stroke={1.8} />
          {loading ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-xl text-label-l text-on-surf-var hover:text-on-surf hover:bg-surf-dim transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [volunteer, setVolunteer] = useState(null);
  const [leaders,   setLeaders]   = useState([]);
  const [goals,     setGoals]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);

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

  const dept = volunteer?.department ? DEPT_INFO[volunteer.department] : null;

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
      <div className="rounded-2xl overflow-hidden border border-white/10">
        <div className="px-6 py-5" style={{ background: '#060D24' }}>
          <p className="text-label-m mb-1" style={{ color: 'rgba(255,255,255,.5)' }}>Bienvenido,</p>
          <h1 className="text-headline-s text-ink font-black leading-tight">{user?.name}</h1>
          {dept && (
            <div className="flex items-center gap-2 mt-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,.12)' }}>
                <Icon name={dept.icon} className="w-[16px] h-[16px] text-ink" stroke={1.8} />
              </div>
              <span className="text-label-l text-ink font-medium">{dept.label}</span>
            </div>
          )}
        </div>
        {dept && (
          <div className="liquid-glass rounded-[24px] card-spring px-6 py-4 border-t">
            <p className="text-body-s text-on-surf-var leading-relaxed">{dept.desc}</p>
          </div>
        )}
      </div>

      {/* Tu líder — comunicación directa (directorio /admin/leaders) */}
      {volunteer?.assigned_leader_name ? (
        <section className="rounded-2xl border border-white/10 bg-surf p-5">
          <p className="text-label-s text-on-surf-var uppercase tracking-widest mb-3">Tu líder</p>
          <div className="flex items-center gap-4">
            {myLeader?.photo_url ? (
              <img src={myLeader.photo_url} alt={volunteer.assigned_leader_name}
                className="w-14 h-14 rounded-full object-cover border border-white/10 shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-surf-container border border-white/10 grid place-items-center shrink-0">
                <Icon name="person" className="w-[20px] h-[20px] text-on-surf-var" stroke={1.8} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-title-s text-on-surf font-medium truncate">{volunteer.assigned_leader_name}</p>
              {myLeader?.area && <p className="text-body-s text-on-surf-var truncate">{myLeader.area}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              {myLeader?.phone && (
                <a
                  href={`https://wa.me/${myLeader.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${volunteer.assigned_leader_name.split(' ')[0]}, soy ${user?.name || 'voluntario'} de ${dept?.label || 'voluntariado'}.`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-pri text-on-pri text-label-m font-semibold hover:opacity-90 transition-opacity"
                >
                  <Icon name="chat" className="w-[16px] h-[16px]" stroke={1.8} />
                  WhatsApp
                </a>
              )}
              {myLeader?.email && (
                <a href={`mailto:${myLeader.email}`} title={myLeader.email}
                  className="grid place-items-center w-9 h-9 rounded-full border border-white/10 text-on-surf-var hover:text-on-surf hover:border-on-surf-var transition-colors">
                  <Icon name="mail" className="w-[16px] h-[16px]" stroke={1.8} />
                </a>
              )}
            </div>
          </div>
          {!myLeader && (
            <p className="text-body-s text-on-surf-var mt-3">
              Tu líder aún no tiene contacto en el directorio — pídele al equipo que lo agregue en el panel.
            </p>
          )}
        </section>
      ) : volunteer && (
        <section className="liquid-glass rounded-[24px] card-spring border-dashed p-5 text-center">
          <p className="text-body-s text-on-surf-var">
            Aún no te asignan líder. El equipo se comunicará contigo pronto.
          </p>
        </section>
      )}

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-surf p-4">
          <div className="w-8 h-8 rounded-lg bg-pri-con flex items-center justify-center mb-3">
            <Icon name="task_alt" className="w-[16px] h-[16px] text-on-pri-con" stroke={1.8} />
          </div>
          <p className="text-label-s text-on-surf-var uppercase tracking-widest">Pendientes</p>
          <p className="text-headline-m text-on-surf font-black">{pending}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-surf p-4">
          <div className="w-8 h-8 rounded-lg bg-ter-con flex items-center justify-center mb-3">
            <Icon name="check_circle" className="w-[16px] h-[16px] text-on-ter-con" stroke={1.8} />
          </div>
          <p className="text-label-s text-on-surf-var uppercase tracking-widest">Completadas</p>
          <p className="text-headline-m text-on-surf font-black">{completed}</p>
        </div>
      </div>

      {/* Mis metas */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title-l text-on-surf font-bold">Mis metas</h2>
          <button
            onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pri text-on-pri text-label-m font-semibold hover:opacity-90 transition-opacity"
          >
            <Icon name={showForm ? 'close' : 'add'} className="w-[16px] h-[16px]" stroke={1.8} />
            {showForm ? 'Cancelar' : 'Nueva meta'}
          </button>
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
          <div className="liquid-glass rounded-[24px] card-spring flex flex-col items-center py-12 text-on-surf-var gap-3">
            <Icon name="task_alt" className="w-[40px] h-[40px]" stroke={1.8} />
            <p className="text-body-m">Aún no tienes metas registradas.</p>
            <button onClick={() => setShowForm(true)}
              className="text-label-m text-pri hover:underline font-medium">
              Crear tu primera meta →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
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
