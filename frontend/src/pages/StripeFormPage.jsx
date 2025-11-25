import { useForm } from 'react-hook-form';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, CreditCardIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const StripeFormPage = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const stripe = useStripe();
  const elements = useElements();

  const donationMutation = useMutation({
    mutationFn: async ({ amount, paymentMethodId, name }) => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/donate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, paymentMethodId, name })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al procesar la donación');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      toast.success(`¡Gracias por tu donación de $${variables.amount}! Tu generosidad hace la diferencia.`, {
        duration: 5000
      });
      
      // Limpiar el formulario
      reset();
      const cardElement = elements.getElement(CardElement);
      cardElement?.clear();

      // Scroll al inicio
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (error) => {
      toast.error(error.message || 'Error al procesar la donación');
    }
  });

  const onSubmit = async (data) => {
    if (!stripe || !elements) {
      toast.error('Stripe no está disponible. Por favor, recarga la página.');
      return;
    }

    try {
      // Crear el payment method con Stripe
      const cardElement = elements.getElement(CardElement);
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: data.name,
          email: data.email,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      // Procesar la donación
      donationMutation.mutate({
        amount: parseFloat(data.amount),
        paymentMethodId: paymentMethod.id,
        name: data.name
      });
    } catch (error) {
      toast.error(error.message || 'Error inesperado. Por favor, intenta de nuevo.');
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

  const quickAmounts = [10, 25, 50, 100, 250, 500];

  return (
    <div className="w-full overflow-x-hidden">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-16">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/donaciones"
            className="inline-flex items-center gap-2 text-white hover:text-blue-100 font-medium mb-6 transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Volver a opciones de donación
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <CreditCardIcon className="w-10 h-10" />
              <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-bold backdrop-blur-sm">
                Pago Seguro con Tarjeta
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Completa tu Donación
            </h1>
            <p className="text-xl text-blue-100">
              Tu contribución es segura y está protegida con encriptación de nivel bancario
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-8 md:p-12"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Monto Section */}
              <div>
                <label className="block text-gray-900 font-bold text-lg mb-4">
                  1. Selecciona el monto de tu donación
                </label>
                
                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        const event = { target: { value: amount } };
                        register('amount').onChange(event);
                      }}
                      className="px-4 py-3 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-600 hover:text-white transition border-2 border-blue-200 hover:border-blue-600"
                    >
                      ${amount}
                    </button>
                  ))}
                </div>

                <Input
                  id="amount"
                  label="O ingresa un monto personalizado (USD)"
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  error={errors.amount?.message}
                  {...register('amount', {
                    required: 'El monto es requerido',
                    min: {
                      value: 1,
                      message: 'El monto mínimo es $1'
                    },
                    pattern: {
                      value: /^\d+(\.\d{1,2})?$/,
                      message: 'Ingresa un monto válido (ejemplo: 100.00)'
                    }
                  })}
                />
              </div>

              {/* Personal Info Section */}
              <div className="pt-6 border-t border-gray-200">
                <label className="block text-gray-900 font-bold text-lg mb-4">
                  2. Información personal
                </label>

                <div className="space-y-6">
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

                  <Input
                    id="email"
                    label="Correo electrónico"
                    type="email"
                    placeholder="juan@ejemplo.com"
                    error={errors.email?.message}
                    {...register('email', {
                      required: 'El correo electrónico es requerido',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Ingresa un correo válido'
                      }
                    })}
                  />
                </div>
              </div>

              {/* Payment Section */}
              <div className="pt-6 border-t border-gray-200">
                <label className="block text-gray-900 font-bold text-lg mb-4">
                  3. Información de pago
                </label>

                <div>
                  <label className="block text-gray-700 font-medium mb-3">
                    Detalles de la Tarjeta
                  </label>
                  <div className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition bg-white">
                    <CardElement options={cardElementOptions} />
                  </div>
                  <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                    <ShieldCheckIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p>
                      Tus datos están protegidos con encriptación SSL de 256 bits. 
                      No almacenamos información de tarjetas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Badges */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex flex-wrap items-center justify-center gap-6">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <ShieldCheckIcon className="w-6 h-6 text-green-600" />
                    <span className="font-medium">Pago Seguro</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#6366F1"/>
                      <path d="M2 17L12 22L22 17" stroke="#6366F1" strokeWidth="2"/>
                    </svg>
                    <span className="font-medium">Powered by Stripe</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CreditCardIcon className="w-6 h-6 text-blue-600" />
                    <span className="font-medium">Todas las Tarjetas</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                variant="primary" 
                isLoading={donationMutation.isPending}
                disabled={!stripe || donationMutation.isPending}
                className="w-full py-4 text-lg"
              >
                {donationMutation.isPending ? 'Procesando...' : 'Completar Donación'}
              </Button>

              <div className="text-center text-sm text-gray-600">
                <p>
                  Al continuar, confirmas que has leído y aceptas nuestros{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                    términos de servicio
                  </a>
                </p>
              </div>
            </form>
          </motion.div>

          {/* Success Message Area */}
          {donationMutation.isSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mt-8 bg-green-50 border-2 border-green-200 rounded-xl p-8 text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Donación Exitosa!
              </h3>
              <p className="text-gray-700 mb-6">
                Hemos enviado un recibo a tu correo electrónico. 
                Gracias por tu generosidad y apoyo a nuestra misión.
              </p>
              <Link
                to="/"
                className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition"
              >
                Volver al Inicio
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default StripeFormPage;
