import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Input from './ui/Input';
import Button from './ui/Button';

const NewsletterSignup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess(false);

      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Error al suscribirse');
      }

      setSuccess(true);
      reset();

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">
        Boletín Informativo
      </h3>
      <p className="text-gray-400 text-sm mb-4">
        Recibe noticias y actualizaciones en tu correo
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <Input
            type="email"
            placeholder="Tu correo electrónico"
            {...register('email', {
              required: 'El email es requerido',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email inválido'
              }
            })}
            error={errors.email?.message}
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={success}
          className="w-full"
        >
          {isLoading ? 'Enviando...' : 'Suscribirme'}
        </Button>
      </form>

      {success && (
        <p className="mt-3 text-sm text-green-400">
          ¡Suscripción exitosa!
        </p>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default NewsletterSignup;
