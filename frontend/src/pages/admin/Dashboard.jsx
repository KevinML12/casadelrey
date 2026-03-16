import { useEffect, useState } from 'react';
import { Users, DollarSign, MessageSquare, Heart, Eye, BarChart3 } from 'lucide-react';
import apiClient from '../../lib/apiClient';

function StatCard({ icon: Icon, label, value, color = 'text-blue', sub }) {
  return (
    <div className="bg-card border border-line rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-ink-3 uppercase tracking-widest">{label}</p>
        <div className={`w-8 h-8 rounded-lg bg-current/5 flex items-center justify-center ${color}`}>
          <Icon size={15} />
        </div>
      </div>
      <p className="text-3xl font-black text-ink">{value ?? '—'}</p>
      {sub && <p className="text-xs text-ink-3 mt-1">{sub}</p>}
    </div>
  );
}

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
      <h1 className="text-2xl font-black text-ink mb-6">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <StatCard
          icon={Users} label="Usuarios" color="text-blue"
          value={loading ? '…' : kpis?.total_users ?? 0}
        />
        <StatCard
          icon={DollarSign} label="Donaciones" color="text-gold"
          value={loading ? '…' : kpis?.total_donations ?? 0}
          sub={kpis?.total_revenue != null ? `Q${Number(kpis.total_revenue).toFixed(2)} total` : undefined}
        />
        <StatCard
          icon={MessageSquare} label="Peticiones" color="text-ok"
          value={loading ? '…' : kpis?.total_petitions ?? 0}
        />
        <StatCard
          icon={Heart} label="Recaudado" color="text-error"
          value={loading ? '…' : kpis?.total_revenue != null ? `Q${Number(kpis.total_revenue).toFixed(0)}` : '0'}
        />
        <StatCard
          icon={Eye} label="Vistas blog" color="text-blue"
          value={loading ? '…' : kpis?.total_blog_views ?? 0}
        />
        <StatCard
          icon={BarChart3} label="Reportes células" color="text-ok"
          value={loading ? '…' : kpis?.total_cell_reports ?? 0}
        />
      </div>

      {/* Tabla donaciones */}
      <div className="bg-card border border-line rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-line">
          <h2 className="font-bold text-ink text-sm">Últimas Donaciones</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-line border-t-blue animate-spin" />
          </div>
        ) : donations.length === 0 ? (
          <div className="text-center py-12 text-ink-3 text-sm">No hay donaciones registradas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-bg">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-3 uppercase tracking-widest">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-3 uppercase tracking-widest">Nombre</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-3 uppercase tracking-widest">Destino</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-3 uppercase tracking-widest">Monto</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-3 uppercase tracking-widest">Método</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-3 uppercase tracking-widest">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {donations.slice(0, 15).map(d => (
                  <tr key={d.ID} className="hover:bg-bg transition-colors">
                    <td className="px-5 py-3 text-ink-3 font-mono text-xs">{d.ID}</td>
                    <td className="px-5 py-3 text-ink font-medium">{d.name}</td>
                    <td className="px-5 py-3 text-ink-3 text-xs capitalize">{d.donation_purpose || '—'}</td>
                    <td className="px-5 py-3 text-gold font-bold">{d.currency} {Number(d.amount).toFixed(2)}</td>
                    <td className="px-5 py-3 text-ink-3 text-xs">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${d.payment_method === 'paypal' ? 'bg-blue/10 text-blue' : 'bg-ink/10 text-ink-2'}`}>
                        {d.payment_method === 'paypal' ? 'PayPal' : d.payment_method === 'stripe' ? 'Tarjeta' : d.payment_method || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-3 text-xs">
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
