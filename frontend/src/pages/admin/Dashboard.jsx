import React, { useState, useEffect } from 'react';
import { Users, BarChart, DollarSign, Mail, AlertTriangle } from 'lucide-react';
import apiClient from '../../lib/apiClient';

const StatCard = ({ icon, title, value, change, changeType }) => (
    <div className="bg-white dark:bg-dark-card-bg p-6 rounded-2xl shadow-soft-lg">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-text-muted dark:text-dark-text-muted">{title}</p>
                <p className="text-3xl font-black text-text-primary dark:text-dark-text-primary">{value}</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
                {icon}
            </div>
        </div>
        {change && (
            <p className={`text-sm mt-2 ${changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
                {change}
            </p>
        )}
    </div>
);

const DonationRow = ({ donation }) => (
    <tr className="border-b border-border-light dark:border-dark-border">
        <td className="py-4 px-6">{donation.ID}</td>
        <td className="py-4 px-6">{donation.Name}</td>
        <td className="py-4 px-6">${(donation.Amount / 100).toFixed(2)}</td>
        <td className="py-4 px-6">{new Date(donation.CreatedAt).toLocaleDateString()}</td>
    </tr>
);


export default function Dashboard() {
    const [kpis, setKpis] = useState(null);
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [kpisResponse, donationsResponse] = await Promise.all([
                    apiClient.get('/admin/kpis'),
                    apiClient.get('/admin/donations')
                ]);
                setKpis(kpisResponse.data);
                setDonations(donationsResponse.data);
            } catch (err) {
                console.error("Error fetching dashboard data", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-light dark:bg-dark-bg py-12 flex items-center justify-center">
                <p className="text-text-primary dark:text-dark-text-primary">Cargando dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-bg-light dark:bg-dark-bg py-12 flex items-center justify-center">
                <div className="text-center p-8 bg-white dark:bg-dark-card-bg rounded-2xl shadow-soft-lg max-w-lg mx-auto">
                    <AlertTriangle className="mx-auto h-12 w-12 text-error" />
                    <h2 className="mt-4 text-2xl font-black text-text-primary dark:text-dark-text-primary">Error al Cargar el Dashboard</h2>
                    <p className="mt-2 text-text-secondary dark:text-dark-text-secondary">
                        No se pudieron obtener los datos del servidor. Por favor, inténtelo de nuevo más tarde.
                    </p>
                    <p className="mt-4 text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-error font-mono">
                        {error.message || 'Ocurrió un error desconocido.'}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-bg-light dark:bg-dark-bg py-12">
            <div className="container mx-auto px-6">
                <h1 className="text-4xl font-black text-text-primary dark:text-dark-text-primary mb-8">Dashboard de Administración</h1>
                
                {kpis && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                      <StatCard icon={<Users className="text-primary" />} title="Total de Usuarios" value={kpis.total_users} change={kpis.monthly_growth} changeType="increase" />
                      <StatCard icon={<DollarSign className="text-primary" />} title="Donaciones Totales" value={kpis.total_donations} />
                      <StatCard icon={<Mail className="text-primary" />} title="Peticiones Totales" value={kpis.total_petitions} />
                      <StatCard icon={<BarChart className="text-primary" />} title="Crecimiento Mensual" value={kpis.monthly_growth} />
                  </div>
                )}

                <div className="bg-white dark:bg-dark-card-bg p-8 rounded-2xl shadow-soft-lg">
                    <h2 className="text-2xl font-black text-text-primary dark:text-dark-text-primary mb-6">Donaciones Recientes</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-text-secondary dark:text-dark-text-secondary">
                            <thead className="text-xs uppercase bg-bg-light dark:bg-dark-bg">
                                <tr>
                                    <th className="py-3 px-6">ID</th>
                                    <th className="py-3 px-6">Nombre</th>
                                    <th className="py-3 px-6">Monto</th>
                                    <th className="py-3 px-6">Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {donations && donations.length > 0 ? (
                                    donations.slice(0, 5).map(donation => (
                                        <DonationRow key={donation.ID} donation={donation} />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-8 text-text-muted dark:text-dark-text-muted">
                                            No hay donaciones recientes.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
