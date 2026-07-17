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

      {/* General KPIs — agrupados en UNA card contenedora grande, las
          StatCard blancas flotan encima */}
      <SectionContainer icon="bar_chart" label="General">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
      </SectionContainer>

      {/* Cell KPIs */}
      <SectionContainer icon="church" label="Almas ganadas">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    <td className="px-5 py-3.5 text-[13.5px] text-celeste font-bold">{d.currency} {Number(d.amount).toFixed(2)}</td>
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
