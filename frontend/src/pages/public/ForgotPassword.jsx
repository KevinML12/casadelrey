import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function ForgotPassword() {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
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
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink mb-8 transition-colors">
          <ArrowLeft size={14} /> Volver al login
        </Link>

        {submitted ? (
          <div className="text-center animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-ok/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={28} className="text-ok" />
            </div>
            <h1 className="text-2xl font-black text-ink mb-2">Correo enviado</h1>
            <p className="text-ink-2 text-sm leading-relaxed mb-6">
              Si <span className="font-medium text-ink">{email}</span> está registrado, recibirás un enlace para restablecer tu contraseña en unos minutos.
            </p>
            <Button variant="outline" as={Link} to="/login">Volver al login</Button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="w-12 h-12 rounded-xl bg-card-2 border border-line flex items-center justify-center mb-5">
                <Mail size={22} className="text-ink-2" />
              </div>
              <h1 className="text-2xl font-black text-ink mb-1">Recuperar contraseña</h1>
              <p className="text-ink-3 text-sm">
                Ingresa tu correo y te enviamos un enlace de recuperación.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <Button type="submit" variant="navy" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
