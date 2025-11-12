// src/components/Home/Galeria.jsx
import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Galeria = () => {
  const [selectedImage, setSelectedImage] = useState(null);

  const imagenes = [
    {
      id: 1,
      url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800',
      titulo: 'Servicio Dominical'
    },
    {
      id: 2,
      url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
      titulo: 'Alabanza y Adoración'
    },
    {
      id: 3,
      url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800',
      titulo: 'Ministerio de Jóvenes'
    },
    {
      id: 4,
      url: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800',
      titulo: 'Grupo de Niños'
    },
    {
      id: 5,
      url: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800',
      titulo: 'Reunión de Oración'
    },
    {
      id: 6,
      url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
      titulo: 'Eventos Especiales'
    }
  ];

  return (
    <section id="galeria" className="py-16 sm:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Nuestra Galería
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Momentos especiales de nuestra comunidad
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {imagenes.map((imagen) => (
            <div 
              key={imagen.id}
              className="relative group cursor-pointer overflow-hidden rounded-xl shadow-md hover:shadow-2xl transition duration-300"
              onClick={() => setSelectedImage(imagen)}
            >
              <img 
                src={imagen.url} 
                alt={imagen.titulo}
                className="w-full h-64 object-cover transform group-hover:scale-110 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end">
                <p className="text-white font-semibold text-lg p-4">
                  {imagen.titulo}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para imagen ampliada */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setSelectedImage(null)}
          >
            <XMarkIcon className="w-8 h-8" />
          </button>
          <div className="max-w-4xl max-h-full">
            <img 
              src={selectedImage.url} 
              alt={selectedImage.titulo}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <p className="text-white text-center text-xl mt-4 font-semibold">
              {selectedImage.titulo}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default Galeria;
