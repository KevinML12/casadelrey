import { motion } from 'framer-motion';

const EventCard = ({ event }) => {
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      {event.image && (
        <div className="h-48 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {event.title}
        </h3>
        <p className="text-sm text-gray-500 mb-3">
          {formatDate(event.date)}
        </p>
        <p className="text-gray-600">
          {event.description}
        </p>
      </div>
    </div>
  );
};

export default EventCard;
