import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import AuthCard from '../../components/ui/AuthCard';
import { Icon } from '../../components/ui/Glass';

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
        <div className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center mb-5">
          <Icon name="lock" className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-[22px] font-bold text-white mb-1.5">Nueva contraseña</h1>
        <p className="text-[15px] text-white/60">Elige una contraseña segura para tu cuenta.</p>
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
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-pill bg-white text-bg text-[15px] font-bold disabled:opacity-50 mt-2"
        >
          {loading ? 'Guardando…' : 'Guardar contraseña'}
        </motion.button>
      </form>
    </AuthCard>
  );
}
