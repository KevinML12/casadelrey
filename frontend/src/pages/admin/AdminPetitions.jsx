import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../lib/apiClient';
import { Eye, Trash2, Mail, User, Phone } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function AdminPetitions() {
    const [petitions, setPetitions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPetitions = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/admin/petitions');
            setPetitions(response.data || []);
        } catch (error) {
            toast.error("Error al cargar las peticiones.");
            console.error("Error fetching petitions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPetitions();
    }, []);
    
    const handleMarkAsRead = async (petitionId) => {
        try {
            await apiClient.put(`/admin/petitions/${petitionId}/read`);
            toast.success('Petición marcada como leída.');
            fetchPetitions(); // Refresh the list
        } catch (error) {
            toast.error('Error al marcar como leída.');
            console.error("Error marking petition as read", error);
        }
    };
    
    const handleDelete = async (petitionId) => {
        // TODO: Backend no tiene endpoint para eliminar peticiones (DELETE /api/admin/petitions/:id)
        toast.error('La funcionalidad de eliminar aún no está implementada en el backend.');
    };

    if (loading) {
        return (
          <div className="min-h-screen bg-bg-light dark:bg-dark-bg flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-light dark:bg-dark-bg py-12">
            <div className="container mx-auto px-6">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-black text-text-primary dark:text-dark-text-primary">Administrar Peticiones de Oración</h1>
                </div>

                <Card>
                    <div className="space-y-6">
                        {petitions.length > 0 ? petitions.map(petition => (
                            <div key={petition.ID} className={`p-4 rounded-lg shadow-soft-sm border ${petition.read ? 'bg-gray-50 dark:bg-dark-bg' : 'bg-white dark:bg-dark-card-bg border-primary'}`}>
                                <div className={`transition-opacity ${petition.read ? 'opacity-60' : 'opacity-100'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-mono text-xs text-text-muted dark:text-dark-text-muted">ID: {petition.ID}</p>
                                            <p className="mt-4 text-base text-text-primary dark:text-dark-text-primary">{petition.request}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {!petition.read && (
                                                <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(petition.ID)} title="Marcar como leída">
                                                    <Eye size={16} />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(petition.ID)} title="Eliminar">
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="border-t dark:border-dark-border my-3"></div>
                                    <div className="text-sm text-text-muted dark:text-dark-text-muted flex flex-wrap items-center gap-x-4 gap-y-1">
                                        <span className="flex items-center gap-2"><User size={14} /> {petition.name}</span>
                                        <span className="flex items-center gap-2"><Mail size={14} /> {petition.email}</span>
                                        {petition.phone && <span className="flex items-center gap-2"><Phone size={14} /> {petition.phone}</span>}
                                        <span className="flex items-center gap-2"><Calendar size={14} /> {new Date(petition.CreatedAt).toLocaleString('es-ES')}</span>
                                    </div>
                                </div>
                            </div>
                        )) : <p className="text-center text-text-muted dark:text-dark-text-muted py-8">No hay peticiones de oración.</p>}
                    </div>
                </Card>
            </div>
        </div>
    );
}
