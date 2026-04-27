import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import CellReportForm from './CellReportForm';
import Button from '../ui/Button';

const STATUS = {
  pendiente: { label: 'Pendiente',  cls: 'bg-surf-high text-on-surf-var' },
  aprobado:  { label: 'Aprobado',   cls: 'bg-ter-con text-on-ter-con' },
  rechazado: { label: 'Rechazado',  cls: 'bg-err-con text-on-err-con' },
};

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="w-6 h-6 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
  </div>
);

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="bg-surf-low border border-outline-var rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="ms text-pri" style={{ fontSize: 18 }}>{icon}</span>
        <span className="text-label-s text-on-surf-var uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-headline-s text-on-surf font-black">{value}</p>
      {sub && <p className="text-label-s text-on-surf-var mt-0.5">{sub}</p>}
    </div>
  );
}

export default function CellReportsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [reports,   setReports]   = useState([]);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [filter,    setFilter]    = useState('');   // status filter
  const [expanded,  setExpanded]  = useState(null); // expanded report ID
  const [approving, setApproving] = useState(null);

  const refresh = () => {
    setLoading(true);
    const params = filter ? `?status=${filter}` : '';
    Promise.all([
      apiClient.get(`/admin/cell-reports${params}`).then(r => r.data || []),
      apiClient.get('/admin/cell-reports/stats').then(r => r.data).catch(() => null),
    ])
      .then(([reps, st]) => { setReports(reps); setStats(st); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [filter]);

  const approve = async (id, status) => {
    setApproving(id + status);
    try {
      await apiClient.put(`/admin/cell-reports/${id}/approve`, { status });
      toast.success(status === 'aprobado' ? 'Reporte aprobado' : 'Reporte rechazado');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar');
    } finally {
      setApproving(null);
    }
  };

  const pendingCount = reports.filter(r => r.status === 'pendiente').length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-headline-s text-on-surf font-black">Reportes de Células</h1>
          {isAdmin && pendingCount > 0 && (
            <p className="text-body-s text-on-surf-var mt-1">
              <span className="text-pri font-semibold">{pendingCount}</span> reporte{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''} de aprobación
            </p>
          )}
        </div>
        <Button variant="filled" onClick={() => setShowForm(s => !s)}>
          <span className="ms" style={{ fontSize: 18 }}>{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancelar' : 'Nuevo reporte'}
        </Button>
      </div>

      {showForm && (
        <div className="mb-8 p-6 rounded-2xl bg-surf-low border border-outline-var">
          <CellReportForm onSuccess={() => { setShowForm(false); refresh(); }} />
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard icon="article"       label="Reportes"     value={stats.total_reports ?? 0} />
          <StatCard icon="groups"        label="Asistentes"   value={stats.total_attendees ?? 0} />
          <StatCard icon="favorite"      label="Convertidos"  value={stats.total_converts ?? 0} />
          <StatCard icon="replay"        label="Reconciliados" value={stats.total_reconciled ?? 0} />
          <StatCard icon="savings"       label="Ofrenda total" value={`Q${(stats.total_offering ?? 0).toFixed(2)}`} />
        </div>
      )}

      {/* Filtro de status (admin) */}
      {isAdmin && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {[['', 'Todos'], ['pendiente', 'Pendientes'], ['aprobado', 'Aprobados'], ['rechazado', 'Rechazados']].map(([val, lbl]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-2 rounded-full text-label-m font-medium border transition-all ${
                filter === val
                  ? 'border-pri bg-pri-con text-on-pri-con'
                  : 'border-outline-var text-on-surf-var hover:border-pri/40 hover:text-pri'
              }`}>
              {lbl}
            </button>
          ))}
        </div>
      )}

      {/* Por célula */}
      {stats?.by_cell?.length > 0 && (
        <div className="mb-8 p-5 rounded-2xl bg-surf-low border border-outline-var">
          <h3 className="text-title-s text-on-surf font-semibold mb-4 flex items-center gap-2">
            <span className="ms text-pri" style={{ fontSize: 18 }}>bar_chart</span>
            Resumen por célula
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-body-s">
              <thead>
                <tr className="border-b border-outline-var text-label-s text-on-surf-var uppercase">
                  <th className="text-left pb-2 pr-4">Célula</th>
                  <th className="text-right pb-2 pr-4">Reportes</th>
                  <th className="text-right pb-2 pr-4">Asistentes</th>
                  <th className="text-right pb-2 pr-4">Conv.</th>
                  <th className="text-right pb-2 pr-4">Rec.</th>
                  <th className="text-right pb-2">Ofrenda</th>
                </tr>
              </thead>
              <tbody>
                {stats.by_cell.map((c, i) => (
                  <tr key={i} className="border-b border-outline-var last:border-0">
                    <td className="py-2 pr-4 font-medium text-on-surf">
                      {c.cell_code && <span className="text-pri mr-1">[{c.cell_code}]</span>}{c.cell_name}
                    </td>
                    <td className="py-2 pr-4 text-right text-on-surf-var">{c.reports}</td>
                    <td className="py-2 pr-4 text-right text-on-surf-var">{c.total_attendees}</td>
                    <td className="py-2 pr-4 text-right text-on-surf-var">{c.converts}</td>
                    <td className="py-2 pr-4 text-right text-on-surf-var">{c.reconciled}</td>
                    <td className="py-2 text-right text-ter font-semibold">Q{Number(c.total_offering ?? 0).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lista de reportes */}
      {loading ? <Spinner /> : reports.length === 0 ? (
        <div className="text-center py-16 bg-surf-low border border-outline-var rounded-2xl">
          <span className="ms text-on-surf-var block mb-3" style={{ fontSize: 32 }}>inbox</span>
          <p className="text-body-s text-on-surf-var">No hay reportes{filter ? ` con estado "${filter}"` : ''}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => {
            const st = STATUS[r.status] || STATUS.pendiente;
            const open = expanded === r.ID;
            return (
              <div key={r.ID} className="bg-surf-low border border-outline-var rounded-2xl overflow-hidden">
                {/* Header */}
                <button onClick={() => setExpanded(open ? null : r.ID)}
                  className="w-full text-left p-5 flex items-start gap-4 hover:bg-surf-high transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {r.cell_code && (
                        <span className="text-label-s font-mono px-2 py-0.5 rounded-full bg-pri-con text-on-pri-con">{r.cell_code}</span>
                      )}
                      <span className="text-title-s text-on-surf font-semibold">{r.cell_name}</span>
                      <span className={`text-label-s px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                    </div>
                    <div className="flex gap-4 text-label-s text-on-surf-var flex-wrap">
                      {isAdmin && r.leader_name && <span className="flex items-center gap-1"><span className="ms" style={{fontSize:12}}>person</span>{r.leader_name}</span>}
                      <span className="flex items-center gap-1"><span className="ms" style={{fontSize:12}}>calendar_today</span>
                        {r.meeting_date ? new Date(r.meeting_date + 'T12:00').toLocaleDateString('es-ES', {day:'2-digit', month:'short', year:'numeric'}) : '—'}
                      </span>
                      <span className="flex items-center gap-1"><span className="ms" style={{fontSize:12}}>groups</span>{r.total_attendees ?? 0} asist.</span>
                      {(r.converts > 0 || r.reconciled > 0) && (
                        <span className="flex items-center gap-1 text-pri font-medium">
                          <span className="ms" style={{fontSize:12}}>person_add</span>
                          {(r.converts || 0) + (r.reconciled || 0)} nuevos
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="ms text-on-surf-var shrink-0" style={{ fontSize: 20 }}>
                    {open ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Detalle */}
                {open && (
                  <div className="border-t border-outline-var p-5 space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { icon: 'groups',       label: 'Total asistentes', value: r.total_attendees ?? 0 },
                        { icon: 'favorite',     label: 'Convertidos',      value: r.converts ?? 0 },
                        { icon: 'replay',       label: 'Reconciliados',    value: r.reconciled ?? 0 },
                        { icon: 'savings',      label: 'Ofrenda',          value: `Q${Number(r.offering ?? 0).toFixed(2)}` },
                      ].map(({ icon, label, value }) => (
                        <div key={label} className="text-center p-3 rounded-xl bg-surf border border-outline-var">
                          <span className="ms text-pri block mb-1" style={{ fontSize: 20 }}>{icon}</span>
                          <p className="text-title-m text-on-surf font-bold">{value}</p>
                          <p className="text-label-s text-on-surf-var">{label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-body-s">
                      {r.pastor_name && (
                        <div><span className="text-on-surf-var">Pastor: </span><span className="text-on-surf font-medium">{r.pastor_name}</span></div>
                      )}
                      {r.topic && (
                        <div><span className="text-on-surf-var">Tema: </span><span className="text-on-surf font-medium">{r.topic}</span></div>
                      )}
                      {r.host_name && (
                        <div><span className="text-on-surf-var">Anfitrión: </span><span className="text-on-surf font-medium">{r.host_name}</span>
                          {r.host_phone && <span className="text-on-surf-var ml-2">· {r.host_phone}</span>}
                        </div>
                      )}
                      {r.address && (
                        <div><span className="text-on-surf-var">Dirección: </span><span className="text-on-surf font-medium">{r.address}</span></div>
                      )}
                    </div>

                    {r.photo_url && (
                      <img src={r.photo_url} alt="Foto de la reunión"
                        className="w-full max-h-60 object-cover rounded-xl border border-outline-var" />
                    )}

                    {r.notes && (
                      <div className="p-4 rounded-xl bg-surf border border-outline-var">
                        <p className="text-body-s text-on-surf-var leading-relaxed">{r.notes}</p>
                      </div>
                    )}

                    {/* Botones de aprobación (solo admin, solo si pendiente) */}
                    {isAdmin && r.status === 'pendiente' && (
                      <div className="flex gap-3 pt-2">
                        <Button variant="filled" onClick={() => approve(r.ID, 'aprobado')}
                          disabled={!!approving}>
                          <span className="ms" style={{ fontSize: 16 }}>check_circle</span>
                          {approving === r.ID + 'aprobado' ? 'Aprobando…' : 'Aprobar'}
                        </Button>
                        <Button variant="outlined" onClick={() => approve(r.ID, 'rechazado')}
                          disabled={!!approving}
                          className="border-err text-err hover:bg-err-con">
                          <span className="ms" style={{ fontSize: 16 }}>cancel</span>
                          {approving === r.ID + 'rechazado' ? 'Rechazando…' : 'Rechazar'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
