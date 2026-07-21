import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../lib/apiClient';
import AuthCard from '../../components/ui/AuthCard';
import { Icon, GlassField } from '../../components/ui/Glass';

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
    <AuthCard>
      <div className="flex flex-col items-center text-center mb-8">
        <img src="/logo.png" alt="Casa del Rey" className="w-14 h-14 object-contain mb-5" />
        <h1 className="display-mega text-white" style={{ fontSize: '1.9rem' }}>Bienvenido de vuelta.</h1>
        <p className="text-15 text-white/60 mt-2">Ingresa con tus credenciales para continuar.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <GlassField
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          required
        />
        <GlassField
          label="Contraseña"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
        <div className="text-right">
          <Link to="/forgot-password" className="text-14 font-semibold text-white/60 hover:text-white transition-colors">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-pill bg-white text-bg text-15 font-bold disabled:opacity-50"
        >
          {loading ? 'Ingresando…' : 'Ingresar'}
          {!loading && <Icon name="arrow" className="w-4 h-4" stroke={2} />}
        </motion.button>
      </form>

      <div className="mt-8 pt-6 border-t border-white/10 text-center text-14 text-white/60">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="font-bold text-white hover:text-white/70 transition-colors">
          Regístrate
        </Link>
      </div>
    </AuthCard>
  );
}
