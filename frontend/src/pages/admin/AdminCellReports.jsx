import { useEffect, useState } from 'react';
import { Users, Inbox } from 'lucide-react';
import apiClient from '../../lib/apiClient';

export default function AdminCellReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/admin/cell-reports')
      .then(r => setReports(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalAttendance = reports.reduce((s, r) => s + (r.attendance || 0), 0);
  const totalVisitors = reports.reduce((s, r) => s + (r.new_visitors || 0), 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-black text-ink mb-6">Reportes de Células</h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-line border-t-blue animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-card border border-line rounded-xl">
          <Inbox size={32} className="mx-auto text-ink-3 mb-3" />
          <p className="text-ink-3 text-sm">No hay reportes aún.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-card border border-line rounded-xl p-5">
              <p className="text-xs font-semibold text-ink-3 uppercase tracking-widest mb-1">Total asistentes</p>
              <p className="text-3xl font-black text-ink">{totalAttendance}</p>
            </div>
            <div className="bg-card border border-line rounded-xl p-5">
              <p className="text-xs font-semibold text-ink-3 uppercase tracking-widest mb-1">Visitantes nuevos</p>
              <p className="text-3xl font-black text-ink">{totalVisitors}</p>
            </div>
          </div>

          <div className="space-y-3">
            {reports.map(r => (
              <div key={r.ID} className="bg-card border border-line rounded-xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="font-semibold text-ink text-sm">{r.cell_name}</span>
                    <span className="text-ink-3 text-xs ml-2">— {r.leader_name}</span>
                  </div>
                  <span className="text-xs text-ink-3">
                    {r.meeting_date ? new Date(r.meeting_date).toLocaleDateString('es-ES') : '—'}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-ink-2">
                  <span>Asistencia: <strong>{r.attendance ?? 0}</strong></span>
                  <span>Visitantes: <strong>{r.new_visitors ?? 0}</strong></span>
                </div>
                {r.notes && (
                  <p className="text-sm text-ink-3 mt-2 bg-bg rounded-lg px-3 py-2">{r.notes}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
