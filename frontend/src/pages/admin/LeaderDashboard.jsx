import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';

const Spinner = () => (
  <div className="p-6 flex justify-center py-20">
    <div className="w-6 h-6 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
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
        { icon: 'article',    label: 'Reportes',    value: kpis?.total_reports ?? 0,    tint: 'pri' },
        { icon: 'groups',     label: 'Asistentes',  value: kpis?.total_attendees ?? 0,  tint: 'sec' },
        { icon: 'person_add', label: 'Conversiones',value: kpis?.total_converts ?? 0,   tint: 'ter' },
        { icon: 'pending',    label: 'Pendientes',  value: kpis?.pending_reports ?? 0,  tint: 'pri' },
        { icon: 'check_circle', label: 'Aprobados', value: kpis?.approved_reports ?? 0, tint: 'sec' },
        { icon: 'person_add', label: 'Boletas',     value: kpis?.total_boletas ?? 0,    tint: 'ter' },
      ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-headline-s text-on-surf font-black mb-1">
        {isAdmin ? 'Estadísticas de Células' : 'Mis Células'}
      </h1>
      <p className="text-body-s text-on-surf-var mb-6">Resumen de tus reportes</p>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {cards.map(({ icon, label, value, tint }) => {
          const cls = { pri: 'bg-pri-con text-on-pri-con', sec: 'bg-sec-con text-on-sec-con', ter: 'bg-ter-con text-on-ter-con' }[tint];
          return (
            <div key={label} className="bg-surf-low border border-outline-var rounded-xl p-5">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${cls}`}>
                <span className="ms" style={{ fontSize: 18 }}>{icon}</span>
              </div>
              <p className="text-label-s text-on-surf-var uppercase tracking-widest mb-1">{label}</p>
              <p className="text-headline-s text-on-surf font-black">{value}</p>
            </div>
          );
        })}
      </div>

      {/* Por célula (admin) */}
      {isAdmin && kpis?.by_cell?.length > 0 && (
        <div className="mb-8 p-5 rounded-xl bg-surf-low border border-outline-var">
          <h3 className="text-title-s text-on-surf font-semibold mb-4">Por célula</h3>
          <div className="space-y-2">
            {kpis.by_cell.map((c, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-outline-var last:border-0">
                <span className="text-body-s text-on-surf font-medium">{c.cell_name}</span>
                <span className="text-body-s text-on-surf-var">{c.reports} reportes · {c.attendance} asistentes</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Últimos reportes (líder) */}
      {!isAdmin && kpis?.recent_reports?.length > 0 && (
        <div>
          <h3 className="text-title-s text-on-surf font-semibold mb-3">Últimos reportes</h3>
          <div className="space-y-2">
            {kpis.recent_reports.map(r => (
              <div key={r.ID}
                className="flex justify-between items-center py-2.5 px-4 rounded-lg bg-surf-low border border-outline-var">
                <span className="text-body-s text-on-surf font-medium">{r.cell_name}</span>
                <span className="text-label-s text-on-surf-var">
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
