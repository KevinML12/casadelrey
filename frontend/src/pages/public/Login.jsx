import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../lib/apiClient';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      login(res.data.token);
      toast.success('¡Bienvenido!');
      const role = res.data.user?.role || '';
      if (role === 'admin')          navigate('/admin');
      else if (role === 'leader')    navigate('/leader');
      else if (role === 'volunteer') navigate('/volunteer/dashboard');
      else                           navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surf flex">

      {/* ── Panel izquierdo — decorativo, solo desktop ──────────── */}
      <div className="hidden lg:flex w-1/2 hero-surf items-center justify-center p-16 relative overflow-hidden">
        <div className="hero-grid" />

        {/* Glow */}
        <div className="absolute pointer-events-none" style={{
          left: -100, bottom: -100, width: 500, height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(21,101,192,.25) 0%, transparent 65%)',
        }} />

        <div className="relative z-10 text-center">
          {/* Logo sobre contenedor navy */}
          <div className="inline-block rounded-xl px-6 py-4 mb-8" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
            <img
              src="/logo.png"
              alt="Casa del Rey"
              className="h-24 w-auto object-contain mx-auto"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>

          <h2 className="text-display-s text-white mb-4 leading-tight">
            Casa del<br />
            <span style={{ color: '#A4C8FF' }}>Rey</span>
          </h2>
          <p className="text-body-m" style={{ color: 'rgba(255,255,255,.5)' }}>
            Luz para las naciones.<br />Amor para cada vida.
          </p>

          {/* Stats pequeños */}
          <div className="flex gap-4 justify-center mt-10">
            {[['200+', 'Familias'], ['20+', 'Células'], ['90+', 'Voluntarios']].map(([v, l]) => (
              <div key={l} className="text-center">
                <div className="text-headline-s text-white font-black">{v}</div>
                <div className="text-label-m mt-0.5" style={{ color: 'rgba(255,255,255,.4)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panel derecho — formulario ───────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-in">

          {/* Logo mobile */}
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="rounded-lg px-3 py-2" style={{ background: '#0D1B5E' }}>
              <img
                src="/logo.png"
                alt="Casa del Rey"
                className="h-10 w-auto object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-headline-s text-on-surf font-black mb-1">Inicia sesión</h1>
            <p className="text-body-m text-on-surf-var">Ingresa a tu cuenta de Casa del Rey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
            />

            <div>
              <Input
                label="Contraseña"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <div className="mt-2 text-right">
                <Link to="/forgot-password" className="text-label-m text-pri hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="filled"
              size="lg"
              className="w-full justify-center mt-2"
              disabled={loading}
            >
              {loading
                ? <><span className="ms" style={{ fontSize: 18 }}>hourglass_empty</span>Ingresando...</>
                : <><span className="ms" style={{ fontSize: 18 }}>login</span>Ingresar</>
              }
            </Button>
          </form>

          <p className="mt-6 text-center text-body-s text-on-surf-var">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-pri font-semibold hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}
