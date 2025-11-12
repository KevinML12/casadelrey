// src/components/Home/EventosNoticias.jsx
import React from 'react';
import { CalendarIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';

const EventosNoticias = () => {
  const eventos = [
    {
      id: 1,
      titulo: 'Conferencia Anual de Fe',
      fecha: '15 de Diciembre, 2025',
      hora: '10:00 AM - 6:00 PM',
      lugar: 'Auditorio Principal',
      descripcion: 'Únete a nosotros para un día de adoración, enseñanza y comunidad.',
      imagen: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
    },
    {
      id: 2,
      titulo: 'Retiro de Jóvenes',
      fecha: '20-22 de Diciembre, 2025',
      hora: 'Viernes 5:00 PM - Domingo 2:00 PM',
      lugar: 'Centro de Retiros Mountain View',
      descripcion: 'Un fin de semana para crecer en fe y amistad.',
      imagen: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800'
    },
    {
      id: 3,
      titulo: 'Cena Comunitaria',
      fecha: '10 de Enero, 2026',
      hora: '6:00 PM - 9:00 PM',
      lugar: 'Salón de Eventos',
      descripcion: 'Comparte una cena especial con tu familia de la iglesia.',
      imagen: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800'
    }
  ];

  return (
    <section id="eventos" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Próximos Eventos
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubre las actividades y eventos que tenemos preparados para ti y tu familia
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {eventos.map((evento) => (
            <div 
              key={evento.id} 
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition duration-300 border border-gray-100"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={evento.imagen} 
                  alt={evento.titulo}
                  className="w-full h-full object-cover transform hover:scale-110 transition duration-500"
                />
                <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  Próximo
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {evento.titulo}
                </h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-start text-sm text-gray-600">
                    <CalendarIcon className="w-5 h-5 mr-2 flex-shrink-0 text-blue-600" />
                    <span>{evento.fecha}</span>
                  </div>
                  <div className="flex items-start text-sm text-gray-600">
                    <ClockIcon className="w-5 h-5 mr-2 flex-shrink-0 text-blue-600" />
                    <span>{evento.hora}</span>
                  </div>
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPinIcon className="w-5 h-5 mr-2 flex-shrink-0 text-blue-600" />
                    <span>{evento.lugar}</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  {evento.descripcion}
                </p>
                
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-150 font-medium">
                  Más Información
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EventosNoticias;
