import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';

function StatCard({ icon, label, value, tint = 'pri' }) {
  const tintMap = {
    pri: 'bg-pri-con text-on-pri-con',
    ter: 'bg-ter-con text-on-ter-con',
    sec: 'bg-sec-con text-on-sec-con',
    err: 'bg-err-con text-on-err-con',
  };
  return (
    <div className="bg-surf-low border border-outline-var rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-label-s text-on-surf-var uppercase tracking-widest">{label}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tintMap[tint] || tintMap.pri}`}>
          <span className="ms" style={{ fontSize: 18 }}>{icon}</span>
        </div>
      </div>
      <p className="text-headline-m text-on-surf font-black">{value ?? '—'}</p>
    </div>
  );
}

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-6 h-6 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
  </div>
);

export default function Dashboard() {
  const [kpis,      setKpis]      = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get('/admin/kpis').then(r => setKpis(r.data)),
      apiClient.get('/admin/donations').then(r => setDonations(r.data || [])),
    ]).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-headline-s text-on-surf font-black mb-6">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard icon="person" label="Usuarios" tint="pri"
          value={loading ? '…' : kpis?.total_users ?? 0} />
        <StatCard icon="favorite" label="Donaciones" tint="err"
          value={loading ? '…' : kpis?.total_donations ?? 0} />
        <StatCard icon="volunteer_activism" label="Peticiones" tint="ter"
          value={loading ? '…' : kpis?.total_petitions ?? 0} />
        <StatCard icon="payments" label="Recaudado" tint="sec"
          value={loading ? '…' : kpis?.total_revenue != null ? `Q${Number(kpis.total_revenue).toFixed(0)}` : 'Q0'} />
        <StatCard icon="visibility" label="Vistas blog" tint="pri"
          value={loading ? '…' : kpis?.total_blog_views ?? 0} />
        <StatCard icon="groups" label="Reportes células" tint="ter"
          value={loading ? '…' : kpis?.total_cell_reports ?? 0} />
      </div>

      {/* Tabla donaciones */}
      <div className="bg-surf-low border border-outline-var rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-var">
          <h2 className="text-title-s text-on-surf font-semibold">Últimas Donaciones</h2>
        </div>
        {loading ? <Spinner /> : donations.length === 0 ? (
          <div className="text-center py-12 text-on-surf-var text-body-s">No hay donaciones registradas.</div>
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
                    <td className="px-5 py-3 text-label-s text-on-surf-var font-mono">{d.ID}</td>
                    <td className="px-5 py-3 text-body-s text-on-surf font-medium">{d.name}</td>
                    <td className="px-5 py-3 text-body-s text-on-surf-var capitalize">{d.donation_purpose || '—'}</td>
                    <td className="px-5 py-3 text-body-s text-ter font-bold">{d.currency} {Number(d.amount).toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-label-s font-medium bg-surf-high text-on-surf-var">
                        {d.payment_method === 'transferencia' ? 'Transferencia' : d.payment_method === 'tigo_money' ? 'Tigo Money' : d.payment_method === 'presencial' ? 'En persona' : d.payment_method || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-body-s text-on-surf-var">
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
