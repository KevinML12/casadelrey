import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import apiClient from '../../lib/apiClient';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Falta el token de verificación.');
      return;
    }

    apiClient
      .get('/auth/verify-email', { params: { token } })
      .then((res) => {
        setStatus('success');
        setMessage(res.data?.message || 'Correo verificado correctamente.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Token inválido o expirado.');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <div
            className={`w-16 h-16 rounded-xl border flex items-center justify-center mx-auto mb-5 ${
              status === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-600'
                : status === 'error'
                  ? 'bg-red-500/10 border-red-500/30 text-red-600'
                  : 'bg-card-2 border-line text-ink-2'
            }`}
          >
            <MailCheck size={32} />
          </div>
          <h1 className="text-2xl font-black text-ink mb-2">
            {status === 'loading' && 'Verificando...'}
            {status === 'success' && '¡Correo verificado!'}
            {status === 'error' && 'Error'}
          </h1>
          <p className="text-ink-3 text-sm">
            {status === 'loading' && 'Un momento, por favor.'}
            {status === 'success' && message}
            {status === 'error' && message}
          </p>
        </div>

        {(status === 'success' || status === 'error') && (
          <Link
            to="/login"
            className="inline-block px-6 py-3 rounded-lg bg-navy text-white font-semibold hover:opacity-90 transition"
          >
            Ir a iniciar sesión
          </Link>
        )}
      </div>
    </div>
  );
}
