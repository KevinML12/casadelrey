import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../lib/apiClient';
import { Plus, Edit, Trash2, Calendar, MapPin } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import {default as Input} from '../../components/ui/Input';


const EventForm = ({ event, onSave, onCancel }) => {
    const [title, setTitle] = useState(event?.title || '');
    const [date, setDate] = useState(event?.date ? new Date(event.date).toISOString().substring(0, 10) : '');
    const [location, setLocation] = useState(event?.location || '');
    const [description, setDescription] = useState(event?.description || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...event, title, date, location, description });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-dark-card-bg p-6 rounded-2xl shadow-soft-lg">
            <h2 className="text-2xl font-black text-text-primary dark:text-dark-text-primary">
                {event ? 'Editar' : 'Crear'} Evento
            </h2>
            <Input label="Título del Evento" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Input label="Fecha" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            <Input label="Ubicación" type="text" value={location} onChange={(e) => setLocation(e.target.value)} required />
            <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full mt-1 p-2 border rounded-lg dark:bg-dark-bg dark:border-dark-border-color" rows="4"></textarea>
            </div>
            <div className="flex justify-end gap-4">
                <Button type="button" variant="ghost" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" variant="primary">
                    Guardar Evento
                </Button>
            </div>
        </form>
    );
};


export default function AdminEvents() {
    const [events, setEvents] = useState([]);
    const [editingEvent, setEditingEvent] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/events');
            setEvents(response.data || []);
        } catch (error) {
            toast.error("Error al cargar los eventos.");
            console.error("Error fetching events", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);
    
    const handleSave = async (eventData) => {
        try {
            if (eventData.id) {
                // TODO: Backend no tiene endpoint para actualizar eventos (PUT /api/admin/events/:id)
                toast.error('La funcionalidad de editar aún no está implementada en el backend.');
                // await apiClient.put(`/admin/events/${eventData.id}`, eventData);
            } else {
                await apiClient.post('/admin/events', eventData);
                toast.success('¡Evento creado exitosamente!');
            }
            setShowForm(false);
            setEditingEvent(null);
            fetchEvents();
        } catch (error) {
            toast.error('Error al guardar el evento.');
            console.error("Error saving event", error);
        }
    };

    const handleEdit = (event) => {
        // setEditingEvent(event);
        // setShowForm(true);
        toast.error('La funcionalidad de editar aún no está implementada en el backend.');
    };
    
    const handleDelete = async (eventId) => {
        // TODO: Backend no tiene endpoint para eliminar eventos (DELETE /api/admin/events/:id)
        toast.error('La funcionalidad de eliminar aún no está implementada en el backend.');
        // if (window.confirm('¿Estás seguro de que quieres eliminar este evento?')) {
        //     try {
        //         await apiClient.delete(`/admin/events/${eventId}`);
        //         fetchEvents();
        //     } catch (error) {
        //         console.error("Error deleting event", error);
        //     }
        // }
    };

    return (
        <div className="min-h-screen bg-bg-light dark:bg-dark-bg py-12">
            <div className="container mx-auto px-6">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-black text-text-primary dark:text-dark-text-primary">Administrar Eventos</h1>
                    <Button onClick={() => { setEditingEvent(null); setShowForm(true); }} variant="primary">
                        <Plus size={20} className="mr-2" />
                        Crear Evento
                    </Button>
                </div>

                {showForm && (
                    <div className="mb-8">
                        <EventForm 
                            event={editingEvent} 
                            onSave={handleSave}
                            onCancel={() => { setShowForm(false); setEditingEvent(null); }}
                        />
                    </div>
                )}

                <Card>
                    <h2 className="text-2xl font-black text-text-primary dark:text-dark-text-primary mb-6">Eventos Programados</h2>
                    {loading ? (
                        <p>Cargando eventos...</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {events.length > 0 ? events.map(event => (
                                <div key={event.id} className="bg-white dark:bg-dark-bg p-4 rounded-lg shadow-soft-sm border border-border-light dark:border-dark-border">
                                    <h3 className="font-bold text-lg">{event.title}</h3>
                                    <div className="text-sm text-text-muted dark:text-dark-text-muted space-y-1 mt-2">
                                        <p className="flex items-center gap-2"><Calendar size={14} /> {new Date(event.date).toLocaleDateString('es-ES', { dateStyle: 'full' })}</p>
                                        <p className="flex items-center gap-2"><MapPin size={14} /> {event.location}</p>
                                    </div>
                                    <p className="text-sm mt-2">{event.description}</p>
                                    <div className="flex justify-end gap-2 mt-4">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(event)}>
                                            <Edit size={16} />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(event.id)}>
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            )) : <p>No hay eventos programados.</p>}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
