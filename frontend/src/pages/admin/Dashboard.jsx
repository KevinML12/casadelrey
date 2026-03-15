import { useEffect, useState } from 'react';
import { Users, DollarSign, MessageSquare, TrendingUp } from 'lucide-react';
import apiClient from '../../lib/apiClient';

function StatCard({ icon: Icon, label, value, color = 'text-blue' }) {
  return (
    <div className="bg-card border border-line rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-ink-3 uppercase tracking-widest">{label}</p>
        <div className={`w-8 h-8 rounded-lg bg-current/5 flex items-center justify-center ${color}`}>
          <Icon size={15} />
        </div>
      </div>
      <p className="text-3xl font-black text-ink">{value ?? '—'}</p>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users}        label="Usuarios"     value={kpis?.total_users}     color="text-blue" />
        <StatCard icon={DollarSign}   label="Donaciones"   value={kpis?.total_donations}  color="text-gold" />
        <StatCard icon={MessageSquare}label="Peticiones"   value={kpis?.total_petitions}  color="text-ok" />
        <StatCard icon={TrendingUp}   label="Crecimiento"  value={kpis?.monthly_growth ? `+${kpis.monthly_growth}%` : '—'} color="text-info" />
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
                <tr className="border-b border-line bg-bg-2">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-3 uppercase tracking-widest">ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-3 uppercase tracking-widest">Nombre</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-3 uppercase tracking-widest">Monto</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-ink-3 uppercase tracking-widest">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {donations.slice(0, 10).map(d => (
                  <tr key={d.ID} className="hover:bg-bg transition-colors">
                    <td className="px-5 py-3 text-ink-3 font-mono text-xs">{d.ID?.slice(0, 8)}…</td>
                    <td className="px-5 py-3 text-ink font-medium">{d.Name}</td>
                    <td className="px-5 py-3 text-gold font-bold">Q{(d.Amount / 100).toFixed(2)}</td>
                    <td className="px-5 py-3 text-ink-3 text-xs">
                      {new Date(d.CreatedAt).toLocaleDateString('es-ES')}
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
