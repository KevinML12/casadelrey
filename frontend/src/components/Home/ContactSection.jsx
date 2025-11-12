import { motion } from 'framer-motion';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Input from '../ui/Input';
import Button from '../ui/Button';

const ContactSection = () => {
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setIsSending(true);
      setIsSuccess(false);

      // Simular llamada a la API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al enviar el mensaje');
      }

      // Éxito
      setIsSuccess(true);
      reset();

      // Ocultar mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error al enviar el mensaje:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section id="contact" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Columna Izquierda - Imagen */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-2 md:order-1"
          >
            <img
              src="https://images.unsplash.com/photo-1519491050282-cf00c82424b4?w=800&h=600&fit=crop"
              alt="Contáctenos"
              className="w-full rounded-lg shadow-lg object-cover"
            />
          </motion.div>

          {/* Columna Derecha - Formulario */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-1 md:order-2"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Contáctenos
            </h2>

            {isSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <p className="text-green-600 font-medium">
                  ¡Mensaje enviado! Nos pondremos en contacto pronto.
                </p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input
                  label="Nombre"
                  type="text"
                  {...register('name', {
                    required: 'El nombre es requerido',
                    minLength: {
                      value: 2,
                      message: 'El nombre debe tener al menos 2 caracteres'
                    }
                  })}
                  error={errors.name?.message}
                />
              </div>

              <div>
                <Input
                  label="Email"
                  type="email"
                  {...register('email', {
                    required: 'El email es requerido',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido'
                    }
                  })}
                  error={errors.email?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje
                </label>
                <textarea
                  rows={5}
                  {...register('message', {
                    required: 'El mensaje es requerido',
                    minLength: {
                      value: 10,
                      message: 'El mensaje debe tener al menos 10 caracteres'
                    }
                  })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors ${
                    errors.message
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.message.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={isSending}
                className="w-full"
              >
                {isSending ? 'Enviando...' : 'Enviar Mensaje'}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
