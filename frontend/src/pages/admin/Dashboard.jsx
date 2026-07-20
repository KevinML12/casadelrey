import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { downloadCsv } from '../../lib/exportCsv';
import { saludo } from '../../lib/greeting';
import Button from '../../components/ui/Button';
import StatCard from '../../components/ui/StatCard';
import { Icon } from '../../components/ui/Glass';

const METHOD_LABEL = {
  transferencia: 'Transferencia',
  presencial:    'En persona',
  tigo_money:    'Tigo Money', // histórico (método removido)
};

function SectionLabel({ icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon name={icon} className="w-[18px] h-[18px] text-bg/45" stroke={1.8} />
      <p className="text-[12.5px] text-bg/45 font-semibold uppercase tracking-widest">{children}</p>
      <div className="flex-1 h-px bg-bg/10 ml-2" />
    </div>
  );
}

// Card contenedora — agrupa un tema (General, Almas ganadas) en UNA pieza
// grande en vez de una grilla pareja de cajas sueltas. .glass-light (no
// .glass-nav — esa es la clase del navbar público y NUNCA recibe el brillo
// al cursor, useGlassSpecular.js solo escucha .liquid-glass/.glass-light).
function SectionContainer({ icon, label, children }) {
  return (
    <div className="glass-light rounded-[32px] card-spring p-6 md:p-7 mb-8">
      <SectionLabel icon={icon}>{label}</SectionLabel>
      {children}
    </div>
  );
}

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-6 h-6 rounded-full border-2 border-bg/12 border-t-celeste animate-spin" />
  </div>
);

const fmtShortDate = (iso) => {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const amount = payload.find(p => p.dataKey === 'donations_amount')?.value ?? 0;
  const users = payload.find(p => p.dataKey === 'new_users')?.value ?? 0;
  return (
    <div className="glass-light rounded-[14px] px-3.5 py-2.5 shadow-card-lg">
      <p className="text-[11px] text-bg/50 font-semibold uppercase tracking-widest mb-1">{fmtShortDate(label)}</p>
      <p className="text-[13px] text-bg font-bold">Q{Number(amount).toFixed(0)} recaudado</p>
      {users > 0 && <p className="text-[12px] text-bg/60 mt-0.5">{users} usuario{users !== 1 ? 's' : ''} nuevo{users !== 1 ? 's' : ''}</p>}
    </div>
  );
}

