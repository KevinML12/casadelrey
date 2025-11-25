import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, HeartIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const PrayerFormPage = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const prayerMutation = useMutation({
    mutationFn: async ({ name, email, message }) => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/contact/petition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          message,
          is_prayer: true 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar la petición');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('¡Petición recibida! Estaremos orando por ti. Recibirás una confirmación por email.', {
        duration: 6000
      });
      
      reset();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (error) => {
      toast.error(error.message || 'Error al enviar la petición. Por favor, intenta de nuevo.');
    }
  });

  const onSubmit = async (data) => {
    prayerMutation.mutate(data);
  };

  return (
    <div className="w-full overflow-x-hidden">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-600 to-indigo-700 text-white py-16">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/oracion"
            className="inline-flex items-center gap-2 text-white hover:text-purple-100 font-medium mb-6 transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Volver a opciones de oración
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <HeartIcon className="w-10 h-10" />
              <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-bold backdrop-blur-sm">
                Petición Confidencial
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Comparte tu Petición de Oración
            </h1>
            <p className="text-xl text-purple-100">
              Tu petición es importante y será tratada con absoluta confidencialidad
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
            {/* Privacy Notice */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <ShieldCheckIcon className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Tu privacidad es nuestra prioridad</h3>
                  <p className="text-sm text-gray-700">
                    Todas las peticiones son confidenciales y solo serán compartidas con nuestro 
                    equipo de oración capacitado. Tu información nunca será publicada o compartida públicamente.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Personal Information */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Información de Contacto
                </h2>

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
                  <p className="text-sm text-gray-600 -mt-2">
                    Te enviaremos una confirmación a este correo
                  </p>
                </div>
              </div>

              {/* Prayer Request */}
              <div className="pt-6 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Tu Petición de Oración
                </h2>

                <div>
                  <label htmlFor="message" className="block text-gray-700 font-medium mb-3">
                    Comparte tu necesidad <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    rows={8}
                    placeholder="Cuéntanos cómo podemos orar por ti. Sé específico si te sientes cómodo haciéndolo..."
                    className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm transition focus:outline-none focus:ring-2 ${
                      errors.message
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500'
                    }`}
                    {...register('message', {
                      required: 'Por favor, comparte tu petición de oración',
                      minLength: {
                        value: 10,
                        message: 'La petición debe tener al menos 10 caracteres'
                      },
                      maxLength: {
                        value: 2000,
                        message: 'La petición no puede exceder 2000 caracteres'
                      }
                    })}
                  />
                  {errors.message && (
                    <p className="mt-2 text-sm text-red-600">{errors.message.message}</p>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    Mínimo 10 caracteres, máximo 2000 caracteres
                  </p>
                </div>
              </div>

              {/* Guidelines */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-3">Qué esperar después de enviar:</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Recibirás un email de confirmación inmediatamente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Nuestro equipo comenzará a orar dentro de las próximas 24 horas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Si es necesario, un pastor o líder se pondrá en contacto contigo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Tu petición permanecerá en nuestra lista de oración durante 30 días</span>
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                variant="primary" 
                isLoading={prayerMutation.isPending}
                disabled={prayerMutation.isPending}
                className="w-full py-4 text-lg bg-purple-600 hover:bg-purple-700"
              >
                {prayerMutation.isPending ? 'Enviando...' : 'Enviar Petición de Oración'}
              </Button>

              <div className="text-center text-sm text-gray-600">
                <p>
                  Al enviar tu petición, aceptas que nuestro equipo de oración ore por ti 
                  y se comunique contigo si es necesario
                </p>
              </div>
            </form>
          </motion.div>

          {/* Success Message Area */}
          {prayerMutation.isSuccess && (
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
                ¡Petición Recibida!
              </h3>
              <p className="text-gray-700 mb-2">
                Gracias por compartir tu necesidad con nosotros. Nuestro equipo comenzará a orar por ti pronto.
              </p>
              <p className="text-sm text-gray-600 mb-6">
                Revisa tu correo electrónico para ver la confirmación.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/"
                  className="inline-block bg-purple-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-purple-700 transition"
                >
                  Volver al Inicio
                </Link>
                <button
                  onClick={() => {
                    reset();
                    prayerMutation.reset();
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  className="inline-block bg-white text-purple-600 border-2 border-purple-600 font-bold py-3 px-8 rounded-lg hover:bg-purple-50 transition"
                >
                  Enviar Otra Petición
                </button>
              </div>
            </motion.div>
          )}

          {/* Additional Resources */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8"
          >
            <div className="bg-gray-100 rounded-xl p-6 text-center">
              <p className="text-gray-700 text-sm">
                <strong>Versículo de aliento:</strong> "No se inquieten por nada; más bien, 
                en toda ocasión, con oración y ruego, presenten sus peticiones a Dios y denle gracias." 
                - Filipenses 4:6
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrayerFormPage;
