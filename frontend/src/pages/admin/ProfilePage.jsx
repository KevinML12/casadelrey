import React, { useState } from 'react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card'; // Asumiendo que Card.jsx fue creado

const ProfilePage = () => {
  // Estados para Información Personal
  const [name, setName] = useState('Juan Pérez');
  const [phone, setPhone] = useState('+502 5555-1234');
  
  // Estados para Contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePersonalUpdate = (e) => {
    e.preventDefault();
    // TODO: Lógica de API para actualizar info personal
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
        alert('La nueva contraseña y la confirmación no coinciden.');
        return;
    }
    // TODO: Lógica de API para cambiar contraseña
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-display font-bold text-dark-text dark:text-white">
        Mi Perfil
      </h1>

      {/* Tarjeta 1: Información Personal */}
      <Card>
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">
          Información Personal
        </h2>
        <form onSubmit={handlePersonalUpdate} className="space-y-6 max-w-lg">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <Input 
              id="phone" 
              type="tel" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              required 
            />
          </div>
          <div className="pt-4">
            <Button type="submit">Actualizar Información</Button>
          </div>
        </form>
      </Card>

      {/* Tarjeta 2: Cambiar Contraseña */}
      <Card className="mt-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">
          Cambiar Contraseña
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-6 max-w-lg">
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
            <Input 
              id="current-password" 
              type="password" 
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)} 
              placeholder="Escribe tu contraseña actual" 
              required 
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
            <Input 
              id="new-password" 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              placeholder="Mínimo 8 caracteres" 
              required 
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
            <Input 
              id="confirm-password" 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder="Confirma la nueva contraseña" 
              required 
            />
          </div>
          <div className="pt-4">
            <Button type="submit">Cambiar Contraseña</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProfilePage;