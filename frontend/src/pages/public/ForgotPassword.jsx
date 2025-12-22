import React, { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { forgotPassword, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { success, error } = await forgotPassword(email);

    if (success) {
      toast.success('Si existe una cuenta con este correo, recibirás un enlace para restablecer tu contraseña.');
      setSubmitted(true);
    } else {
      toast.error(error || 'Ocurrió un error. Por favor, intenta de nuevo.');
    }
  };

  const pageBgClass = "bg-bg-light dark:bg-dark-bg";

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 ${pageBgClass} font-sans`}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
           <h1 className="text-4xl font-bold text-text-primary dark:text-dark-text-primary mb-2">
            Restablecer Contraseña
          </h1>
          <p className="text-text-secondary dark:text-dark-text-secondary">
            Ingresa tu correo para recibir un enlace de recuperación.
          </p>
        </div>

        <Card>
          {submitted ? (
            <div className="text-center p-4">
              <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary mb-2">Revisa tu correo</h3>
              <p className="text-text-secondary dark:text-dark-text-secondary">
                Hemos enviado un enlace de recuperación a <strong>{email}</strong>. Por favor, sigue las instrucciones para continuar.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                  label="Correo Electrónico"
                  type="email"
                  name="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-6"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar Enlace'}
              </Button>
            </form>
          )}

          <div className="mt-6 border-t border-border-light dark:border-dark-border pt-6 text-center">
             <Link to="/login" className="text-primary font-semibold hover:underline flex items-center justify-center gap-2">
                <ArrowLeft size={16} /> Volver a Iniciar Sesión
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
