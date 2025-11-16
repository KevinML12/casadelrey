import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const PrayerRequestPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      setIsSuccess(false);

      const response = await fetch('/api/prayer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al enviar la petición');
      }

      // Success
      setIsSuccess(true);
      reset();

      // Hide success message after 5 seconds
      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error submitting prayer request:', error);
      alert('Hubo un error al enviar tu petición. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Peticiones de Oración
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Nuestro equipo pastoral ora por cada petición
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-lg shadow-xl p-8 md:p-12"
        >
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <p className="text-green-700 font-medium text-center">
                ✓ Tu petición ha sido recibida. Estaremos orando por ti.
              </p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Input
                label="Tu Nombre (Opcional)"
                type="text"
                {...register('name')}
                placeholder="Juan Pérez"
              />
            </div>

            <div>
              <Input
                label="Email (Opcional)"
                type="email"
                {...register('email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido'
                  }
                })}
                error={errors.email?.message}
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tu Petición <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={6}
                {...register('request', {
                  required: 'La petición es requerida',
                  minLength: {
                    value: 10,
                    message: 'La petición debe tener al menos 10 caracteres'
                  }
                })}
                placeholder="Comparte tu petición de oración con nosotros..."
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors ${
                  errors.request
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                }`}
              />
              {errors.request && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.request.message}
                </p>
              )}
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="anonymous"
                {...register('anonymous')}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="anonymous" className="ml-3 text-sm text-gray-700">
                Deseo que esta petición sea anónima
              </label>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                disabled={isSuccess}
                className="w-full"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Petición'}
              </Button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Tus datos son confidenciales y solo serán vistos por nuestro equipo pastoral.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrayerRequestPage;
