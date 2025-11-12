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
    <section className="py-16 sm:py-24 bg-blue-600">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
          Lo que Creemos
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-400">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Declaración de Fe
            </h3>
            <p className="text-gray-600 mb-6">
              Nuestra fe se basa en principios bíblicos inamovibles que nos dan dirección y propósito. Creemos en un Dios vivo y activo.
            </p>
          </div>
          
          <ul className="space-y-4">
            {beliefs.map((belief, index) => (
              <li key={index} className="flex items-start space-x-3 p-4 bg-blue-700 rounded-lg shadow-md hover:bg-blue-800 transition">
                <CheckBadgeIcon className="flex-shrink-0 w-6 h-6 text-yellow-400 mt-1" />
                <span className="text-white font-medium">{belief}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default FaithDeclaration;
