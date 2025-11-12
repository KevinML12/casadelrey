import { useState } from 'react';

const GroupsPage = () => {
  const [groups] = useState([
    {
      id: 1,
      name: 'Ministerio de Alabanza',
      description: 'Equipo de música y adoración que lidera los servicios dominicales',
      members: 12,
      leader: 'María González',
      meetingDay: 'Sábados 6:00 PM'
    },
    {
      id: 2,
      name: 'Grupo de Jóvenes',
      description: 'Comunidad de jóvenes entre 18-30 años enfocados en crecimiento espiritual',
      members: 25,
      leader: 'Carlos Ramírez',
      meetingDay: 'Viernes 7:00 PM'
    },
    {
      id: 3,
      name: 'Ministerio de Niños',
      description: 'Enseñanza bíblica y actividades para niños de 5-12 años',
      members: 8,
      leader: 'Ana López',
      meetingDay: 'Domingos 10:00 AM'
    },
    {
      id: 4,
      name: 'Grupo de Oración',
      description: 'Intercesión y oración por las necesidades de la iglesia y comunidad',
      members: 15,
      leader: 'Pedro Martínez',
      meetingDay: 'Miércoles 7:00 PM'
    }
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Mis Grupos
        </h1>
        <p className="text-gray-600">
          Grupos ministeriales en los que participas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map((group) => (
          <div
            key={group.id}
            className="bg-white rounded-lg shadow-md hover:shadow-xl transition duration-300 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4">
              <h3 className="text-xl font-bold text-white">{group.name}</h3>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                {group.description}
              </p>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="font-semibold mr-2">Líder:</span>
                  <span>{group.leader}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold mr-2">Miembros:</span>
                  <span>{group.members}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold mr-2">Reunión:</span>
                  <span>{group.meetingDay}</span>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-semibold">
                  Ver Detalles
                </button>
                <button className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition font-semibold">
                  Salir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No estás participando en ningún grupo</p>
          <button className="mt-4 bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition font-semibold">
            Explorar Grupos
          </button>
        </div>
      )}
    </div>
  );
};

export default GroupsPage;
