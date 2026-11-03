import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import AuthCard from '../../components/ui/AuthCard';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status,  setStatus]  = useState('loading');
  const [message, setMessage] = useState('');
  const verification = useRef(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Falta el token de verificación.');
      return;
    }
    // The link is single-use. Reuse its in-flight request when React checks
    // effect cleanup, so a second response cannot overwrite a successful one.
    let active = true;
    setStatus('loading');
    if (verification.current?.token !== token) verification.current = {
      token, request: apiClient.get('/auth/verify-email', { params: { token } }),
    };
    verification.current.request
      .then(res => {
        if (!active) return;
        setStatus('success');
        setMessage(res.data?.message || 'Correo verificado correctamente.');
      })
      .catch(err => {
        if (!active) return;
        setStatus('error');
        setMessage(err.response?.data?.error || 'Token inválido o expirado.');
      });
    return () => { active = false; };
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
