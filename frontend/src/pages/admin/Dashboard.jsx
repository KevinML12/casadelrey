import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { saludo } from '../../lib/greeting';
import Button from '../../components/ui/Button';
import AdminResourceState from '../../components/ui/AdminResourceState';

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
      <p className="text-11 text-bg/50 font-semibold uppercase tracking-widest mb-1">{fmtShortDate(label)}</p>
      <p className="text-13 text-bg font-bold">Q{Number(amount).toFixed(0)} recaudado</p>
      {users > 0 && <p className="text-12 text-bg/60 mt-0.5">{users} usuario{users !== 1 ? 's' : ''} nuevo{users !== 1 ? 's' : ''}</p>}
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
    <div className="glass-light rounded-[16px] p-6 md:p-7 lg:col-span-2 min-w-0">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <p className="text-13 text-bg/45 font-semibold uppercase tracking-widest">Tendencia · últimos 30 días</p>
        </div>
        <div className="flex items-center gap-4 text-13">
          <span className="text-bg/50">Total <strong className="text-bg font-bold">Q{totalAmount.toFixed(0)}</strong></span>
          <span className="text-bg/50">Promedio/día <strong className="text-bg font-bold">Q{avgDaily.toFixed(0)}</strong></span>
          <span className="text-bg/50">Usuarios nuevos <strong className="text-bg font-bold">{totalUsers}</strong></span>
        </div>
      </div>

      {loading ? (
        <div className="h-[240px] flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-bg/12 border-t-acento animate-spin" />
        </div>
      ) : (
        <div className="h-[240px] mt-3 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--acento)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--acento)" stopOpacity={0.02} />
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
                stroke="var(--acento)" strokeWidth={2.5} fill="url(#trendFill)"
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


const SOURCES = {
  kpis: '/admin/kpis', cells: '/admin/cell-reports/stats',
  donations: '/admin/donations?status=received&limit=5',
  counts: '/admin/notifications/counts', trend: '/admin/kpis/trend?days=30',
};
const PENDING = [
  ['pending_receipts', 'Comprobantes por revisar', '/admin/receipts'],
  ['pending_reports', 'Reportes de células pendientes', '/admin/cell-reports'],
  ['unread_petitions', 'Peticiones sin leer', '/admin/petitions'],
  ['pending_volunteers', 'Solicitudes de voluntariado', '/admin/volunteers'],
  ['pending_connect_cards', 'Personas por contactar', '/admin/connect-cards'],
];
const amount = value => new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(value || 0);

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [showTrend, setShowTrend] = useState(false);
  const load = async () => {
    setLoading(true);
    const entries = Object.entries(SOURCES);
    const results = await Promise.allSettled(entries.map(([, path]) => apiClient.get(path)));
    setData(Object.fromEntries(entries.flatMap(([key], index) => results[index].status === 'fulfilled' ? [[key, results[index].value.data]] : [])));
    setErrors(Object.fromEntries(entries.filter((_, i) => results[i].status === 'rejected').map(([key]) => [key, true])));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const donations = data.donations?.data || data.donations || [];
  const pending = PENDING.filter(([key]) => data.counts?.[key] > 0);
  const metrics = [
    ['Usuarios', data.kpis?.total_users], ['Donaciones recibidas', data.kpis?.total_donations],
    ['Total recibido', data.kpis ? amount(data.kpis.total_revenue) : null], ['Peticiones', data.kpis?.total_petitions],
  ];
  return <div className="mx-auto max-w-6xl space-y-6">
    <header><p className="text-13 capitalize text-bg/55">{new Date().toLocaleDateString('es-GT', { timeZone: 'America/Guatemala', weekday: 'long', day: 'numeric', month: 'long' })}</p><h1 className="mt-1 text-28 font-bold tracking-tightish">{saludo()}, {(user?.name || 'bienvenido').split(' ')[0]}</h1><p className="mt-2 text-15 text-bg/65">Tu comunidad, sus novedades y lo que necesita atención.</p></header>
    {loading ? <AdminResourceState loading /> : <>
      {!!Object.keys(errors).length && <AdminResourceState error="Algunos datos no están disponibles. Los valores que faltan aparecen como —." onRetry={load} />}
      <section aria-label="Actividad de la iglesia" className="glass-light grid grid-cols-2 divide-x divide-bg/10 rounded-[16px] lg:grid-cols-4">{metrics.map(([label, value]) => <div key={label} className="p-4 sm:p-6"><p className="text-12 text-bg/60">{label}</p><p className="mt-2 text-24 font-bold">{value ?? '—'}</p></div>)}</section>
      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <section className="glass-light rounded-[16px] p-5 sm:p-6"><h2 className="text-18 font-bold">Por atender</h2>{errors.counts ? <p className="mt-4 text-14 text-bg/60">No se pudieron consultar los pendientes.</p> : pending.length ? <div className="mt-4 divide-y divide-bg/10">{pending.map(([key, label, to]) => <Link key={key} to={to} className="focus-ring flex min-h-14 items-center justify-between gap-4 rounded-lg px-2 py-3 text-14 font-semibold hover:bg-white/60"><span>{label}</span><span className="rounded-md bg-bg px-2 py-1 text-12 text-white">{data.counts[key]}</span></Link>)}</div> : <p className="mt-4 text-14 text-bg/60">No hay pendientes de revisión en este momento.</p>}</section>
        <section className="glass-light rounded-[16px] p-5 sm:p-6"><h2 className="text-18 font-bold">Administrar contenido</h2><p className="mt-2 text-14 text-bg/60">Accede a las tareas habituales.</p><div className="mt-5 grid gap-2 sm:grid-cols-2">{[['/admin/cells', 'Células y reuniones'], ['/admin/cell-categories', 'Categorías y fotos'], ['/admin/events', 'Eventos'], ['/admin/social', 'Redes de la iglesia']].map(([to, label]) => <Button key={to} as="link" to={to} variant="outlined" className="!whitespace-normal text-left">{label}</Button>)}</div></section>
      </div>
      <section className="glass-light rounded-[16px] p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-18 font-bold">Últimas donaciones recibidas</h2><Button as="link" to="/admin/donations" variant="text">Ver todas</Button></div>{errors.donations ? <p className="mt-4 text-14 text-bg/60">No se pudieron consultar las donaciones.</p> : !donations.length ? <p className="mt-4 text-14 text-bg/60">Todavía no hay donaciones recibidas.</p> : <div className="mt-4 divide-y divide-bg/10">{donations.slice(0, 5).map(row => <div key={row.ID} className="flex flex-wrap justify-between gap-3 py-4"><div><p className="text-14 font-semibold">{row.name}</p><p className="mt-1 text-12 text-bg/60">{row.donation_purpose || 'Donación'} · {row.CreatedAt ? new Date(row.CreatedAt).toLocaleDateString('es-GT', { timeZone: 'America/Guatemala' }) : 'Fecha no disponible'}</p></div><p className="text-15 font-bold">{row.currency === 'GTQ' ? amount(row.amount) : `${row.currency} ${Number(row.amount).toFixed(2)}`}</p></div>)}</div>}</section>
      <details onToggle={event => setShowTrend(event.currentTarget.open)} className="glass-light rounded-[16px] p-5 sm:p-6"><summary className="focus-ring cursor-pointer rounded-lg py-2 text-16 font-bold">Más actividad y tendencia</summary><div className="mt-5 space-y-5"><div className="grid gap-5 sm:grid-cols-3">{[['Convertidos', data.cells?.total_converts], ['Reconciliados', data.cells?.total_reconciled], ['Ofrenda acumulada de células', data.cells ? amount(data.cells.total_offering) : null]].map(([label, value]) => <div key={label}><p className="text-13 text-bg/60">{label}</p><p className="mt-2 text-24 font-bold">{value ?? '—'}</p></div>)}</div>{showTrend && !errors.trend && <TrendChart data={data.trend || []} loading={false} />}</div></details>
    </>}
  </div>;
}
