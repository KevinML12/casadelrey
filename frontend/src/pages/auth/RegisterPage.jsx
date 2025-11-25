import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const RegisterPage = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm();

  const password = watch('password');

  const registerMutation = useMutation({
    mutationFn: async ({ name, email, password }) => {
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al registrarse');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('¡Cuenta creada exitosamente! Redirigiendo...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    },
    onError: (error) => {
      toast.error(error.message || 'El email ya existe');
    }
  });

  const onSubmit = (data) => {
    registerMutation.mutate({
      name: data.name,
      email: data.email,
      password: data.password
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center py-12 px-4 transition-colors">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800/50 p-10 rounded-xl shadow-sm hover:shadow-md transition-all"
      >
        <h2 className="text-center text-3xl font-display font-bold text-dark-text dark:text-white mb-8 tracking-tight transition-colors">
          Crear una Cuenta
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
            <Input
              label="Password"
              type="password"
              {...register('password', {
                required: 'La contraseña es requerida',
                minLength: {
                  value: 6,
                  message: 'La contraseña debe tener al menos 6 caracteres'
                }
              })}
              error={errors.password?.message}
            />
          </div>

          <div>
            <Input
              label="Confirmar Password"
              type="password"
              {...register('confirmPassword', {
                required: 'Debes confirmar tu contraseña',
                validate: (value) =>
                  value === password || 'Las contraseñas no coinciden'
              })}
              error={errors.confirmPassword?.message}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={registerMutation.isPending}
            className="w-full"
          >
            Registrarse
          </Button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-200/50 dark:border-gray-800/50 text-center space-y-3 transition-colors">
          <Link to="/login" className="block text-sm font-semibold text-accent-blue hover:text-blue-700 uppercase tracking-widest transition-colors">
            ¿Ya tienes cuenta? Inicia sesión aquí
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
