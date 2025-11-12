// frontend/src/components/Home/HeroBanner.jsx
import React from 'react';

const HeroBanner = () => {
  return (
    <section 
      className="relative h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-900"
    >
      {/* Overlay Oscuro para asegurar legibilidad del texto */}
      <div className="absolute inset-0 bg-blue-900/60"></div>
      
      <div className="relative text-center p-6 max-w-4xl mx-auto z-10">
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white leading-tight mb-4">
          <span className="text-yellow-400">Tu</span> Casa. Tu Familia.
        </h1>
        <p className="text-xl sm:text-2xl text-gray-200 mb-8">
          Un lugar donde la fe se vive con pasión, propósito y comunidad.
        </p>
        <button 
          className="px-8 py-3 text-lg font-bold rounded-full bg-yellow-400 text-gray-900 shadow-xl 
                     hover:bg-yellow-300 transition duration-300 transform hover:scale-105"
        >
          ¡Únete a un Grupo Pequeño Hoy!
        </button>
      </div>
    </section>
  );
};

export default HeroBanner;
