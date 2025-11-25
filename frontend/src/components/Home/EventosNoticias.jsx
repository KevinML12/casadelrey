// src/components/Home/EventosNoticias.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon, ClockIcon, MapPinIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

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
    <section id="eventos" className="py-24 sm:py-32 bg-white dark:bg-gray-950 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-6xl sm:text-7xl lg:text-8xl font-display font-bold text-dark-text dark:text-white mb-4 tracking-tight transition-colors">
            PRÓXIMOS EVENTOS
          </h2>
          <p className="text-xl text-dark-text/60 dark:text-gray-400 max-w-3xl mx-auto transition-colors font-normal">
            Descubre las actividades que tenemos preparadas para ti
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {eventos.map((evento) => (
            <div 
              key={evento.id} 
              className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200/50 dark:border-gray-800/50 hover:border-accent-blue/50 dark:hover:border-accent-blue/50 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
            >
              <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img 
                  src={evento.imagen} 
                  alt={evento.titulo}
                  className="w-full h-full object-cover transform hover:scale-110 transition duration-500"
                />
                <div className="absolute top-4 right-4 bg-accent-blue text-white px-4 py-2 rounded text-xs font-black uppercase tracking-wide">
                  Próximo
                </div>
              </div>
              
              <div className="p-8">
                <h3 className="text-2xl font-display font-bold text-dark-text dark:text-white mb-4 tracking-tight transition-colors">
                  {evento.titulo}
                </h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-start text-sm font-normal text-dark-text/70 dark:text-gray-400 transition-colors gap-3">
                    <CalendarIcon className="w-5 h-5 flex-shrink-0 text-accent-blue mt-0.5" />
                    <span>{evento.fecha}</span>
                  </div>
                  <div className="flex items-start text-sm font-normal text-dark-text/70 dark:text-gray-400 transition-colors gap-3">
                    <ClockIcon className="w-5 h-5 flex-shrink-0 text-accent-blue mt-0.5" />
                    <span>{evento.hora}</span>
                  </div>
                  <div className="flex items-start text-sm font-normal text-dark-text/70 dark:text-gray-400 transition-colors gap-3">
                    <MapPinIcon className="w-5 h-5 flex-shrink-0 text-accent-blue mt-0.5" />
                    <span>{evento.lugar}</span>
                  </div>
                </div>
                
                <p className="text-sm font-normal text-dark-text/70 dark:text-gray-400 mb-6 transition-colors leading-relaxed">
                  {evento.descripcion}
                </p>
                
                <button className="w-full bg-accent-blue text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold text-xs uppercase tracking-widest">
                  Ver Más
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Botón Ver Calendario Completo */}
        <div className="text-center">
          <Link
            to="/eventos"
            className="inline-flex items-center gap-3 bg-accent-blue text-white font-black py-5 px-10 rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 uppercase text-sm tracking-wide"
          >
            <CalendarIcon className="w-6 h-6" />
            <span>Ver Todos los Eventos</span>
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default EventosNoticias;
