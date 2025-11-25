// frontend/src/components/Home/FaithDeclaration.jsx
import React from 'react';
import { CheckBadgeIcon } from '@heroicons/react/24/outline';

const FaithDeclaration = () => {
  const beliefs = [
    "Jesús es el centro de nuestra fe y vida.",
    "La Biblia es la Palabra de Dios inspirada e infalible.",
    "El Espíritu Santo nos guía y nos da poder para vivir en santidad.",
    "La Iglesia es la comunidad de creyentes llamada a la Gran Comisión."
  ];

  return (
    <section className="py-24 sm:py-32 bg-white dark:bg-gray-950 transition-colors border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-6xl sm:text-7xl lg:text-8xl font-display font-bold text-dark-text dark:text-white text-center mb-20 tracking-tight transition-colors">
          Lo que Creemos
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-white dark:bg-gray-800 p-10 rounded-xl border border-gray-200/50 dark:border-gray-700/50 transition-colors">
            <h3 className="text-3xl font-display font-bold text-dark-text dark:text-white mb-6 transition-colors">
              Declaración de Fe
            </h3>
            <p className="text-dark-text/70 dark:text-gray-300 text-lg font-normal leading-relaxed transition-colors">
              Nuestra fe se basa en principios bíblicos inamovibles que nos dan dirección y propósito. Creemos en un Dios vivo, activo y presente en nuestras vidas.
            </p>
          </div>
          
          <ul className="space-y-4">
            {beliefs.map((belief, index) => (
              <li key={index} className="flex items-start gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:border-accent-blue/50 dark:hover:border-accent-blue/50 transition-all">
                <CheckBadgeIcon className="flex-shrink-0 w-6 h-6 text-accent-blue mt-0.5" />
                <span className="text-dark-text/70 dark:text-gray-300 font-normal text-base transition-colors">{belief}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default FaithDeclaration;
