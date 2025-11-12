import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const DonationPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const stripe = useStripe();
  const elements = useElements();

  const onSubmit = async (data) => {
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Crear el payment method con Stripe
      const cardElement = elements.getElement(CardElement);
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: data.name,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Enviar al backend para procesar el pago
      const response = await fetch('http://localhost:8080/api/donate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(data.amount),
          paymentMethodId: paymentMethod.id,
          name: data.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al procesar la donación');
      }

      const result = await response.json();
      setSuccessMessage(`¡Gracias por tu donación de $${data.amount}!`);
      
      // Limpiar el formulario
      cardElement.clear();
    } catch (error) {
      setErrorMessage(error.message || 'Error al procesar la donación');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#374151',
        fontFamily: 'Inter, system-ui, sans-serif',
        '::placeholder': {
          color: '#9CA3AF',
        },
      },
      invalid: {
        color: '#EF4444',
      },
    },
  };

  return (
    <div className="max-w-6xl mx-auto py-16 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Columna Izquierda - Imagen */}
        <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-lg min-h-[400px] flex items-center justify-center text-white p-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-4">Tu Generosidad Importa</h3>
            <p className="text-lg text-blue-100">
              Cada donación nos ayuda a continuar con nuestra misión de servir a la comunidad
              y compartir el amor de Cristo.
            </p>
          </div>
        </div>

        {/* Columna Derecha - Formulario */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Realiza tu Donación
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Tu contribución es segura y está encriptada con Stripe.
          </p>

          {successMessage && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              id="amount"
              label="Monto a donar (USD)"
              type="number"
              placeholder="100"
              error={errors.amount?.message}
              {...register('amount', {
                required: 'El monto es requerido',
                min: {
                  value: 1,
                  message: 'El monto mínimo es $1'
                },
                pattern: {
                  value: /^\d+(\.\d{1,2})?$/,
                  message: 'Ingresa un monto válido'
                }
              })}
            />

            <Input
              id="name"
              label="Nombre completo"
              type="text"
              placeholder="Juan Pérez"
              error={errors.name?.message}
              {...register('name', {
                required: 'El nombre es requerido',
                minLength: {
                  value: 3,
                  message: 'El nombre debe tener al menos 3 caracteres'
                }
              })}
            />

            {/* Stripe Card Element */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Información de Tarjeta
              </label>
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition">
                <CardElement options={cardElementOptions} />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                🔒 Pagos seguros procesados por Stripe
              </p>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              isLoading={isProcessing}
              disabled={!stripe || isProcessing}
            >
              Donar Ahora
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Al continuar, aceptas nuestros términos de servicio</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationPage;
