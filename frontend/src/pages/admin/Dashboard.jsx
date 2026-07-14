import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { downloadCsv } from '../../lib/exportCsv';
import Button from '../../components/ui/Button';

const METHOD_LABEL = {
  transferencia: 'Transferencia',
  presencial:    'En persona',
  tigo_money:    'Tigo Money', // histórico (método removido)
};

const saludo = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

function StatCard({ icon, label, value, tint = 'pri', sub }) {
  const tintMap = {
    pri: { bg: 'bg-pri-con', text: 'text-on-pri-con', val: 'text-pri' },
    sec: { bg: 'bg-sec-con', text: 'text-on-sec-con', val: 'text-sec' },
    ter: { bg: 'bg-ter-con', text: 'text-on-ter-con', val: 'text-ter' },
    err: { bg: 'bg-err-con', text: 'text-on-err-con', val: 'text-err' },
  };
  const t = tintMap[tint] || tintMap.pri;
  return (
    <div className="bg-surf-low border border-outline-var rounded-2xl p-5 flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.bg}`}>
        <span className={`ms ${t.text}`} style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div>
        <p className="text-label-s text-on-surf-var uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-headline-m font-black ${t.val}`}>{value ?? '—'}</p>
        {sub && <p className="text-label-s text-on-surf-var mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SectionLabel({ icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="ms text-on-surf-var" style={{ fontSize: 18 }}>{icon}</span>
      <p className="text-label-l text-on-surf-var font-semibold uppercase tracking-widest">{children}</p>
      <div className="flex-1 h-px bg-outline-var ml-2" />
    </div>
  );
}

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-6 h-6 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [kpis,      setKpis]      = useState(null);
  const [cellStats, setCellStats] = useState(null);
  const [donations, setDonations] = useState([]);
  const [notifs,    setNotifs]    = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get('/admin/kpis').then(r => setKpis(r.data)),
      apiClient.get('/admin/donations').then(r => setDonations(r.data?.data || r.data || [])),
      apiClient.get('/admin/cell-reports/stats').then(r => setCellStats(r.data)).catch(() => {}),
      apiClient.get('/admin/notifications/counts').then(r => setNotifs(r.data)).catch(() => {}),
    ]).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Saludo personalizado */}
      <div className="mb-8">
        <p className="text-body-s text-on-surf-var capitalize">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="text-headline-s text-on-surf font-black leading-tight mt-0.5">
          {saludo()}, {(user?.name || 'bienvenido').split(' ')[0]}
        </h1>
        <p className="text-body-s text-on-surf-var mt-1">Este es el resumen de la iglesia hoy.</p>
      </div>

      {/* Alertas pendientes */}
      {!loading && notifs && (notifs.pending_cell_reports > 0 || notifs.unread_petitions > 0 || notifs.pending_volunteers > 0) && (
        <div className="mb-8 bg-err-con border border-err/20 rounded-2xl p-4 flex flex-wrap gap-4 items-center">
          <span className="ms text-err" style={{ fontSize: 20 }}>notifications_active</span>
          <div className="flex-1 flex flex-wrap gap-4">
            {notifs.pending_cell_reports > 0 && (
              <span className="text-body-s text-on-err-con font-medium">
                <strong>{notifs.pending_cell_reports}</strong> reporte{notifs.pending_cell_reports !== 1 ? 's' : ''} de células pendiente{notifs.pending_cell_reports !== 1 ? 's' : ''}
              </span>
            )}
            {notifs.unread_petitions > 0 && (
              <span className="text-body-s text-on-err-con font-medium">
                <strong>{notifs.unread_petitions}</strong> petición{notifs.unread_petitions !== 1 ? 'es' : ''} sin leer
              </span>
            )}
            {notifs.pending_volunteers > 0 && (
              <span className="text-body-s text-on-err-con font-medium">
                <strong>{notifs.pending_volunteers}</strong> voluntario{notifs.pending_volunteers !== 1 ? 's' : ''} pendiente{notifs.pending_volunteers !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {/* General KPIs */}
      <SectionLabel icon="bar_chart">General</SectionLabel>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard icon="person"           label="Usuarios"        tint="pri"
          value={loading ? '…' : kpis?.total_users ?? 0} />
        <StatCard icon="favorite"         label="Donaciones"      tint="err"
          value={loading ? '…' : kpis?.total_donations ?? 0} />
        <StatCard icon="volunteer_activism" label="Peticiones"    tint="ter"
          value={loading ? '…' : kpis?.total_petitions ?? 0} />
        <StatCard icon="payments"         label="Recaudado"       tint="sec"
          value={loading ? '…' : kpis?.total_revenue != null ? `Q${Number(kpis.total_revenue).toFixed(0)}` : 'Q0'} />
        <StatCard icon="visibility"       label="Vistas blog"     tint="pri"
          value={loading ? '…' : kpis?.total_blog_views ?? 0} />
        <StatCard icon="groups"           label="Rept. células"   tint="ter"
          value={loading ? '…' : kpis?.total_cell_reports ?? 0} />
      </div>

      {/* Cell KPIs */}
      <SectionLabel icon="church">Almas ganadas</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard icon="person_add"       label="Convertidos"     tint="ter"
          value={loading ? '…' : cellStats?.total_converts ?? 0}
          sub="Este período" />
        <StatCard icon="favorite_border"  label="Reconciliados"   tint="sec"
          value={loading ? '…' : cellStats?.total_reconciled ?? 0}
          sub="Este período" />
        <StatCard icon="savings"          label="Ofrenda células" tint="pri"
          value={loading ? '…' : cellStats?.total_offering != null ? `Q${Number(cellStats.total_offering).toFixed(0)}` : 'Q0'}
          sub="Total acumulado" />
      </div>

      {/* Últimas donaciones */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="ms text-on-surf-var" style={{ fontSize: 18 }}>payments</span>
          <p className="text-label-l text-on-surf-var font-semibold uppercase tracking-widest">Últimas donaciones</p>
        </div>
        <Button variant="tonal" size="sm" onClick={() => downloadCsv('/admin/export/donations', 'donaciones.csv')}>
          <span className="ms" style={{ fontSize: 16 }}>download</span>
          Exportar CSV
        </Button>
      </div>
      <div className="bg-surf-low border border-outline-var rounded-2xl overflow-hidden">
        {loading ? <Spinner /> : donations.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-on-surf-var gap-3">
            <div className="w-14 h-14 rounded-2xl bg-surf-high flex items-center justify-center">
              <span className="ms" style={{ fontSize: 28 }}>payments</span>
            </div>
            <p className="text-body-s">No hay donaciones registradas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-var bg-surf">
                  {['#', 'Nombre', 'Destino', 'Monto', 'Método', 'Fecha'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-label-s text-on-surf-var uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-var">
                {donations.slice(0, 15).map(d => (
                  <tr key={d.ID} className="hover:bg-surf-high transition-colors">
                    <td className="px-5 py-3.5 text-label-s text-on-surf-var font-mono">{d.ID}</td>
                    <td className="px-5 py-3.5 text-body-s text-on-surf font-medium">{d.name}</td>
                    <td className="px-5 py-3.5 text-body-s text-on-surf-var capitalize">{d.donation_purpose || '—'}</td>
                    <td className="px-5 py-3.5 text-body-s text-ter font-bold">{d.currency} {Number(d.amount).toFixed(2)}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 h-7 px-3 rounded-lg bg-surf-high text-on-surf-var text-label-m font-medium">
                        {METHOD_LABEL[d.payment_method] || d.payment_method || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-body-s text-on-surf-var whitespace-nowrap">
                      {d.CreatedAt ? new Date(d.CreatedAt).toLocaleDateString('es-ES') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
