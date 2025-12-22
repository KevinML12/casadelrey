import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function PaymentSuccess() {
  const pageBgClass = "bg-gray-50 dark:bg-gray-900";

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 ${pageBgClass} font-inter`}>
      <div className="w-full max-w-md text-center">
        <Card>
          <div className="p-6">
            <div className="flex justify-center mb-4">
              <CheckCircle className="text-green-500" size={64} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-3 dark:text-white">
              ¡Pago Exitoso!
            </h1>
            <p className="text-gray-600 mb-8 dark:text-gray-400">
              Muchas gracias por tu generosa donación. Tu apoyo es invaluable para nosotros.
            </p>
            <Button as={Link} to="/" variant="primary" size="lg" className="w-full">
              Volver al Inicio
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
