import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';

export default function Profile() {
  const { user } = useAuth();
  const soon = () => toast('Próximamente disponible');

  const initial = (user?.name || user?.email || '?')[0].toUpperCase();

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-headline-s text-on-surf font-black mb-8">Mi Perfil</h1>

      {/* Avatar + info */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full bg-pri-con flex items-center justify-center shrink-0">
          <span className="text-on-pri-con text-headline-s font-black">{initial}</span>
        </div>
        <div>
          <p className="text-title-l text-on-surf font-bold">{user?.name || 'Sin nombre'}</p>
          <p className="text-body-s text-on-surf-var">{user?.email}</p>
          <p className="text-label-s text-on-surf-var capitalize mt-0.5">{user?.role || 'usuario'}</p>
        </div>
      </div>

      {/* Info list */}
      <div className="bg-surf-low border border-outline-var rounded-xl overflow-hidden mb-6">
        {[
          { icon: 'mail',   label: 'Correo electrónico', value: user?.email || '—' },
          { icon: 'shield', label: 'Rol',                value: user?.role || 'usuario', capitalize: true },
        ].map(({ icon, label, value, capitalize }) => (
          <div key={label} className="flex items-center gap-3 px-5 py-4 border-b border-outline-var last:border-0">
            <span className="ms text-on-surf-var" style={{ fontSize: 18 }}>{icon}</span>
            <div>
              <p className="text-label-s text-on-surf-var font-medium">{label}</p>
              <p className={`text-body-s text-on-surf font-medium mt-0.5 ${capitalize ? 'capitalize' : ''}`}>{value}</p>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="ms text-on-surf-var" style={{ fontSize: 18 }}>person</span>
          <div>
            <p className="text-label-s text-on-surf-var font-medium">Estado de cuenta</p>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-label-s font-medium bg-ter-con text-on-ter-con mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-ter" />
              Activa
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="tonal" onClick={soon}>
          <span className="ms" style={{ fontSize: 16 }}>edit</span>
          Editar perfil
        </Button>
        <Button variant="outlined" onClick={soon}>
          <span className="ms" style={{ fontSize: 16 }}>lock</span>
          Cambiar contraseña
        </Button>
      </div>
    </div>
  );
}
