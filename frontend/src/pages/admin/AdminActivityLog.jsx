import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import Paginator from '../../components/ui/Paginator';
import { FilterChip } from '../../components/ui/Chip';

const ACTIONS = ['create', 'update', 'delete', 'approve', 'login'];
const RESOURCES = ['user', 'post', 'event', 'boleta', 'cell_report', 'volunteer', 'announcement', 'gallery'];

const ACTION_COLORS = {
  create:  { bg: 'bg-sec-con', text: 'text-on-sec-con', icon: 'add_circle' },
  update:  { bg: 'bg-pri-con', text: 'text-on-pri-con', icon: 'edit' },
  delete:  { bg: 'bg-err-con', text: 'text-on-err-con', icon: 'delete' },
  approve: { bg: 'bg-ter-con', text: 'text-on-ter-con', icon: 'check_circle' },
  login:   { bg: 'bg-bg/8', text: 'text-bg',   icon: 'login' },
};

function fmtDate(d) {
  return new Date(d).toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminActivityLog() {
  const [logs,    setLogs]    = useState([]);
  const [meta,    setMeta]    = useState(null);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionF, setActionF] = useState('');
  const [resourceF, setResourceF] = useState('');

  const load = (p = page) => {
    setLoading(true);
    const params = new URLSearchParams({ page: p, limit: 30 });
    if (actionF) params.set('action', actionF);
    if (resourceF) params.set('resource', resourceF);
    apiClient.get(`/admin/activity-log?${params}`)
      .then(r => { setLogs(r.data.data || []); setMeta(r.data.meta); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); setPage(1); }, [actionF, resourceF]);
  useEffect(() => { load(page); }, [page]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-pri-con flex items-center justify-center shrink-0">
          <Icon name="history" className="w-[22px] h-[22px] text-on-pri-con" stroke={1.8} />
        </div>
        <div>
          <h1 className="text-headline-s text-bg font-black leading-tight">Historial de Actividad</h1>
          <p className="text-body-s text-bg/50 mt-0.5">{meta?.total ?? 0} eventos registrados</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-3">
        <div>
          <p className="text-label-s text-bg/50 mb-2 uppercase tracking-widest">Acción</p>
          <div className="flex gap-2 flex-wrap">
            <FilterChip selected={actionF === ''} onClick={() => setActionF('')} icon="apps">Todas</FilterChip>
            {ACTIONS.map(a => (
              <FilterChip key={a} selected={actionF === a} onClick={() => setActionF(a)}>
                {a}
              </FilterChip>
            ))}
          </div>
        </div>
        <div>
          <p className="text-label-s text-bg/50 mb-2 uppercase tracking-widest">Recurso</p>
          <div className="flex gap-2 flex-wrap">
            <FilterChip selected={resourceF === ''} onClick={() => setResourceF('')} icon="apps">Todos</FilterChip>
            {RESOURCES.map(r => (
              <FilterChip key={r} selected={resourceF === r} onClick={() => setResourceF(r)}>
                {r}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-pri animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-light rounded-[24px] card-spring flex flex-col items-center py-20 gap-4">
          <div className="w-16 h-16 rounded-[28px] bg-bg/8 flex items-center justify-center">
            <Icon name="history" className="w-[32px] h-[32px] text-bg/50" stroke={1.8} />
          </div>
          <p className="text-body-l text-bg font-medium">Sin actividad registrada</p>
        </div>
      ) : (
        <div className="glass-light rounded-[24px] card-spring overflow-hidden divide-y divide-bg/8">
          {logs.map(log => {
            const style = ACTION_COLORS[log.action] || ACTION_COLORS.login;
            return (
              <div key={log.ID} className="flex items-start gap-4 p-4 hover:bg-bg/8 transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${style.bg}`}>
                  <Icon name={style.icon} className={`w-[16px] h-[16px] ${style.text}`} stroke={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-body-s text-bg font-medium">{log.user_name || `User #${log.user_id}`}</span>
                    <span className="text-label-s text-bg/50 px-2 py-0.5 rounded-full bg-bg/8">{log.action}</span>
                    <span className="text-label-s text-bg/50">→</span>
                    <span className="text-label-s text-bg/50 px-2 py-0.5 rounded-full bg-bg/8">{log.resource}</span>
                    {log.resource_id > 0 && (
                      <span className="text-label-s text-bg/50">#{log.resource_id}</span>
                    )}
                  </div>
                  {log.details && (
                    <p className="text-body-s text-bg/50 mt-0.5 truncate">{log.details}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-label-s text-bg/50 whitespace-nowrap">{fmtDate(log.CreatedAt)}</p>
                  {log.ip_address && (
                    <p className="text-label-s text-bg/50 opacity-60">{log.ip_address}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Paginator meta={meta} onPage={setPage} />
    </div>
  );
}
