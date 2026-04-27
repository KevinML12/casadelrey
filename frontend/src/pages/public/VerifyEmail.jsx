import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import apiClient from '../../lib/apiClient';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status,  setStatus]  = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Falta el token de verificación.');
      return;
    }
    apiClient.get('/auth/verify-email', { params: { token } })
      .then(res => {
        setStatus('success');
        setMessage(res.data?.message || 'Correo verificado correctamente.');
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Token inválido o expirado.');
      });
  }, [token]);

  const iconMap = {
    loading: { icon: 'hourglass_empty', cls: 'bg-surf-high text-on-surf-var' },
    success: { icon: 'mark_email_read',  cls: 'bg-ter-con text-on-ter-con' },
    error:   { icon: 'error',            cls: 'bg-err-con text-on-err-con' },
  };
  const { icon, cls } = iconMap[status];

  return (
    <div className="min-h-screen bg-surf flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center animate-fade-in">
        <div className="mb-8">
          <div className={`w-16 h-16 rounded-xl border border-outline-var flex items-center justify-center mx-auto mb-5 ${cls}`}>
            <span className={`ms ${status === 'loading' ? 'animate-spin' : ''}`} style={{ fontSize: 32 }}>{icon}</span>
          </div>
          <h1 className="text-headline-s text-on-surf font-black mb-2">
            {status === 'loading' && 'Verificando...'}
            {status === 'success' && '¡Correo verificado!'}
            {status === 'error'   && 'Error de verificación'}
          </h1>
          <p className="text-body-m text-on-surf-var">
            {status === 'loading' && 'Un momento, por favor.'}
            {(status === 'success' || status === 'error') && message}
          </p>
        </div>

        {(status === 'success' || status === 'error') && (
          <Link to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-pri text-on-pri text-label-l font-semibold hover:opacity-90 transition-opacity">
            <span className="ms" style={{ fontSize: 18 }}>login</span>
            Ir a iniciar sesión
          </Link>
        )}
      </div>
    </div>
  );
}
