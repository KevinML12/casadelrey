import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';

export default function Register() {
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

      {/* Mensaje: no hay registro público */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-xl bg-navy/10 flex items-center justify-center mx-auto mb-6">
            <UserPlus size={28} className="text-navy" />
          </div>
          <h1 className="text-2xl font-black text-ink mb-2">Obtener una cuenta</h1>
          <p className="text-ink-3 text-sm leading-relaxed mb-6">
            Las cuentas son creadas por líderes o administradores. Si quieres unirte, contacta a un líder de tu célula o a alguien del equipo para que te den acceso.
          </p>
          <p className="text-ink-3 text-sm mb-6">
            ¿Te interesa servir? Inscríbete como <Link to="/volunteering" className="text-blue font-medium hover:underline">voluntario</Link> y el equipo se comunicará contigo.
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 rounded-lg bg-navy text-white font-semibold hover:opacity-90 transition"
          >
            Ya tengo cuenta — Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
