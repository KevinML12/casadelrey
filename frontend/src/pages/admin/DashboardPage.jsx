import StatCard from '../../components/admin/StatCard';

const DashboardPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Resumen de KPIs
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Donaciones Recibidas" value="$3,210.00" />
        <StatCard title="Miembros Activos" value="152" />
        <StatCard title="Eventos Realizados" value="24" />
        <StatCard title="Grupos Activos" value="8" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg min-h-[300px]">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pagos Mensuales</h2>
          <p className="text-gray-500">Aquí va el gráfico</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg min-h-[300px]">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Crecimiento de Miembros</h2>
          <p className="text-gray-500">Aquí va el gráfico</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;