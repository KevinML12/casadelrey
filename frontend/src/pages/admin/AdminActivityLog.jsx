import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import Paginator from '../../components/ui/Paginator';
import { FilterChip } from '../../components/ui/Chip';

const ACTIONS = ['create', 'update', 'delete', 'approve', 'login', 'payment_decision'];
const RESOURCES = ['user', 'post', 'event', 'boleta', 'cell_report', 'volunteer', 'announcement', 'gallery', 'receipt', 'donation'];

const ACTION_COLORS = {
  create:  'bg-emerald',
  update:  'bg-bg',
  delete:  'bg-rose',
  approve: 'bg-amber',
  login:   'bg-bg/8',
};

function fmtDate(d) {
  return new Date(d).toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function detailsText(log) {
 if (log.action !== 'payment_decision') return log.details;
 try { const detail=JSON.parse(log.details); return `Revisión ${detail.revision}: ${detail.previous_state} → ${detail.state}${detail.reason ? '. Motivo: '+detail.reason : ''}`; } catch {return log.details;}
}
export default function AdminActivityLog() {
  const [query,setQuery]=useSearchParams();
  const [error,setError]=useState('');
  const [logs,    setLogs]    = useState([]);
  const [meta,    setMeta]    = useState(null);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const actionF=query.get('action') || '';
  const setActionF=value=>{setPage(1);setQuery(previous=>{const next=new URLSearchParams(previous);if(value)next.set('action',value);else next.delete('action');return next;});};
  const resourceF=query.get('resource') || '';
  const resourceId=query.get('resource_id') || '';
  const setResourceF=value=>{setPage(1);setQuery(previous=>{const next=new URLSearchParams(previous);next.delete('resource_id');if(value)next.set('resource',value);else next.delete('resource');return next;});};

  const load = useCallback((p = page) => {
    setError('');
    setLoading(true);
    const params = new URLSearchParams({ page: p, limit: 30 });
    if (actionF) params.set('action', actionF);
    if (resourceF) params.set('resource', resourceF);
    if(resourceId)params.set('resource_id',resourceId);
    apiClient.get(`/admin/activity-log?${params}`)
      .then(r => { setLogs(r.data.data || []); setMeta(r.data.meta); })
      .catch(()=>setError('No se pudo consultar el historial.'))
      .finally(() => setLoading(false));
  },[page,actionF,resourceF,resourceId]);

  useEffect(() => { load(page); }, [page,load]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-headline-s text-bg font-black leading-tight">Historial de Actividad</h1>
        <p className="text-body-s text-bg/50 mt-0.5">{meta?.total ?? 0} eventos registrados</p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-3">
        <div>
          <p className="text-label-s text-bg/50 mb-2 uppercase tracking-widest">Acción</p>
          <div className="flex gap-2 flex-wrap">
            <FilterChip selected={actionF === ''} onClick={() => setActionF('')}>Todas</FilterChip>
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
            <FilterChip selected={resourceF === ''} onClick={() => setResourceF('')}>Todos</FilterChip>
            {RESOURCES.map(r => (
              <FilterChip key={r} selected={resourceF === r} onClick={() => setResourceF(r)}>
                {r}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      {error && <div role="alert" className="rounded-[12px] border border-rose/30 p-4 mb-4"><p>{error}</p><button type="button" className="min-h-11 underline focus-ring" onClick={()=>load(page)}>Reintentar</button></div>}
      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-pri animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-light rounded-[24px] card-spring flex flex-col items-center py-20 gap-4">
          <p className="text-body-l text-bg font-medium">Sin actividad registrada</p>
        </div>
      ) : (
        <div className="glass-light rounded-[24px] card-spring overflow-hidden divide-y divide-bg/8">
          {logs.map(log => {
            const bg = ACTION_COLORS[log.action] || ACTION_COLORS.login;
            return (
              <div key={log.ID} className="flex flex-wrap sm:flex-nowrap items-start gap-4 p-4 hover:bg-bg/8 transition-colors">
                <div className={`w-9 h-9 rounded-xl shrink-0 mt-0.5 ${bg}`} />
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
                    <p className="text-body-s text-bg/50 mt-0.5 [overflow-wrap:anywhere]">{detailsText(log)}</p>
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
