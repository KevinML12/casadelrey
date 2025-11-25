import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  CurrencyDollarIcon, 
  UsersIcon, 
  CalendarIcon, 
  UserGroupIcon 
} from '@heroicons/react/24/outline';
import StatCard from '../../components/admin/StatCard';
import SkeletonCard from '../../components/admin/SkeletonCard';

const fetchDashboardData = async () => {
  // Simular llamada a API
  // const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  // const response = await fetch(`${apiUrl}/api/admin/kpis`, {
  //   headers: {
  //     'Authorization': `Bearer ${localStorage.getItem('token')}`
  //   }
  // });
  // if (!response.ok) throw new Error('Error al cargar los KPIs');
  // return response.json();
  
  // Datos simulados
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const mockKpis = {
    donations: { value: '$3,210.00', icon: CurrencyDollarIcon },
    members: { value: '152', icon: UsersIcon },
    events: { value: '24', icon: CalendarIcon },
    groups: { value: '8', icon: UserGroupIcon }
  };

  const mockMonthlyData = [
    { mes: 'Ene', donaciones: 2400, miembros: 140 },
    { mes: 'Feb', donaciones: 1398, miembros: 145 },
    { mes: 'Mar', donaciones: 3800, miembros: 148 },
    { mes: 'Abr', donaciones: 3908, miembros: 150 },
    { mes: 'May', donaciones: 4800, miembros: 152 },
    { mes: 'Jun', donaciones: 3800, miembros: 155 },
  ];

  const mockDonationsData = [
    { mes: 'Ene', monto: 2400 },
    { mes: 'Feb', monto: 1398 },
    { mes: 'Mar', monto: 3800 },
    { mes: 'Abr', monto: 3908 },
    { mes: 'May', monto: 4800 },
    { mes: 'Jun', monto: 3800 },
  ];

  return {
    kpis: mockKpis,
    charts: {
      monthly: mockMonthlyData,
      donations: mockDonationsData
    }
  };
};

const DashboardPage = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: fetchDashboardData
  });

  const kpisData = data?.kpis;
  const chartData = data?.charts;

  return (
    <div>
      <h1 className="text-5xl font-display font-bold text-dark-text dark:text-white mb-12 tracking-tight transition-colors">
        Dashboard
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <StatCard 
                title="Donaciones Recibidas" 
                value={kpisData?.donations.value}
                icon={kpisData?.donations.icon}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <StatCard 
                title="Miembros Activos" 
                value={kpisData?.members.value}
                icon={kpisData?.members.icon}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <StatCard 
                title="Eventos Realizados" 
                value={kpisData?.events.value}
                icon={kpisData?.events.icon}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <StatCard 
                title="Grupos Activos" 
                value={kpisData?.groups.value}
                icon={kpisData?.groups.icon}
              />
            </motion.div>
          </>
        )}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Líneas - Crecimiento Mensual */}
        <motion.div 
          className="bg-white p-6 rounded-lg shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Crecimiento de Miembros
          </h2>
          {isLoading ? (
            <div className="h-[300px] bg-gray-100 animate-pulse rounded"></div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData?.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="miembros" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Miembros"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Gráfico de Barras - Donaciones Mensuales */}
        <motion.div 
          className="bg-white p-6 rounded-lg shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Donaciones Mensuales
          </h2>
          {isLoading ? (
            <div className="h-[300px] bg-gray-100 animate-pulse rounded"></div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData?.donations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="monto" 
                  fill="#10B981" 
                  name="Monto ($)"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;