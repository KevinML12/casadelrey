import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../lib/apiClient';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function Login() {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]  = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      login(res.data.token);
      toast.success('¡Bienvenido!');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Panel izquierdo — decorativo, solo desktop */}
      <div className="hidden lg:flex w-1/2 bg-navy items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-gold font-black text-2xl">CR</span>
          </div>
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Casa del<br />
            <span className="text-gold">Rey</span>
          </h2>
          <p className="text-white/50 text-sm leading-relaxed max-w-xs">
            Luz para las naciones.<br />Amor para cada vida.
          </p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-ink mb-1">Inicia sesión</h1>
            <p className="text-ink-3 text-sm">Ingresa a tu cuenta de Casa del Rey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <div>
              <Input
                label="Contraseña"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <div className="mt-1.5 text-right">
                <Link to="/forgot-password" className="text-xs text-ink-3 hover:text-blue transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <Button type="submit" variant="navy" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-3">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-blue font-medium hover:underline">Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
