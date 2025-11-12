// src/pages/admin/MyGroupsPage.jsx
import React from 'react';
import GroupCard from '../../components/admin/GroupCard'; 

// Datos de ejemplo para los ministerios
const groups = [
  { 
    title: 'Ministerio de Alabanza', 
    description: 'Participa en los ensayos y servicios de música. Horario: Martes 7 PM.', 
    imageUrl: 'https://via.placeholder.com/600x400?text=Alabanza', 
    link: '#' 
  },
  { 
    title: 'Voluntarios de Bienvenida', 
    description: 'Ayuda a recibir a los visitantes en la entrada principal antes de cada servicio.', 
    imageUrl: 'https://via.placeholder.com/600x400?text=Bienvenida', 
    link: '#' 
  },
  { 
    title: 'Ministerio de Niños (Infantil)', 
    description: 'Enseña las escrituras a nuestros miembros más jóvenes. Requiere certificación.', 
    imageUrl: 'https://via.placeholder.com/600x400?text=Niños', 
    link: '#' 
  },
  { 
    title: 'Grupo de Oración Matutina', 
    description: 'Reunión virtual diaria para intercesión. Lunes a Viernes a las 6 AM.', 
    imageUrl: 'https://via.placeholder.com/600x400?text=Oración', 
    link: '#' 
  },
];

const MyGroupsPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Mis Grupos y Ministerios
      </h1>

      <p className="text-gray-600 mb-8 max-w-3xl">
        Aquí puedes ver los ministerios y grupos pequeños a los que te has unido. Haz clic en 'Ver Detalles' para acceder a recursos y horarios específicos de cada grupo.
      </p>

      {/* Grid de 3 columnas para desktop, 1 para móvil */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {groups.map((group, index) => (
          <GroupCard 
            key={index}
            title={group.title}
            description={group.description}
            imageUrl={group.imageUrl}
            link={group.link}
          />
        ))}
      </div>
      
      {/* Mensaje de CTA si no hay grupos */}
      {groups.length === 0 && (
        <div className="p-10 text-center bg-gray-50 rounded-xl shadow-inner mt-10">
            <p className="text-lg text-gray-500">Aún no estás inscrito en ningún grupo. ¡Únete a un ministerio hoy!</p>
            <button className="mt-4 text-blue-600 hover:text-blue-800 font-semibold">Explorar Ministerios</button>
        </div>
      )}
    </div>
  );
};

export default MyGroupsPage;
