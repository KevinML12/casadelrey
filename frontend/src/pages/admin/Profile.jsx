import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Mail, Shield } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function Profile() {
  const { user } = useAuth();

  const soon = () => toast('Próximamente disponible');

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-black text-ink mb-8">Mi Perfil</h1>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-xl bg-blue/10 flex items-center justify-center">
          <span className="text-blue font-black text-xl">
            {(user?.name || user?.email || '?')[0].toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-bold text-ink">{user?.name || 'Sin nombre'}</p>
          <p className="text-sm text-ink-3">{user?.email}</p>
          <p className="text-xs text-ink-3 capitalize mt-0.5">{user?.role || 'usuario'}</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-card border border-line rounded-xl overflow-hidden mb-6">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-line">
          <Mail size={15} className="text-ink-3" />
          <div>
            <p className="text-xs text-ink-3 font-medium">Correo electrónico</p>
            <p className="text-sm text-ink font-medium mt-0.5">{user?.email || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-line">
          <Shield size={15} className="text-ink-3" />
          <div>
            <p className="text-xs text-ink-3 font-medium">Rol</p>
            <p className="text-sm text-ink font-medium mt-0.5 capitalize">{user?.role || 'usuario'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-4">
          <User size={15} className="text-ink-3" />
          <div>
            <p className="text-xs text-ink-3 font-medium">Estado de cuenta</p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-ok/10 text-ok mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-ok" /> Activa
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={soon}>Editar perfil</Button>
        <Button variant="ghost" onClick={soon}>Cambiar contraseña</Button>
      </div>
    </div>
  );
}
