import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function ResetPassword() {
  const [password, setPassword]   = useState('');
  const [confirm,  setConfirm]    = useState('');
  const [loading,  setLoading]    = useState(false);
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
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="w-12 h-12 rounded-xl bg-card-2 border border-line flex items-center justify-center mb-5">
            <KeyRound size={22} className="text-ink-2" />
          </div>
          <h1 className="text-2xl font-black text-ink mb-1">Nueva contraseña</h1>
          <p className="text-ink-3 text-sm">Elige una contraseña segura para tu cuenta.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nueva contraseña"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            helperText="Mínimo 6 caracteres"
            required
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
          />
          <Button type="submit" variant="navy" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </Button>
        </form>
      </div>
    </div>
  );
}
