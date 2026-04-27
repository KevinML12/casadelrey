import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';

const Spinner = () => (
  <div className="p-6 flex justify-center py-20">
    <div className="w-6 h-6 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
  </div>
);

export default function LeaderDashboard() {
  const [stats,   setStats]   = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get('/admin/cell-reports/stats').then(r => r.data),
      apiClient.get('/admin/cell-reports').then(r => r.data || []),
    ])
      .then(([s, r]) => { setStats(s); setReports(r); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-headline-s text-on-surf font-black mb-1">Mis células</h1>
      <p className="text-body-s text-on-surf-var mb-6">Resumen de tus reportes</p>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: 'article', label: 'Reportes',   value: stats?.total_reports ?? 0,    tint: 'pri' },
          { icon: 'groups',  label: 'Asistentes', value: stats?.total_attendance ?? 0, tint: 'sec' },
          { icon: 'person_add', label: 'Visitantes', value: stats?.total_visitors ?? 0, tint: 'ter' },
        ].map(({ icon, label, value, tint }) => {
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

      {/* Por célula */}
      {stats?.by_cell?.length > 0 && (
        <div className="mb-8 p-5 rounded-xl bg-surf-low border border-outline-var">
          <h3 className="text-title-s text-on-surf font-semibold mb-4">Por célula</h3>
          <div className="space-y-2">
            {stats.by_cell.map((c, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-outline-var last:border-0">
                <span className="text-body-s text-on-surf font-medium">{c.cell_name}</span>
                <span className="text-body-s text-on-surf-var">{c.reports} reportes · {c.attendance} asistentes</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Últimos reportes */}
      <div>
        <h3 className="text-title-s text-on-surf font-semibold mb-3">Últimos reportes</h3>
        {reports.length === 0 ? (
          <p className="text-body-s text-on-surf-var">Aún no hay reportes.</p>
        ) : (
          <div className="space-y-2">
            {reports.slice(0, 8).map(r => (
              <div key={r.ID}
                className="flex justify-between items-center py-2.5 px-4 rounded-lg bg-surf-low border border-outline-var">
                <span className="text-body-s text-on-surf font-medium">{r.cell_name}</span>
                <span className="text-label-s text-on-surf-var">
                  {r.meeting_date || '—'} · {r.attendance ?? 0} asistentes
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
