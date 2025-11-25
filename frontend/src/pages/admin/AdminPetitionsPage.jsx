import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { EnvelopeIcon, CheckCircleIcon, PhoneIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/Table-shadcn';

const fetchPetitions = async () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const response = await fetch(`${apiUrl}/api/admin/petitions`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    throw new Error('Error al cargar las peticiones');
  }

  return response.json();
};

const AdminPetitionsPage = () => {
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const queryClient = useQueryClient();

  const { data: petitions = [], isLoading, isError, error } = useQuery({
    queryKey: ['admin-petitions'],
    queryFn: fetchPetitions
  });

  // useMutation para marcar como leído
  const markAsReadMutation = useMutation({
    mutationFn: async (id) => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/admin/petitions/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al marcar como leído');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Petición marcada como leída');
      queryClient.invalidateQueries({ queryKey: ['admin-petitions'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Error al marcar como leído');
    }
  });

  const handleMarkAsRead = (id) => {
    markAsReadMutation.mutate(id);
  };

  const getFilteredPetitions = () => {
    if (filter === 'unread') {
      return petitions.filter(p => !p.is_read);
    } else if (filter === 'read') {
      return petitions.filter(p => p.is_read);
    }
    return petitions;
  };

  const getTypeBadge = (isPrayer) => {
    if (isPrayer) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <ChatBubbleLeftIcon className="w-4 h-4" />
          Oración
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <EnvelopeIcon className="w-4 h-4" />
        Contacto
      </span>
    );
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-8"></div>
          <div className="bg-white rounded-lg shadow">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border-b border-gray-200 p-4">
                <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Error: {error?.message}
          </div>
        </div>
      </div>
    );
  }

  const filteredPetitions = getFilteredPetitions();
  const unreadCount = petitions.filter(p => !p.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <EnvelopeIcon className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-display font-bold text-dark-text dark:text-white">Peticiones de Contacto y Oración</h1>
            </div>
            {unreadCount > 0 && (
              <span className="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                {unreadCount} sin leer
              </span>
            )}
          </div>

          {/* Filtros */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Todas ({petitions.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Sin leer ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'read'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Leídas ({petitions.length - unreadCount})
            </button>
          </div>
        </motion.div>

        {/* Tabla de Peticiones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow overflow-hidden"
        >
          {filteredPetitions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <EnvelopeIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No hay peticiones disponibles</p>
              <p className="text-sm mt-2">
                {filter === 'unread' && 'No hay peticiones sin leer'}
                {filter === 'read' && 'No hay peticiones leídas'}
                {filter === 'all' && 'No se han recibido peticiones aún'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estado</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email / Teléfono</TableHead>
                    <TableHead>Mensaje</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPetitions.map((petition) => (
                    <TableRow 
                      key={petition.id}
                      className={!petition.is_read ? 'bg-blue-50' : ''}
                    >
                      <TableCell>
                        {petition.is_read ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-500" title="Leído" />
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-blue-600" title="Sin leer"></div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{petition.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <EnvelopeIcon className="w-4 h-4 text-muted-foreground" />
                          {petition.email}
                        </div>
                        {petition.phone && (
                          <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                            <PhoneIcon className="w-4 h-4" />
                            {petition.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md line-clamp-2">
                          {petition.message}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(petition.is_prayer)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(petition.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        {!petition.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(petition.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                            title="Marcar como leído"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                            Marcar leído
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>

        {/* Estadísticas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Peticiones</p>
                <p className="text-3xl font-bold text-gray-900">{petitions.length}</p>
              </div>
              <EnvelopeIcon className="w-12 h-12 text-blue-600 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Peticiones de Oración</p>
                <p className="text-3xl font-bold text-purple-600">
                  {petitions.filter(p => p.is_prayer).length}
                </p>
              </div>
              <ChatBubbleLeftIcon className="w-12 h-12 text-purple-600 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sin Leer</p>
                <p className="text-3xl font-bold text-red-600">{unreadCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-red-600">{unreadCount}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPetitionsPage;
