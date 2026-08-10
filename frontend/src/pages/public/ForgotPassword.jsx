import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthCard from '../../components/ui/AuthCard';
import { GlassField, GlassButton } from '../../components/ui/Glass';

export default function ForgotPassword() {
  const [email, setEmail]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await forgotPassword(email);
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <AuthCard>
      <Link to="/login" className="inline-flex items-center text-14 font-semibold text-white/60 hover:text-white mb-8 transition-colors">
        Volver al login
      </Link>

      {submitted ? (
        <div className="text-center">
          <h1 className="text-24 font-bold text-white mb-3">Correo enviado</h1>
          <p className="text-15 text-white/60 leading-relaxed mb-6">
            Si <span className="font-semibold text-white">{email}</span> está registrado, recibirás
            un enlace para restablecer tu contraseña en unos minutos.
          </p>
          <Link to="/login" className="inline-flex items-center px-6 py-3 rounded-pill liquid-glass text-white font-bold text-14">
            Volver al login
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-22 font-bold text-white mb-1.5">Recuperar contraseña</h1>
            <p className="text-15 text-white/60">Ingresa tu correo y te enviamos un enlace de recuperación.</p>
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
            <GlassButton
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full justify-center"
            >
              {loading ? 'Enviando…' : 'Enviar enlace'}
            </GlassButton>
          </form>
        </>
      )}
    </AuthCard>
  );
}
