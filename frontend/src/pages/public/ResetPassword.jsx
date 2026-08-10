import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import AuthCard from '../../components/ui/AuthCard';
import { GlassField, GlassButton } from '../../components/ui/Glass';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const { resetPassword } = useAuth();
  const { token }  = useParams();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Las contraseñas no coinciden'); return; }
    if (password.length < 6)  { toast.error('Mínimo 6 caracteres'); return; }
    setLoading(true);
    const { success, error } = await resetPassword(token, password);
    setLoading(false);
    if (success) { toast.success('Contraseña actualizada'); navigate('/login'); }
    else toast.error(error);
  };

  return (
    <AuthCard>
      <div className="mb-8">
        <h1 className="text-22 font-bold text-white mb-1.5">Nueva contraseña</h1>
        <p className="text-15 text-white/60">Elige una contraseña segura para tu cuenta.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <GlassField
          label="Nueva contraseña"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          helperText="Mínimo 6 caracteres"
          required
        />
        <GlassField
          label="Confirmar contraseña"
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="••••••••"
          required
        />
        <GlassButton
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-full justify-center mt-2"
        >
          {loading ? 'Guardando…' : 'Guardar contraseña'}
        </GlassButton>
      </form>
    </AuthCard>
  );
}
