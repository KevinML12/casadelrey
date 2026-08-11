import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import CellReportForm from './CellReportForm';
import Button from '../ui/Button';
import Chip, { FilterChip } from '../ui/Chip';

const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', color: 'default',   icon: 'schedule' },
  aprobado:  { label: 'Aprobado',  color: 'tertiary',  icon: 'check_circle' },
  rechazado: { label: 'Rechazado', color: 'error',     icon: 'cancel' },
};

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-acento animate-spin" />
  </div>
);

function MiniStat({ label, value, tint = 'pri' }) {
  const tintMap = {
    pri: 'text-bg',
    sec: 'text-emerald',
    ter: 'text-acento',
  };
  return (
    <div className="glass-light rounded-[24px] card-spring p-4 flex flex-col gap-2">
      <div>
        <p className="text-label-s text-bg/50 uppercase tracking-widest">{label}</p>
        <p className={`text-headline-s font-black ${tintMap[tint]}`}>{value}</p>
      </div>
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
  const [filter,    setFilter]    = useState('');
  const [expanded,  setExpanded]  = useState(null);
  const [approving, setApproving] = useState(null);

  const refresh = () => {
    setLoading(true);
    const params = filter ? `?status=${filter}` : '';
    Promise.all([
      apiClient.get(`/admin/cell-reports${params}`).then(r => r.data?.data || r.data || []),
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
    } finally { setApproving(null); }
  };

  const pendingCount = reports.filter(r => r.status === 'pendiente').length;

  const filterCounts = {
    '':          reports.length,
    pendiente:   reports.filter(r => r.status === 'pendiente').length,
    aprobado:    reports.filter(r => r.status === 'aprobado').length,
    rechazado:   reports.filter(r => r.status === 'rechazado').length,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-headline-s text-bg font-black leading-tight">Reportes de Células</h1>
            <p className="text-body-s text-bg/50 mt-0.5">
              {isAdmin && pendingCount > 0
                ? <><span className="text-bg font-semibold">{pendingCount}</span> pendiente{pendingCount !== 1 ? 's' : ''} de aprobación</>
                : `${reports.length} reporte${reports.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="filled" onClick={() => setShowForm(s => !s)}>
            {showForm ? 'Cancelar' : 'Nuevo reporte'}
          </Button>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="glass-light rounded-[24px] card-spring mb-8 p-6">
          <CellReportForm onSuccess={() => { setShowForm(false); refresh(); }} />
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <MiniStat label="Reportes"      value={stats.total_reports ?? 0}    tint="pri" />
          <MiniStat label="Asistentes"    value={stats.total_attendees ?? 0}   tint="sec" />
          <MiniStat label="Convertidos"   value={stats.total_converts ?? 0}    tint="ter" />
          <MiniStat label="Reconciliados" value={stats.total_reconciled ?? 0}  tint="pri" />
          <MiniStat label="Ofrenda"       value={`Q${(stats.total_offering ?? 0).toFixed(0)}`} tint="sec" />
        </div>
      )}

      {/* Filter chips */}
      {isAdmin && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { val: '',          lbl: 'Todos',      icon: 'apps' },
            { val: 'pendiente', lbl: 'Pendientes', icon: 'schedule' },
            { val: 'aprobado',  lbl: 'Aprobados',  icon: 'check_circle' },
            { val: 'rechazado', lbl: 'Rechazados', icon: 'cancel' },
          ].map(({ val, lbl, icon }) => (
            <FilterChip key={val} selected={filter === val} icon={icon}
              count={val ? filterCounts[val] : undefined}
              onClick={() => setFilter(val)}>
              {lbl}
            </FilterChip>
          ))}
        </div>
      )}

      {/* Resumen por célula */}
      {stats?.by_cell?.length > 0 && (
        <div className="glass-light rounded-[24px] card-spring mb-8 overflow-hidden">
          <div className="px-5 py-4 border-b border-bg/10">
            <h3 className="text-title-s text-bg font-semibold">Resumen por célula</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-bg/10 bg-bg/4">
                  {['Célula', 'Reportes', 'Asistentes', 'Conv.', 'Rec.', 'Ofrenda'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-label-s text-bg/50 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-bg/8">
                {stats.by_cell.map((c, i) => (
                  <tr key={i} className="hover:bg-bg/8 transition-colors">
                    <td className="px-5 py-3 text-body-s text-bg font-medium">
                      {c.cell_code && <span className="text-bg mr-1.5 font-mono">[{c.cell_code}]</span>}{c.cell_name}
                    </td>
                    <td className="px-5 py-3 text-body-s text-bg/50">{c.reports}</td>
                    <td className="px-5 py-3 text-body-s text-bg/50">{c.total_attendees}</td>
                    <td className="px-5 py-3 text-body-s text-bg/50">{c.converts}</td>
                    <td className="px-5 py-3 text-body-s text-bg/50">{c.reconciled}</td>
                    <td className="px-5 py-3 text-body-s text-bg font-semibold">Q{Number(c.total_offering ?? 0).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lista de reportes */}
      {loading ? <Spinner /> : reports.length === 0 ? (
        <div className="glass-light rounded-[24px] card-spring flex flex-col items-center py-20 gap-4">
          <div className="text-center">
            <p className="text-body-l text-bg font-medium">Sin reportes</p>
            <p className="text-body-s text-bg/50 mt-1">
              {filter ? `No hay reportes con estado "${filter}".` : 'Crea el primero con el botón de arriba.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => {
            const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.pendiente;
            const open = expanded === r.ID;
            return (
              <div key={r.ID} className="glass-light rounded-[24px] card-spring overflow-hidden">

                {/* Accordion trigger */}
                <button onClick={() => setExpanded(open ? null : r.ID)}
                  className="w-full text-left flex items-start gap-4 p-5 hover:bg-bg/8 transition-colors">

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {r.cell_code && (
                        <span className="text-label-s font-mono px-2 h-7 flex items-center rounded-lg bg-bg text-white">{r.cell_code}</span>
                      )}
                      <span className="text-body-l text-bg font-medium">{r.cell_name}</span>
                      <Chip color={st.color} icon={st.icon}>{st.label}</Chip>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-body-s text-bg/50">
                      {isAdmin && r.leader_name && (
                        <span>{r.leader_name}</span>
                      )}
                      <span>
                        {r.meeting_date ? new Date(r.meeting_date + 'T12:00').toLocaleDateString('es-ES', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        }) : '—'}
                      </span>
                      <span>{r.total_attendees ?? 0} asist.</span>
                      {((r.converts ?? 0) + (r.reconciled ?? 0)) > 0 && (
                        <span className="text-bg font-medium">
                          {(r.converts || 0) + (r.reconciled || 0)} nuevos
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-13 font-semibold text-bg/50 shrink-0 mt-1 whitespace-nowrap">
                    {open ? 'Ver menos' : 'Ver más'}
                  </span>
                </button>

                {/* Detalle expandido */}
                {open && (
                  <div className="border-t border-bg/10 p-5 space-y-5 bg-bg/4">

                    {/* Números */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Asistentes',    value: r.total_attendees ?? 0, tint: 'text-bg' },
                        { label: 'Convertidos',   value: r.converts ?? 0,        tint: 'text-emerald' },
                        { label: 'Reconciliados', value: r.reconciled ?? 0,      tint: 'text-acento' },
                        { label: 'Ofrenda',       value: `Q${Number(r.offering ?? 0).toFixed(0)}`, tint: 'text-bg' },
                      ].map(({ label, value, tint }) => (
                        <div key={label} className="glass-light rounded-[24px] card-spring p-4 flex flex-col gap-2">
                          <div>
                            <p className="text-label-s text-bg/50 uppercase tracking-widest">{label}</p>
                            <p className={`text-headline-s font-black ${tint}`}>{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Info adicional */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-s">
                      {[
                        r.pastor_name && { label: 'Pastor', value: r.pastor_name },
                        r.topic       && { label: 'Tema',   value: r.topic },
                        r.host_name   && { label: 'Anfitrión', value: `${r.host_name}${r.host_phone ? ` · ${r.host_phone}` : ''}` },
                        r.address     && { label: 'Dirección', value: r.address },
                      ].filter(Boolean).map(({ label, value }) => (
                        <div key={label} className="flex gap-1.5">
                          <span className="text-bg/50 shrink-0">{label}:</span>
                          <span className="text-bg font-medium">{value}</span>
                        </div>
                      ))}
                    </div>

                    {r.photo_url && (
                      <img src={r.photo_url} alt="Foto de la reunión"
                        className="w-full max-h-60 object-cover rounded-2xl border border-bg/10" />
                    )}

                    {r.notes && (
                      <div className="glass-light rounded-[20px] card-spring px-4 py-3">
                        <p className="text-body-s text-bg/50 leading-relaxed">{r.notes}</p>
                      </div>
                    )}

                    {/* Botones aprobación */}
                    {isAdmin && r.status === 'pendiente' && (
                      <div className="flex gap-3 pt-2">
                        <Button variant="filled" onClick={() => approve(r.ID, 'aprobado')} disabled={!!approving}>
                          {approving === r.ID + 'aprobado' ? 'Aprobando…' : 'Aprobar'}
                        </Button>
                        <Button variant="outlined" onClick={() => approve(r.ID, 'rechazado')} disabled={!!approving}
                          className="border-rose text-rose before:bg-rose hover:before:opacity-[.08]">
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
