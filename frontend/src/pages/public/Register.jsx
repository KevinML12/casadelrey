import { Link } from 'react-router-dom';

export default function Register() {
  return (
    <div className="min-h-screen bg-surf flex">

      {/* ── Panel izquierdo — decorativo, solo desktop ──────────── */}
      <div className="hidden lg:flex w-1/2 hero-surf items-center justify-center p-16 relative overflow-hidden">
        <div className="hero-grid" />
        <div className="absolute pointer-events-none" style={{
          left: -100, top: -100, width: 500, height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(21,101,192,.25) 0%, transparent 65%)',
        }} />
        <div className="relative z-10 text-center">
          <div className="inline-block rounded-xl px-6 py-4 mb-8" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
            <img src="/logo.png" alt="Casa del Rey" className="h-24 w-auto object-contain mx-auto"
              style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
          <h2 className="text-display-s text-white mb-4 leading-tight">
            Únete a<br />
            <span style={{ color: '#A4C8FF' }}>la familia</span>
          </h2>
          <p className="text-body-m" style={{ color: 'rgba(255,255,255,.5)' }}>
            Forma parte de una comunidad<br />que te espera con los brazos abiertos.
          </p>
        </div>
      </div>

      {/* ── Panel derecho ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center animate-fade-in">

          {/* Logo mobile */}
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="rounded-lg px-3 py-2" style={{ background: '#0D1B5E' }}>
              <img src="/logo.png" alt="Casa del Rey" className="h-10 w-auto object-contain"
                style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
          </div>

          <div className="w-14 h-14 rounded-xl bg-pri-con flex items-center justify-center mx-auto mb-6">
            <span className="ms text-on-pri-con" style={{ fontSize: 28 }}>group_add</span>
          </div>

          <h1 className="text-headline-s text-on-surf font-black mb-3">Obtener una cuenta</h1>
          <p className="text-body-m text-on-surf-var leading-relaxed mb-6">
            Las cuentas son creadas por líderes o administradores. Si quieres unirte, contacta a un líder de tu célula o a alguien del equipo para que te den acceso.
          </p>
          <p className="text-body-s text-on-surf-var mb-8">
            ¿Te interesa servir?{' '}
            <Link to="/volunteering" className="text-pri font-semibold hover:underline">
              Inscríbete como voluntario
            </Link>{' '}
            y el equipo se comunicará contigo.
          </p>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-pri text-on-pri text-label-l font-semibold hover:opacity-90 transition-opacity"
          >
            <span className="ms" style={{ fontSize: 18 }}>login</span>
            Ya tengo cuenta — Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
