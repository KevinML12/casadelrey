import React, { useState } from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }
    
    const { success, error } = await resetPassword(token, password);

    if (success) {
      toast.success('Tu contraseña ha sido restablecida exitosamente.');
      navigate('/login');
    } else {
      toast.error(error || 'El enlace es inválido o ha expirado. Por favor, solicita uno nuevo.');
    }
  };

  const pageBgClass = "bg-bg-light dark:bg-dark-bg";

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 ${pageBgClass} font-sans`}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
           <h1 className="text-4xl font-bold text-text-primary dark:text-dark-text-primary mb-2">
            Crear Nueva Contraseña
          </h1>
          <p className="text-text-secondary dark:text-dark-text-secondary">
            Ingresa tu nueva contraseña.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
                label="Nueva Contraseña"
                type="password"
                name="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
             <Input
                label="Confirmar Nueva Contraseña"
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-6"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Contraseña'}
            </Button>
          </form>
           <div className="mt-6 border-t border-border-light dark:border-dark-border pt-6 text-center">
             <Link to="/login" className="text-primary font-semibold hover:underline flex items-center justify-center gap-2">
                <ArrowLeft size={16} /> Volver a Iniciar Sesión
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
