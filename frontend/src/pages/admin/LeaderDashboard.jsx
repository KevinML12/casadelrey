import { useEffect, useState } from 'react';
import { BarChart3, Users, UserPlus } from 'lucide-react';
import apiClient from '../../lib/apiClient';

export default function LeaderDashboard() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get('/admin/cell-reports/stats').then(r => r.data),
      apiClient.get('/admin/cell-reports').then(r => r.data || []),
    ])
      .then(([s, r]) => {
        setStats(s);
        setReports(r);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-line border-t-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-black text-ink mb-1">Mis células</h1>
      <p className="text-ink-3 text-sm mb-6">Resumen de tus reportes</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-line rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={18} className="text-blue" />
            <span className="text-xs font-semibold text-ink-3 uppercase">Reportes</span>
          </div>
          <p className="text-2xl font-black text-ink">{stats?.total_reports ?? 0}</p>
        </div>
        <div className="bg-card border border-line rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Users size={18} className="text-ok" />
            <span className="text-xs font-semibold text-ink-3 uppercase">Asistentes</span>
          </div>
          <p className="text-2xl font-black text-ink">{stats?.total_attendance ?? 0}</p>
        </div>
        <div className="bg-card border border-line rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <UserPlus size={18} className="text-gold" />
            <span className="text-xs font-semibold text-ink-3 uppercase">Visitantes</span>
          </div>
          <p className="text-2xl font-black text-ink">{stats?.total_visitors ?? 0}</p>
        </div>
      </div>

      {stats?.by_cell?.length > 0 && (
        <div className="mb-8 p-5 rounded-xl bg-card border border-line">
          <h3 className="font-bold text-ink mb-4 text-sm">Por célula</h3>
          <div className="space-y-2">
            {stats.by_cell.map((c, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-line last:border-0 text-sm">
                <span className="font-medium text-ink">{c.cell_name}</span>
                <span className="text-ink-3">{c.reports} reportes · {c.attendance} asistentes</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-bold text-ink mb-3 text-sm">Últimos reportes</h3>
        {reports.length === 0 ? (
          <p className="text-ink-3 text-sm">Aún no hay reportes.</p>
        ) : (
          <div className="space-y-2">
            {reports.slice(0, 8).map(r => (
              <div key={r.ID} className="flex justify-between items-center py-2 px-4 rounded-lg bg-card border border-line text-sm">
                <span className="font-medium text-ink">{r.cell_name}</span>
                <span className="text-ink-3">
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
