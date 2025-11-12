// src/components/admin/GroupCard.jsx
import React from 'react';

const GroupCard = ({ title, description, imageUrl, link }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition duration-300 hover:shadow-xl hover:scale-[1.02] border border-gray-100">
      {/* Imagen (Placeholder) */}
      <img 
        className="w-full h-48 object-cover" 
        src={imageUrl || 'https://via.placeholder.com/600x400?text=Ministerio'} 
        alt={`Imagen de ${title}`}
      />
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {description}
        </p>
        
        <a 
          href={link || '#'} 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold transition duration-150"
        >
          Ver Detalles
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </a>
      </div>
    </div>
  );
};

export default GroupCard;
