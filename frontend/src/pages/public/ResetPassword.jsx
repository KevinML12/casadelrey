import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

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
    <div className="min-h-screen bg-surf flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-fade-in">

        <div className="mb-8">
          <div className="w-12 h-12 rounded-xl bg-surf-high border border-outline-var flex items-center justify-center mb-5">
            <span className="ms text-on-surf-var" style={{ fontSize: 22 }}>lock_reset</span>
          </div>
          <h1 className="text-headline-s text-on-surf font-black mb-1">Nueva contraseña</h1>
          <p className="text-body-m text-on-surf-var">Elige una contraseña segura para tu cuenta.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nueva contraseña"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            helperText="Mínimo 6 caracteres"
            required
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••"
            required
          />
          <Button type="submit" variant="filled" size="lg" className="w-full justify-center mt-2" disabled={loading}>
            {loading
              ? <><span className="ms" style={{ fontSize: 18 }}>hourglass_empty</span>Guardando...</>
              : <><span className="ms" style={{ fontSize: 18 }}>check_circle</span>Guardar contraseña</>
            }
          </Button>
        </form>
      </div>
    </div>
  );
}