// Tendencia de los ultimos N dias — pensada como el "objeto" visual que le
// faltaba al dashboard (antes solo tenia grillas de numeros). Area = plata
// recaudada por dia (eje izq), linea punteada = usuarios nuevos (eje der,
// escala independiente porque las magnitudes no son comparables).
function TrendChart({ data, loading }) {
  const totalAmount = data.reduce((s, d) => s + (d.donations_amount || 0), 0);
  const totalUsers  = data.reduce((s, d) => s + (d.new_users || 0), 0);
  const avgDaily    = data.length ? totalAmount / data.length : 0;

  return (
    <div className="glass-light rounded-[28px] card-spring p-6 md:p-7 lg:col-span-2">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Icon name="trending_up" className="w-[18px] h-[18px] text-bg/45" stroke={1.8} />
          <p className="text-[12.5px] text-bg/45 font-semibold uppercase tracking-widest">Tendencia · últimos 30 días</p>
        </div>
        <div className="flex items-center gap-4 text-[12.5px]">
          <span className="text-bg/50">Total <strong className="text-bg font-bold">Q{totalAmount.toFixed(0)}</strong></span>
          <span className="text-bg/50">Promedio/día <strong className="text-bg font-bold">Q{avgDaily.toFixed(0)}</strong></span>
          <span className="text-bg/50">Usuarios nuevos <strong className="text-bg font-bold">{totalUsers}</strong></span>
        </div>
      </div>

      {loading ? (
        <div className="h-[240px] flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-bg/12 border-t-celeste animate-spin" />
        </div>
      ) : (
        <div className="h-[240px] mt-3 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--celeste)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--celeste)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--bg)" strokeOpacity={0.08} />
              <XAxis
                dataKey="date" tickFormatter={fmtShortDate}
                tick={{ fill: 'var(--bg)', fillOpacity: 0.4, fontSize: 11 }}
                axisLine={false} tickLine={false} minTickGap={28}
              />
              <YAxis yAxisId="amount" hide />
              <YAxis yAxisId="users" orientation="right" hide />
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: 'var(--bg)', strokeOpacity: 0.15 }} />
              <Area
                yAxisId="amount" type="monotone" dataKey="donations_amount"
                stroke="var(--celeste)" strokeWidth={2.5} fill="url(#trendFill)"
              />
              <Line
                yAxisId="users" type="monotone" dataKey="new_users"
                stroke="var(--bg)" strokeWidth={2} strokeDasharray="4 3" dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

const QUICK_ACTIONS = [
  { to: '/admin/events',    icon: 'calendar_month',      label: 'Nuevo evento' },
  { to: '/admin/blog',      icon: 'article',              label: 'Nuevo post' },
  { to: '/admin/receipts',  icon: 'receipt_long',         label: 'Comprobantes', badgeKey: 'pending_receipts' },
  { to: '/admin/petitions', icon: 'volunteer_activism',   label: 'Peticiones',   badgeKey: 'unread_petitions' },
];

// Companero del trend chart en el bento del dashboard — el "objeto" visual
// distinto a una grilla de numeros: accesos directos con badge de pendientes,
// reusa /admin/notifications/counts que el dashboard ya pedia.
function QuickActions({ notifs }) {
  return (
    <div className="glass-light rounded-[28px] card-spring p-6 md:p-7 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="spark" className="w-[18px] h-[18px] text-bg/45" stroke={1.8} />
        <p className="text-[12.5px] text-bg/45 font-semibold uppercase tracking-widest">Accesos rápidos</p>
      </div>
      <div className="flex-1 flex flex-col gap-1">
        {QUICK_ACTIONS.map(({ to, icon, label, badgeKey }) => {
          const badge = badgeKey ? (notifs?.[badgeKey] || 0) : 0;
          return (
            <Link key={to} to={to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-bg/6 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-bg/8 group-hover:bg-bg flex items-center justify-center shrink-0 transition-colors">
                <Icon name={icon} className="w-[16px] h-[16px] text-bg group-hover:text-white transition-colors" stroke={1.8} />
              </div>
              <span className="flex-1 text-[13.5px] text-bg font-semibold">{label}</span>
              {badge > 0 && (
                <span className="min-w-[20px] h-5 rounded-full bg-rose text-white text-[10.5px] font-bold flex items-center justify-center px-1.5">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
              <Icon name="arrow" className="w-[14px] h-[14px] text-bg/25 group-hover:text-bg/50 transition-colors" stroke={1.8} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [kpis,      setKpis]      = useState(null);
  const [cellStats, setCellStats] = useState(null);
  const [donations, setDonations] = useState([]);
  const [notifs,    setNotifs]    = useState(null);
  const [trend,     setTrend]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get('/admin/kpis').then(r => setKpis(r.data)),
      apiClient.get('/admin/donations').then(r => setDonations(r.data?.data || r.data || [])),
      apiClient.get('/admin/cell-reports/stats').then(r => setCellStats(r.data)).catch(() => {}),
      apiClient.get('/admin/notifications/counts').then(r => setNotifs(r.data)).catch(() => {}),
    ]).catch(console.error).finally(() => setLoading(false));

    apiClient.get('/admin/kpis/trend?days=30')
      .then(r => setTrend(r.data || []))
      .catch(() => setTrend([]))
      .finally(() => setTrendLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Saludo personalizado */}
      <div className="mb-8">
        <p className="text-[13.5px] text-bg/45 capitalize">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="text-[26px] text-bg font-black leading-tight mt-0.5">
          {saludo()}, {(user?.name || 'bienvenido').split(' ')[0]}
        </h1>
        <p className="text-[13.5px] text-bg/45 mt-1">Este es el resumen de la iglesia hoy.</p>
      </div>

      {/* Alertas pendientes */}
      {!loading && notifs && (notifs.pending_cell_reports > 0 || notifs.unread_petitions > 0 || notifs.pending_volunteers > 0) && (
        <div className="mb-8 glass-light rounded-[24px] p-4 flex flex-wrap gap-4 items-center border border-rose/30">
          <Icon name="notifications_active" className="w-5 h-5 text-rose" stroke={1.8} />
          <div className="flex-1 flex flex-wrap gap-4">
            {notifs.pending_cell_reports > 0 && (
              <span className="text-[13.5px] text-bg/75 font-medium">
                <strong className="text-bg">{notifs.pending_cell_reports}</strong> reporte{notifs.pending_cell_reports !== 1 ? 's' : ''} de células pendiente{notifs.pending_cell_reports !== 1 ? 's' : ''}
              </span>
            )}
            {notifs.unread_petitions > 0 && (
              <span className="text-[13.5px] text-bg/75 font-medium">
                <strong className="text-bg">{notifs.unread_petitions}</strong> petición{notifs.unread_petitions !== 1 ? 'es' : ''} sin leer
              </span>
            )}
            {notifs.pending_volunteers > 0 && (
              <span className="text-[13.5px] text-bg/75 font-medium">
                <strong className="text-bg">{notifs.pending_volunteers}</strong> voluntario{notifs.pending_volunteers !== 1 ? 's' : ''} pendiente{notifs.pending_volunteers !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Bento: trend chart + accesos rapidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <TrendChart data={trend} loading={trendLoading} />
        <QuickActions notifs={notifs} />
      </div>

      {/* General KPIs — agrupados en UNA card contenedora grande, las
          StatCard blancas flotan encima */}
      <SectionContainer icon="bar_chart" label="General">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard nested icon="person"           label="Usuarios"        tint="pri"
            value={loading ? '…' : kpis?.total_users ?? 0} />
          <StatCard nested icon="favorite"         label="Donaciones"      tint="err"
            value={loading ? '…' : kpis?.total_donations ?? 0} />
          <StatCard nested icon="volunteer_activism" label="Peticiones"    tint="ter"
            value={loading ? '…' : kpis?.total_petitions ?? 0} />
          <StatCard nested icon="payments"         label="Recaudado"       tint="sec"
            value={loading ? '…' : kpis?.total_revenue != null ? `Q${Number(kpis.total_revenue).toFixed(0)}` : 'Q0'} />
          <StatCard nested icon="visibility"       label="Vistas blog"     tint="pri"
            value={loading ? '…' : kpis?.total_blog_views ?? 0} />
          <StatCard nested icon="groups"           label="Rept. células"   tint="ter"
            value={loading ? '…' : kpis?.total_cell_reports ?? 0} />
        </div>
      </SectionContainer>

      {/* Cell KPIs */}
      <SectionContainer icon="church" label="Almas ganadas">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard nested icon="person_add"       label="Convertidos"     tint="ter"
            value={loading ? '…' : cellStats?.total_converts ?? 0}
            sub="Este período" />
          <StatCard nested icon="favorite_border"  label="Reconciliados"   tint="sec"
            value={loading ? '…' : cellStats?.total_reconciled ?? 0}
            sub="Este período" />
          <StatCard nested icon="savings"          label="Ofrenda células" tint="pri"
            value={loading ? '…' : cellStats?.total_offering != null ? `Q${Number(cellStats.total_offering).toFixed(0)}` : 'Q0'}
            sub="Total acumulado" />
        </div>
      </SectionContainer>

      {/* Últimas donaciones */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="payments" className="w-[18px] h-[18px] text-bg/45" stroke={1.8} />
          <p className="text-[12.5px] text-bg/45 font-semibold uppercase tracking-widest">Últimas donaciones</p>
        </div>
        <Button variant="tonal" size="sm" onClick={() => downloadCsv('/admin/export/donations', 'donaciones.csv')}>
          <Icon name="download" className="w-4 h-4" stroke={1.8} />
          Exportar CSV
        </Button>
      </div>
      <div className="glass-light rounded-[24px] card-spring overflow-hidden">
        {loading ? <Spinner /> : donations.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-bg/45 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-bg/6 flex items-center justify-center">
              <Icon name="payments" className="w-7 h-7" stroke={1.5} />
            </div>
            <p className="text-[13.5px]">No hay donaciones registradas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-bg/10">
                  {['#', 'Nombre', 'Destino', 'Monto', 'Método', 'Fecha'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] text-bg/45 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-bg/8">
                {donations.slice(0, 15).map(d => (
                  <tr key={d.ID} className="hover:bg-bg/4 transition-colors">
                    <td className="px-5 py-3.5 text-[11.5px] text-bg/40 font-mono">{d.ID}</td>
                    <td className="px-5 py-3.5 text-[13.5px] text-bg font-medium">{d.name}</td>
                    <td className="px-5 py-3.5 text-[13.5px] text-bg/55 capitalize">{d.donation_purpose || '—'}</td>
                    <td className="px-5 py-3.5 text-[13.5px] text-bg font-bold">{d.currency} {Number(d.amount).toFixed(2)}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-bg/6 text-bg/60 text-[12px] font-medium">
                        {METHOD_LABEL[d.payment_method] || d.payment_method || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[13.5px] text-bg/50 whitespace-nowrap">
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
