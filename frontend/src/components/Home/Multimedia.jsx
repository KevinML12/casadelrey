// src/components/Home/Multimedia.jsx
import React from 'react';
import { PlayCircleIcon } from '@heroicons/react/24/solid';
import { BookOpenIcon, MicrophoneIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';

const Multimedia = () => {
  const videos = [
    {
      id: 1,
      titulo: 'Mensaje Dominical - "Fe que Transforma"',
      thumbnail: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800',
      url: '#',
      fecha: '15 de Enero, 2024'
    },
    {
      id: 2,
      titulo: 'Alabanza y Adoración - Servicio Especial',
      thumbnail: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
      url: '#',
      fecha: '8 de Enero, 2024'
    },
    {
      id: 3,
      titulo: 'Testimonio - "Dios Restaura Vidas"',
      thumbnail: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800',
      url: '#',
      fecha: '1 de Enero, 2024'
    }
  ];

  const recursos = [
    {
      icon: BookOpenIcon,
      titulo: 'Devocionales',
      descripcion: 'Reflexiones diarias para fortalecer tu fe',
      color: 'blue'
    },
    {
      icon: MicrophoneIcon,
      titulo: 'Sermones',
      descripcion: 'Mensajes de esperanza y transformación',
      color: 'yellow'
    },
    {
      icon: MusicalNoteIcon,
      titulo: 'Música',
      descripcion: 'Alabanzas y canciones de adoración',
      color: 'purple'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <section id="multimedia" className="py-24 sm:py-32 bg-white dark:bg-gray-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-24">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-dark-text dark:text-white mb-6 tracking-tight transition-colors">
            Recursos Multimedia
          </h2>
          <p className="text-lg md:text-xl font-normal text-dark-text/70 dark:text-gray-400 max-w-4xl mx-auto transition-colors tracking-normal leading-relaxed">
            Mensajes, alabanzas y recursos para tu crecimiento espiritual
          </p>
        </div>

        {/* Videos Destacados */}
        <div className="mb-20">
          <h3 className="text-3xl font-display font-bold text-dark-text dark:text-white mb-12 tracking-tight transition-colors">Videos Recientes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((video) => (
              <a
                key={video.id}
                href={video.url}
                className="group block bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800/50 rounded-xl overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={video.thumbnail} 
                    alt={video.titulo}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all flex items-center justify-center">
                    <PlayCircleIcon className="w-16 h-16 text-white" />
                  </div>
                </div>
                <div className="p-6 border-t border-gray-200/50 dark:border-gray-800/50 transition-colors">
                  <p className="text-xs font-semibold text-dark-text/50 dark:text-gray-500 mb-2 uppercase tracking-widest transition-colors">{video.fecha}</p>
                  <h4 className="font-display font-bold text-dark-text dark:text-white text-base mb-2 line-clamp-2 tracking-tight transition-colors">
                    {video.titulo}
                  </h4>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Recursos Adicionales */}
        <div>
          <h3 className="text-3xl font-display font-bold text-dark-text dark:text-white mb-10 text-center tracking-tight transition-colors">Más Recursos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recursos.map((recurso, index) => {
              const Icon = recurso.icon;
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800/50 rounded-xl p-10 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 text-center group cursor-pointer"
                >
                  <div className="inline-flex p-4 bg-accent-blue/10 dark:bg-accent-blue/20 rounded-lg mb-6 transition-all group-hover:bg-accent-blue/20">
                    <Icon className="w-8 h-8 text-accent-blue" />
                  </div>
                  <h4 className="text-xl font-display font-bold text-dark-text dark:text-white mb-3 tracking-tight transition-colors">
                    {recurso.titulo}
                  </h4>
                  <p className="text-sm font-normal text-dark-text/70 dark:text-gray-400 transition-colors">
                    {recurso.descripcion}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center">
          <a
            href="#"
            className="inline-flex items-center gap-4 bg-accent-blue text-white px-10 py-3 font-semibold hover:bg-blue-700 transition-all duration-300 rounded-lg text-xs uppercase tracking-widest"
          >
            Ver Todos los Videos
          </a>
        </div>
      </div>
    </section>
  );
};

export default Multimedia;
