import Button from '../ui/Button';

const InfoCard = ({ image, title, description, buttonText = 'Leer Más' }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Imagen Placeholder */}
      {image ? (
        <img src={image} alt={title} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-gray-300"></div>
      )}
      
      {/* Contenido */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-gray-700 mb-4">
          {description}
        </p>
        <Button variant="primary">
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

export default InfoCard;
