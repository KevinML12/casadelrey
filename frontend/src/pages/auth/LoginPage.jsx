import { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempt with:', email, password);
    // Lógica de autenticación (Placeholder)
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-10 rounded-xl shadow-xl">
        <h2 className="text-center text-3xl font-bold text-gray-900 mb-6">
          Área de Miembros
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="email"
            label="Correo Electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@ejemplo.com"
            required
          />

          <Input
            id="password"
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            required
          />
          
          <Button type="submit" variant="primary">
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
      </div>
    </div>
  );
};

export default LoginPage;