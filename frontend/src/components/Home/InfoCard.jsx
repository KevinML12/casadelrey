import { motion } from 'framer-motion';
import Button from '../ui/Button';

const InfoCard = ({ image, title, description, buttonText, onButtonClick }) => {
  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden hover:shadow-2xl transition-shadow">
      <div className="h-48 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          {title}
        </h3>
        <p className="text-gray-600 mb-6 leading-relaxed">
          {description}
        </p>
        <Button
          variant="primary"
          onClick={onButtonClick}
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

export default InfoCard;
