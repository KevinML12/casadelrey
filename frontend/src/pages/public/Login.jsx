import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { login as apiLogin } from '../../lib/apiClient'; // Renamed import
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth(); // This is the context login function
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiLogin({ email, password });
      
      if (response.data && response.data.token) {
        // Call context login to store token
        login(response.data.token);
        
        toast.success('Iniciaste sesión exitosamente');
        
        // Navigate to the admin dashboard
        navigate('/admin');
      } else {
        // Handle cases where the API response is not as expected
        toast.error('Respuesta inesperada del servidor.');
      }
    } catch (error) {
      // Handle API errors
      const errorMessage = error.response?.data?.error || error.message || 'Error al iniciar sesión';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const pageBgClass = "bg-gray-50 dark:bg-gray-900"; 

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 ${pageBgClass} font-inter`}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 bg-[#2563EB]/10">
            <LogIn className="text-[#2563EB]" size={24} />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2 dark:text-white">
            Iniciar Sesión
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bienvenido de nuevo a Casa del Rey
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
                label="Correo Electrónico"
                type="email"
                name="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />

            <Input
                label="Contraseña"
                type="password"
                name="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-[#2563EB] hover:text-[#1E40AF] font-medium"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-6"
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-[#2563EB] font-semibold hover:text-[#1E40AF]">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}