import React from 'react';
import { User, Mail, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function Profile() {
  const { user, loading } = useAuth();

  const handleEditProfile = () => {
    toast.info('La funcionalidad para editar el perfil aún no está disponible en el backend.');
  };

  const handleChangePassword = () => {
    toast.info('La funcionalidad para cambiar la contraseña desde el perfil aún no está disponible en el backend.');
    // Podría redirigirse a /forgot-password si la intención es que el usuario use ese flujo,
    // pero para un usuario ya logueado, se esperaría un cambio de contraseña directo.
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-dark-bg py-12 flex items-center justify-center">
        <p className="text-text-primary dark:text-dark-text-primary">Cargando perfil...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-dark-bg py-12 flex items-center justify-center">
        <p className="text-red-500">No se pudo cargar la información del usuario. Inicia sesión.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light dark:bg-dark-bg py-12">
      <div className="container mx-auto px-6 max-w-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 bg-primary/10">
            <User className="text-primary" size={40} />
          </div>
          <h1 className="text-4xl font-black text-text-primary dark:text-dark-text-primary mb-2">
            Mi Perfil
          </h1>
          <p className="text-lg text-text-secondary dark:text-dark-text-secondary">
            Información de tu cuenta en Casa del Rey.
          </p>
        </div>

        <Card className="p-8 space-y-6">
          <div className="flex items-center space-x-4">
            <Mail size={24} className="text-primary" />
            <div>
              <p className="text-sm font-medium text-text-muted dark:text-dark-text-muted">Correo Electrónico</p>
              <p className="text-lg text-text-primary dark:text-dark-text-primary">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Briefcase size={24} className="text-primary" />
            <div>
              <p className="text-sm font-medium text-text-muted dark:text-dark-text-muted">Rol</p>
              <p className="text-lg text-text-primary dark:text-dark-text-primary">{user.role}</p>
            </div>
          </div>

          <div className="pt-6 border-t border-border-light dark:border-dark-border flex flex-col sm:flex-row gap-4 justify-end">
            <Button variant="outline" onClick={handleEditProfile}>
              Editar Perfil
            </Button>
            <Button variant="secondary" onClick={handleChangePassword}>
              Cambiar Contraseña
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
