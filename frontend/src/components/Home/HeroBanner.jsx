// frontend/src/components/Home/HeroBanner.jsx
import React from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const HeroBanner = () => {
  return (
    <section 
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1920&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay sutil para contraste */}
      <div className="absolute inset-0 bg-dark-text/40 dark:bg-dark-text/60 transition-colors"></div>
      
      {/* Contenido */}
      <div className="relative text-center px-6 max-w-7xl mx-auto z-10">
        {/* Título con tipografía ultra audaz */}
        <h1 className="text-7xl sm:text-8xl md:text-9xl lg:text-[12rem] font-display font-bold text-white leading-[0.8] mb-16 tracking-tight uppercase">
          BIENVENIDOS A<br/>
          CASA DEL REY
        </h1>
        
        {/* Subtítulo con peso audaz */}
        <p className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-20 max-w-5xl mx-auto tracking-tight uppercase">
          Un lugar donde la fe transforma vidas
        </p>
        
        {/* Botones estilo Rivian - Minimalista y elegante */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <button 
            className="group px-10 py-3 text-sm font-semibold bg-white text-dark-text 
                       hover:bg-gray-50 transition-all duration-300 uppercase tracking-widest
                       flex items-center gap-3 rounded-lg shadow-lg hover:shadow-xl"
          >
            <span>Nuestra Historia</span>
            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button 
            className="group px-10 py-3 text-sm font-semibold text-white border border-white/60
                       hover:bg-white/10 transition-all duration-300 uppercase tracking-widest
                       flex items-center gap-3 rounded-lg"
          >
            <span>Próximos Eventos</span>
            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
      
      {/* Indicador de scroll */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/60 rounded-full flex justify-center pt-2">
          <div className="w-1 h-3 bg-white/60 rounded-full"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
