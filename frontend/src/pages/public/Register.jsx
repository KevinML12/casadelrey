import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Las contraseñas no coinciden'); return; }
    if (form.password.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return; }
    const { success, error } = await register(form.email, form.password, form.name);
    if (success) { toast.success('¡Cuenta creada!'); navigate('/admin'); }
    else toast.error(error);
  };

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Panel decorativo */}
      <div className="hidden lg:flex w-1/2 bg-navy items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-gold font-black text-2xl">CR</span>
          </div>
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Únete a<br />
            <span className="text-gold">la familia</span>
          </h2>
          <p className="text-white/50 text-sm leading-relaxed max-w-xs">
            Forma parte de una comunidad que te espera con los brazos abiertos.
          </p>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-ink mb-1">Crear cuenta</h1>
            <p className="text-ink-3 text-sm">Únete a la comunidad de Casa del Rey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nombre completo" type="text" value={form.name} onChange={set('name')} required />
            <Input label="Correo electrónico" type="email" value={form.email} onChange={set('email')} required />
            <Input label="Contraseña" type="password" value={form.password} onChange={set('password')} helperText="Mínimo 6 caracteres" required />
            <Input label="Confirmar contraseña" type="password" value={form.confirm} onChange={set('confirm')} required />

            <Button type="submit" variant="navy" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-3">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-blue font-medium hover:underline">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
