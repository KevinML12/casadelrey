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
    <section id="multimedia" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Recursos Multimedia
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Mensajes, alabanzas y recursos para tu crecimiento espiritual
          </p>
        </div>

        {/* Videos Destacados */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Videos Recientes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <a
                key={video.id}
                href={video.url}
                className="group block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition duration-300"
              >
                <div className="relative">
                  <img 
                    src={video.thumbnail} 
                    alt={video.titulo}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition flex items-center justify-center">
                    <PlayCircleIcon className="w-16 h-16 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition" />
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition">
                    {video.titulo}
                  </h4>
                  <p className="text-sm text-gray-600">{video.fecha}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Recursos Adicionales */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Más Recursos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recursos.map((recurso, index) => {
              const Icon = recurso.icon;
              return (
                <div
                  key={index}
                  className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition duration-300 text-center group cursor-pointer"
                >
                  <div className={`inline-flex p-4 rounded-full ${colorClasses[recurso.color]} mb-4 group-hover:scale-110 transition`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    {recurso.titulo}
                  </h4>
                  <p className="text-gray-600">
                    {recurso.descripcion}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <a
            href="#"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
          >
            Ver Todos los Videos
          </a>
        </div>
      </div>
    </section>
  );
};

export default Multimedia;
