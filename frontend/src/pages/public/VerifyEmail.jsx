import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import AuthCard from '../../components/ui/AuthCard';

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

  return (
    <AuthCard className="text-center">
      <h1 className={`font-bold text-white mb-2 ${status === 'loading' ? 'text-22' : 'text-26'}`}>
        {status === 'loading' && 'Verificando…'}
        {status === 'success' && '¡Correo verificado!'}
        {status === 'error'   && 'Error de verificación'}
      </h1>
      <p className="text-15 text-white/60">
        {status === 'loading' && 'Un momento, por favor.'}
        {(status === 'success' || status === 'error') && message}
      </p>

      {(status === 'success' || status === 'error') && (
        <Link to="/login" className="mt-7 inline-flex items-center px-6 py-3.5 rounded-pill bg-white text-bg font-bold text-14">
          Ir a iniciar sesión
        </Link>
      )}
    </AuthCard>
  );
}
