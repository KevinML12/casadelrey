import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { downloadCsv } from '../../lib/exportCsv';
import Button from '../../components/ui/Button';
import StatCard from '../../components/ui/StatCard';
import { Icon } from '../../components/ui/Glass';

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

function SectionLabel({ icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon name={icon} className="w-[18px] h-[18px] text-white/40" stroke={1.8} />
      <p className="text-[12.5px] text-white/40 font-semibold uppercase tracking-widest">{children}</p>
      <div className="flex-1 h-px bg-white/10 ml-2" />
    </div>
  );
}

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-6 h-6 rounded-full border-2 border-white/15 border-t-celeste animate-spin" />
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

      {/* Saludo personalizado — texto suelto sobre el canvas navy, no es
          un módulo/card: se queda blanco. */}
      <div className="mb-8">
        <p className="text-[13.5px] text-white/40 capitalize">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="text-[26px] text-white font-black leading-tight mt-0.5">
          {saludo()}, {(user?.name || 'bienvenido').split(' ')[0]}
        </h1>
        <p className="text-[13.5px] text-white/40 mt-1">Este es el resumen de la iglesia hoy.</p>
      </div>

      {/* Alertas pendientes — módulo sin foto de fondo → glass-light */}
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

      {/* General KPIs — todas las cards sin foto de fondo → glass-light */}
      <SectionLabel icon="bar_chart">General</SectionLabel>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard icon="person"           label="Usuarios"        tint="pri" variant="light"
          value={loading ? '…' : kpis?.total_users ?? 0} />
        <StatCard icon="favorite"         label="Donaciones"      tint="err" variant="light"
          value={loading ? '…' : kpis?.total_donations ?? 0} />
        <StatCard icon="volunteer_activism" label="Peticiones"    tint="ter" variant="light"
          value={loading ? '…' : kpis?.total_petitions ?? 0} />
        <StatCard icon="payments"         label="Recaudado"       tint="sec" variant="light"
          value={loading ? '…' : kpis?.total_revenue != null ? `Q${Number(kpis.total_revenue).toFixed(0)}` : 'Q0'} />
        <StatCard icon="visibility"       label="Vistas blog"     tint="pri" variant="light"
          value={loading ? '…' : kpis?.total_blog_views ?? 0} />
        <StatCard icon="groups"           label="Rept. células"   tint="ter" variant="light"
          value={loading ? '…' : kpis?.total_cell_reports ?? 0} />
      </div>

      {/* Cell KPIs */}
      <SectionLabel icon="church">Almas ganadas</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard icon="person_add"       label="Convertidos"     tint="ter" variant="light"
          value={loading ? '…' : cellStats?.total_converts ?? 0}
          sub="Este período" />
        <StatCard icon="favorite_border"  label="Reconciliados"   tint="sec" variant="light"
          value={loading ? '…' : cellStats?.total_reconciled ?? 0}
          sub="Este período" />
        <StatCard icon="savings"          label="Ofrenda células" tint="pri" variant="light"
          value={loading ? '…' : cellStats?.total_offering != null ? `Q${Number(cellStats.total_offering).toFixed(0)}` : 'Q0'}
          sub="Total acumulado" />
      </div>

      {/* Últimas donaciones — tabla densa: se queda oscura por legibilidad
          (muchas filas de texto pequeño, el blanco compite más con la
          data que ayuda). Regla: glass-light es para fragmentos sin foto
          de fondo, no un mandato absoluto sobre tablas de datos densas. */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="payments" className="w-[18px] h-[18px] text-white/40" stroke={1.8} />
          <p className="text-[12.5px] text-white/40 font-semibold uppercase tracking-widest">Últimas donaciones</p>
        </div>
        <Button variant="tonal" size="sm" onClick={() => downloadCsv('/admin/export/donations', 'donaciones.csv')}>
          <Icon name="download" className="w-4 h-4" stroke={1.8} />
          Exportar CSV
        </Button>
      </div>
      <div className="liquid-glass rounded-[24px] overflow-hidden">
        {loading ? <Spinner /> : donations.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-white/40 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/6 flex items-center justify-center">
              <Icon name="payments" className="w-7 h-7" stroke={1.5} />
            </div>
            <p className="text-[13.5px]">No hay donaciones registradas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {['#', 'Nombre', 'Destino', 'Monto', 'Método', 'Fecha'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] text-white/40 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {donations.slice(0, 15).map(d => (
                  <tr key={d.ID} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5 text-[11.5px] text-white/40 font-mono">{d.ID}</td>
                    <td className="px-5 py-3.5 text-[13.5px] text-white font-medium">{d.name}</td>
                    <td className="px-5 py-3.5 text-[13.5px] text-white/50 capitalize">{d.donation_purpose || '—'}</td>
                    <td className="px-5 py-3.5 text-[13.5px] text-celeste-hov font-bold">{d.currency} {Number(d.amount).toFixed(2)}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-white/8 text-white/60 text-[12px] font-medium">
                        {METHOD_LABEL[d.payment_method] || d.payment_method || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[13.5px] text-white/50 whitespace-nowrap">
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
