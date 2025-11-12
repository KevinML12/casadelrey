import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const LoginPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [errorMessage, setErrorMessage] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setErrorMessage('');

    const result = await login(data.email, data.password);
    
    if (result.success) {
      navigate('/admin/dashboard');
    } else {
      setErrorMessage(result.error || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <motion.div 
        className="max-w-md w-full bg-white p-10 rounded-xl shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-center text-3xl font-bold text-gray-900 mb-6">
          Área de Miembros
        </h2>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            id="email"
            label="Correo Electrónico"
            type="email"
            placeholder="tu@ejemplo.com"
            error={errors.email?.message}
            {...register('email', {
              required: 'El correo electrónico es requerido',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Correo electrónico inválido'
              }
            })}
          />

          <Input
            id="password"
            label="Contraseña"
            type="password"
            placeholder="********"
            error={errors.password?.message}
            {...register('password', {
              required: 'La contraseña es requerida',
              minLength: {
                value: 6,
                message: 'La contraseña debe tener al menos 6 caracteres'
              }
            })}
          />
          
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Iniciar Sesión
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link to="/registro" className="block text-sm text-blue-600 hover:underline">
            Regístrate aquí
          </Link>
          <Link to="/recuperar" className="block text-sm text-blue-600 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;