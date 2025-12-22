import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserPlus, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';


export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    const { success, error } = await register(formData.email, formData.password, formData.name);
    
    if (success) {
      toast.success('¡Registro exitoso!');
      navigate('/dashboard');
    } else {
      toast.error(error || 'Error en el registro');
    }
  };

  const pageBgClass = "bg-gray-50 dark:bg-gray-900"; 

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 ${pageBgClass} font-inter`}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 bg-[#2563EB]/10">
            <UserPlus className="text-[#2563EB]" size={24} />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2 dark:text-white">
            Crear Cuenta
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Únete a la comunidad de Casa del Rey
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
                label="Nombre Completo"
                type="text"
                name="name"
                placeholder="Tu nombre"
                value={formData.name}
                onChange={handleChange}
                required
            />

            <Input
                label="Correo Electrónico"
                type="email"
                name="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleChange}
                required
            />

            <Input
                label="Contraseña"
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
            />

            <Input
                label="Confirmar Contraseña"
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-6"
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </Button>
          </form>

          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-[#2563EB] font-semibold hover:text-[#1E40AF]">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}