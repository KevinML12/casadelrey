import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import AuthCard from '../../components/ui/AuthCard';
import { Icon, GlassField } from '../../components/ui/Glass';

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
      <Link to="/login" className="inline-flex items-center gap-2 text-14 font-semibold text-white/60 hover:text-white mb-8 transition-colors">
        <Icon name="arrow" className="w-4 h-4 rotate-180" />
        Volver al login
      </Link>

      {submitted ? (
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-white/10 border border-white/15 flex items-center justify-center mx-auto mb-5">
            <Icon name="mail" className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-22 font-bold text-white mb-3">Correo enviado</h1>
          <p className="text-15 text-white/60 leading-relaxed mb-6">
            Si <span className="font-semibold text-white">{email}</span> está registrado, recibirás
            un enlace para restablecer tu contraseña en unos minutos.
          </p>
          <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-pill liquid-glass text-white font-bold text-14">
            <Icon name="arrow" className="w-4 h-4 rotate-180" />
            Volver al login
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center mb-5">
              <Icon name="mail" className="w-5 h-5 text-white" />
            </div>
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
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-pill bg-white text-bg text-15 font-bold disabled:opacity-50"
            >
              {loading ? 'Enviando…' : 'Enviar enlace'}
            </motion.button>
          </form>
        </>
      )}
    </AuthCard>
  );
}
