import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import AuthCard from '../../components/ui/AuthCard';
import { Icon } from '../../components/ui/Glass';

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

  const iconName = status === 'success' ? 'mail' : status === 'error' ? 'close' : 'spark';

  return (
    <AuthCard className="text-center">
      <div className="w-16 h-16 rounded-full bg-white/10 border border-white/15 flex items-center justify-center mx-auto mb-5">
        <Icon name={iconName} className={`w-7 h-7 text-white ${status === 'loading' ? 'animate-spin' : ''}`} />
      </div>
      <h1 className="text-22 font-bold text-white mb-2">
        {status === 'loading' && 'Verificando…'}
        {status === 'success' && '¡Correo verificado!'}
        {status === 'error'   && 'Error de verificación'}
      </h1>
      <p className="text-15 text-white/60">
        {status === 'loading' && 'Un momento, por favor.'}
        {(status === 'success' || status === 'error') && message}
      </p>

      {(status === 'success' || status === 'error') && (
        <Link to="/login" className="mt-7 inline-flex items-center gap-2.5 px-6 py-3.5 rounded-pill bg-white text-bg font-bold text-14">
          Ir a iniciar sesión
          <Icon name="arrow" className="w-4 h-4" stroke={2} />
        </Link>
      )}
    </AuthCard>
  );
}
