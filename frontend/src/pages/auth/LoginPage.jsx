import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const LoginPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { setUser, setToken } = useAuth();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al iniciar sesión');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Guardar en AuthContext
      setUser(data.user);
      setToken(data.token);
      
      // Guardar en localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      
      toast.success('¡Bienvenido!');
      navigate('/admin/dashboard');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al iniciar sesión');
    }
  });

  const onSubmit = (data) => {
    loginMutation.mutate({ email: data.email, password: data.password });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center py-12 px-4 transition-colors">
      <motion.div 
        className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800/50 p-8 rounded-xl shadow-sm transition-colors"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-display font-bold text-dark-text dark:text-white mb-2 transition-colors">
            Área de Miembros
          </h2>
          <p className="text-sm text-dark-text/60 dark:text-gray-400 font-normal">Acceso a tu cuenta personal</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password', {
              required: 'La contraseña es requerida',
              minLength: {
                value: 6,
                message: 'La contraseña debe tener al menos 6 caracteres'
              }
            })}
          />
          
          <Button type="submit" variant="primary" isLoading={loginMutation.isPending}>
            Iniciar Sesión
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-800/50 text-center space-y-3 transition-colors">
          <p className="text-xs text-dark-text/60 dark:text-gray-400">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-accent-blue hover:text-blue-700 font-semibold transition-colors">
              Regístrate
            </Link>
          </p>
          <Link to="/recuperar" className="block text-xs text-accent-blue hover:text-blue-700 font-semibold transition-colors">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;