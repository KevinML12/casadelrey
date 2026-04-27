import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

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
    <div className="min-h-screen bg-surf flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-fade-in">

        <Link to="/login" className="inline-flex items-center gap-1.5 text-label-m text-on-surf-var hover:text-on-surf mb-8 transition-colors">
          <span className="ms" style={{ fontSize: 16 }}>arrow_back</span>
          Volver al login
        </Link>

        {submitted ? (
          <div className="text-center animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-ter-con flex items-center justify-center mx-auto mb-5">
              <span className="ms text-on-ter-con" style={{ fontSize: 28 }}>mark_email_read</span>
            </div>
            <h1 className="text-headline-s text-on-surf font-black mb-3">Correo enviado</h1>
            <p className="text-body-m text-on-surf-var leading-relaxed mb-6">
              Si <span className="font-semibold text-on-surf">{email}</span> está registrado, recibirás un enlace para restablecer tu contraseña en unos minutos.
            </p>
            <Button variant="outlined" as="link" to="/login">
              <span className="ms" style={{ fontSize: 16 }}>arrow_back</span>
              Volver al login
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="w-12 h-12 rounded-xl bg-surf-high border border-outline-var flex items-center justify-center mb-5">
                <span className="ms text-on-surf-var" style={{ fontSize: 22 }}>mail</span>
              </div>
              <h1 className="text-headline-s text-on-surf font-black mb-1">Recuperar contraseña</h1>
              <p className="text-body-m text-on-surf-var">
                Ingresa tu correo y te enviamos un enlace de recuperación.
              </p>
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
              <Button type="submit" variant="filled" size="lg" className="w-full justify-center" disabled={loading}>
                {loading
                  ? <><span className="ms" style={{ fontSize: 18 }}>hourglass_empty</span>Enviando...</>
                  : <><span className="ms" style={{ fontSize: 18 }}>send</span>Enviar enlace</>
                }
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
