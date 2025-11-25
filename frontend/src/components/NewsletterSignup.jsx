import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Input from './ui/Input';
import Button from './ui/Button';

const NewsletterSignup = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const subscribeMutation = useMutation({
    mutationFn: async ({ email }) => {
      const response = await fetch('http://localhost:8080/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al suscribirse');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('¡Suscripción exitosa!');
      reset();
    },
    onError: (error) => {
      toast.error(error.message || 'Error al suscribirse');
    }
  });

  const onSubmit = (data) => {
    subscribeMutation.mutate({ email: data.email });
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
          isLoading={subscribeMutation.isPending}
          className="w-full"
        >
          Suscribirme
        </Button>
      </form>
    </div>
  );
};

export default NewsletterSignup;
