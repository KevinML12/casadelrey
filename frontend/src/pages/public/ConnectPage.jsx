// ============================================================
//  ConnectPage — tarjeta de conexión: un visitante nuevo se registra
//  él mismo (público, sin cuenta) y el equipo de seguimiento lo
//  contacta. POST /connect-cards. Ver docs/DISENO_LIQUID_GLASS.md.
// ============================================================
import { useState } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../../lib/apiClient';
import { Icon, Eyebrow } from '../../components/ui/Glass';
import Reveal from '../../components/ui/Reveal';
import ParallaxImg from '../../components/ui/ParallaxImg';
import { useSitePhoto } from '../../lib/feed';

// .input-light (index.css): fondo blanco 75% opaco -- suficiente para
// tapar el fondo nativo OSCURO que el navegador pinta en inputs/selects
// cuando color-scheme:dark esta activo en el <html> (todo el sitio
// publico). Un bg-bg/4 (4% de opacidad) no lo tapa: el campo se ve
// gris oscuro solido en vez de claro -- bug real encontrado por el
// usuario en produccion.
const fieldCls = 'input-light';

const CATEGORIES = [
  { value: 'primera_vez',  label: 'Es mi primera vez',        icon: 'spark' },
  { value: 'reconciliado', label: 'Vuelvo después de un tiempo', icon: 'heart' },
  { value: 'busco_celula', label: 'Busco una célula',         icon: 'users' },
];

const HOW_FOUND = [
  { value: 'invitacion', label: 'Invitación de un amigo' },
  { value: 'redes',      label: 'Redes sociales' },
  { value: 'publicidad', label: 'Publicidad' },
  { value: 'otro',       label: 'Otro' },
];

export default function ConnectPage() {
  const heroImg = useSitePhoto('hero_conectate', '/images/bg-ministerios.jpg');
  const [form, setForm] = useState({ name: '', phone: '', email: '', category: '', how_found: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.category) {
      setError('Nombre, teléfono y una opción de abajo son obligatorios.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/connect-cards', form);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo enviar. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative bg-bg w-full min-h-screen overflow-hidden">
      <ParallaxImg src={heroImg} alt="" className="opacity-45" />
      <div className="absolute inset-0 bg-gradient-to-b from-bg/75 via-bg/55 to-bg pointer-events-none" />

      <div className="relative z-10 pt-40 pb-24 px-6 max-w-xl mx-auto">
        <Reveal className="text-center mb-10">
          <Eyebrow>Bienvenido</Eyebrow>
          <h1 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(2.4rem, 6vw, 3.6rem)' }}>
            Conéctate
          </h1>
          <p className="mt-6 text-[16px] text-white/70">
            Cuéntanos un poco de ti — alguien de nuestro equipo te va a escribir
            para darte la bienvenida.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="glass-light rounded-[28px] p-7 md:p-9">
            {done ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-bg/8 border border-bg/12 flex items-center justify-center mx-auto mb-5">
                  <Icon name="check" className="w-7 h-7 text-bg" stroke={2} />
                </div>
                <h3 className="text-[20px] text-bg font-bold mb-2">¡Gracias por registrarte!</h3>
                <p className="text-[14px] text-bg/60 max-w-sm mx-auto leading-relaxed">
                  Alguien de nuestro equipo te contactará pronto. Nos alegra que estés aquí.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[12px] font-bold text-bg/60 mb-1.5">
                    Nombre <span className="text-rose">*</span>
                  </label>
                  <input value={form.name} onChange={set('name')} className={fieldCls} placeholder="Tu nombre completo" required />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-bg/60 mb-1.5">
                      Teléfono <span className="text-rose">*</span>
                    </label>
                    <input value={form.phone} onChange={set('phone')} className={fieldCls} placeholder="+502 …" required />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-bg/60 mb-1.5">Correo</label>
                    <input type="email" value={form.email} onChange={set('email')} className={fieldCls} placeholder="Opcional" />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-bg/60 mb-2.5">
                    ¿Qué te trae por aquí? <span className="text-rose">*</span>
                  </label>
                  <div className="flex flex-col gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, category: c.value }))}
                        className={`flex items-center gap-3 px-4 py-3 rounded-[14px] border text-left transition-all ${
                          form.category === c.value
                            ? 'bg-bg/10 border-bg/40 text-bg'
                            : 'bg-bg/[0.03] border-bg/10 text-bg/65 hover:bg-bg/[0.06]'
                        }`}
                      >
                        <Icon name={c.icon} className="w-4 h-4 shrink-0" />
                        <span className="text-[14px] font-medium">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-bg/60 mb-1.5">¿Cómo nos conociste?</label>
                  <select value={form.how_found} onChange={set('how_found')} className={fieldCls}>
                    <option value="">Selecciona una opción</option>
                    {HOW_FOUND.map((h) => (
                      <option key={h.value} value={h.value}>{h.label}</option>
                    ))}
                  </select>
                </div>

                {error && (
                  <p className="text-[13px] text-rose flex items-center gap-1.5">
                    <Icon name="spark" className="w-3.5 h-3.5" />
                    {error}
                  </p>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-center gap-2 h-12 rounded-full bg-bg text-white text-[15px] font-bold disabled:opacity-50"
                >
                  {loading ? 'Enviando…' : (
                    <>
                      Enviar
                      <Icon name="arrow" className="w-4 h-4" stroke={2} />
                    </>
                  )}
                </motion.button>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </main>
  );
}
