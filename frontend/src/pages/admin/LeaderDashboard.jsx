import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/ui/StatCard';

const Spinner = () => (
  <div className="p-6 flex justify-center py-20">
    <div className="w-6 h-6 rounded-full border-2 border-bg/15 border-t-celeste animate-spin" />
  </div>
);

export default function LeaderDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [kpis,    setKpis]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const endpoint = isAdmin ? '/admin/cell-reports/stats' : '/leader/kpis';
    apiClient.get(endpoint)
      .then(r => setKpis(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const cards = isAdmin
    ? [
        { icon: 'article',    label: 'Reportes',    value: kpis?.total_reports ?? 0,    tint: 'pri' },
        { icon: 'groups',     label: 'Asistentes',  value: kpis?.total_attendance ?? 0, tint: 'sec' },
        { icon: 'person_add', label: 'Visitantes',  value: kpis?.total_visitors ?? 0,   tint: 'ter' },
      ]
    : [
        { icon: 'article',      label: 'Reportes',     value: kpis?.total_reports ?? 0,    tint: 'pri' },
        { icon: 'groups',       label: 'Asistentes',   value: kpis?.total_attendees ?? 0,  tint: 'sec' },
        { icon: 'person_add',   label: 'Conversiones', value: kpis?.total_converts ?? 0,   tint: 'ter' },
        { icon: 'clock',        label: 'Pendientes',   value: kpis?.pending_reports ?? 0,  tint: 'pri' },
        { icon: 'task_alt',      label: 'Aprobados',    value: kpis?.approved_reports ?? 0, tint: 'sec' },
        { icon: 'person_add',   label: 'Boletas',      value: kpis?.total_boletas ?? 0,    tint: 'ter' },
      ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-[26px] text-bg font-black mb-1">
        {isAdmin ? 'Estadísticas de Células' : 'Mis Células'}
      </h1>
      <p className="text-[13.5px] text-bg/40 mb-6">Resumen de tus reportes</p>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {cards.map(({ icon, label, value, tint }) => (
          <StatCard key={label} icon={icon} label={label} value={value} tint={tint} />
        ))}
      </div>

      {/* Por célula (admin) */}
      {isAdmin && kpis?.by_cell?.length > 0 && (
        <div className="mb-8 p-5 rounded-[24px] glass-light">
          <h3 className="text-[15px] text-bg font-semibold mb-4">Por célula</h3>
          <div className="space-y-2">
            {kpis.by_cell.map((c, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-bg/10 last:border-0">
                <span className="text-[13.5px] text-bg font-medium">{c.cell_name}</span>
                <span className="text-[13.5px] text-bg/50">{c.reports} reportes · {c.attendance} asistentes</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Últimos reportes (líder) */}
      {!isAdmin && kpis?.recent_reports?.length > 0 && (
        <div>
          <h3 className="text-[15px] text-bg font-semibold mb-3">Últimos reportes</h3>
          <div className="space-y-2">
            {kpis.recent_reports.map(r => (
              <div key={r.ID}
                className="flex justify-between items-center py-2.5 px-4 rounded-2xl glass-light">
                <span className="text-[13.5px] text-bg font-medium">{r.cell_name}</span>
                <span className="text-[11.5px] text-bg/40">
                  {r.meeting_date || '—'} · {r.total_attendees ?? 0} asistentes
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
