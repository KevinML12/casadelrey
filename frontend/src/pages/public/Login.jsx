import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../lib/apiClient';
import Input from '../../components/ui/Input';

const BG_IMG = 'https://images.unsplash.com/photo-1776884245642-372a5766f8db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3ODA4MDkwOTN8&ixlib=rb-4.1.0&q=80&w=1080';

const STATS = [
  ['200+', 'Familias'],
  ['20+',  'Células'],
  ['90+',  'Voluntarios'],
];

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
    <div className="min-h-screen flex">

      {/* ── Panel izquierdo — solo desktop ──────────────────────────── */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden" style={{ background: '#060D24' }}>
        {/* Foto de fondo */}
        <img
          src={BG_IMG}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay navy */}
        <div className="absolute inset-0" style={{ background: '#060D24CC' }} />

        {/* Contenido */}
        <div className="relative z-10 h-full flex flex-col" style={{ padding: '64px 96px' }}>

          {/* Brand */}
          <div className="flex items-center gap-3.5">
            <span className="ms text-white" style={{ fontSize: 28 }}>public</span>
            <div style={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
              <p className="text-white font-semibold leading-tight" style={{ fontSize: 16 }}>Casa del Rey</p>
              <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 12 }}>Huehuetenango, Guatemala</p>
            </div>
          </div>

          {/* Cita bíblica */}
          <div style={{ marginTop: 216 }}>
            <p
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 96,
                lineHeight: 0.8,
                color: 'rgba(74,144,217,0.2)',
                marginBottom: -16,
              }}
            >&ldquo;</p>
            <p
              style={{
                fontFamily: 'Playfair Display, serif',
                fontStyle: 'italic',
                fontSize: 30,
                lineHeight: 1.4,
                color: '#FFFFFF',
                maxWidth: 500,
              }}
            >
              Porque yo sé los planes que tengo para vosotros, dice el Señor.
            </p>
            <div className="flex items-center gap-2.5 mt-6">
              <div style={{ width: 24, height: 1, background: 'rgba(255,255,255,.3)' }} />
              <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 14 }}>Jeremías 29:11</p>
            </div>
          </div>

          {/* Stats al fondo */}
          <div className="flex items-end gap-8 mt-auto">
            {STATS.map(([val, lbl], i) => (
              <div key={lbl} className="flex items-end gap-8">
                <div>
                  <p className="text-white font-black leading-none" style={{ fontSize: 24 }}>{val}</p>
                  <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 12, marginTop: 4 }}>{lbl}</p>
                </div>
                {i < STATS.length - 1 && (
                  <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,.2)' }} />
                )}
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Panel derecho — formulario ───────────────────────────────── */}
      <div
        className="flex-1 lg:w-1/2 flex items-center justify-center"
        style={{ background: '#FAFAF8' }}
      >
        <div className="w-full px-6" style={{ maxWidth: 560, padding: '0 80px' }}>

          {/* Logo mobile */}
          <div className="flex justify-center mb-10 lg:hidden">
            <div className="rounded-xl px-4 py-3" style={{ background: '#060D24' }}>
              <img src="/logo.png" alt="Casa del Rey" className="h-10 w-auto object-contain"
                style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: 36,
              letterSpacing: '-0.72px',
              color: '#050505',
              lineHeight: 1.15,
            }}
          >
            Bienvenido de vuelta.
          </h1>
          <div style={{ height: 8 }} />
          <p style={{ fontSize: 16, color: '#525B7A' }}>
            Ingresa con tus credenciales para continuar.
          </p>
          <div style={{ height: 40 }} />

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
            />
            <div style={{ height: 20 }} />
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <div style={{ height: 12 }} />
            <div className="text-right">
              <Link
                to="/forgot-password"
                style={{ color: '#0D1B4B', fontSize: 14, fontWeight: 500 }}
                className="hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div style={{ height: 32 }} />
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                height: 52,
                borderRadius: 9999,
                background: '#0D1B4B',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: 15,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading
                ? <><span className="ms" style={{ fontSize: 18 }}>hourglass_empty</span>Ingresando…</>
                : <><span className="ms" style={{ fontSize: 18 }}>login</span>Ingresar</>
              }
            </button>
          </form>

          <div style={{ height: 40 }} />
          <div style={{ height: 1, background: '#E5E7EB' }} />
          <div style={{ height: 20 }} />

          <div className="flex items-center gap-1.5" style={{ color: '#525B7A', fontSize: 14 }}>
            ¿No tienes cuenta?{' '}
            <Link
              to="/register"
              style={{ color: '#0D1B4B', fontWeight: 600 }}
              className="hover:underline"
            >
              Regístrate
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}
