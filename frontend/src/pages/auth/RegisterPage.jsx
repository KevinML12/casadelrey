import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const RegisterPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError('');

      // Simular fetch a /api/register
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al registrarse');
      }

      // Éxito
      setSuccess(true);

      // Redirigir a /login después de 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'El email ya existe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white p-10 rounded-xl shadow-xl"
      >
        <h2 className="text-center text-3xl font-bold text-gray-900 mb-6">
          Crear una Cuenta
        </h2>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg"
          >
            ¡Cuenta creada exitosamente! Redirigiendo al inicio de sesión...
          </motion.div>
        )}

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
            isLoading={isLoading}
            disabled={success}
            className="w-full"
          >
            {isLoading ? 'Registrando...' : 'Registrarse'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-blue-600 hover:underline">
            ¿Ya tienes cuenta? Inicia sesión aquí
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
