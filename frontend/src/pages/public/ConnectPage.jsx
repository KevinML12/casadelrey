// ============================================================
//  ConnectPage — tarjeta de conexión: un visitante nuevo se registra
//  él mismo (público, sin cuenta) y el equipo de seguimiento lo
//  contacta. POST /connect-cards. Ver docs/DISENO_LIQUID_GLASS.md.
// ============================================================
import { useState } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../../lib/apiClient';
import { FieldLight } from '../../components/ui/Glass';
import Reveal from '../../components/ui/Reveal';
import PageHero from '../../components/layout/PageHero';

const CATEGORIES = [
  { value: 'primera_vez',  label: 'Es mi primera vez',           helper: 'Quiero conocer la iglesia' },
  { value: 'reconciliado', label: 'Vuelvo después de un tiempo', helper: 'Ya fui parte antes' },
  { value: 'busco_celula', label: 'Busco una célula',            helper: 'Quiero unirme a un grupo' },
];

const HOW_FOUND = [
  { value: 'invitacion', label: 'Invitación de un amigo' },
  { value: 'redes',      label: 'Redes sociales' },
  { value: 'publicidad', label: 'Publicidad' },
  { value: 'otro',       label: 'Otro' },
];

// Pasos reales del flujo (no ilustrativos): ConnectCard entra al panel
// admin/líder, se asigna a un líder real y avanza de estado hasta el
// contacto -- ver AdminConnectCards.jsx / LeaderConnectCards.jsx.
const STEPS = [
  { text: 'Llenas el formulario -- toma menos de 2 minutos' },
  { text: 'Un líder de nuestro equipo revisa tu información' },
  { text: 'Te contactamos por WhatsApp o llamada para conocerte' },
];

export default function ConnectPage() {
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
      <PageHero
        eyebrow="Bienvenido"
        title="Conéctate"
        subtitle="Cuéntanos un poco de ti — alguien de nuestro equipo te va a escribir para darte la bienvenida."
        photoSlot="hero_conectate"
        photoFallback="/images/bg-ministerios.jpg"
      />

      <div className="relative z-10 pb-24 px-6 max-w-xl mx-auto">
        {/* Qué sigue -- el flujo real (ConnectCard -> panel -> líder
            asignado), no un adorno; le da confianza a alguien que nunca
            ha llenado este formulario antes. Los 3 pasos van conectados
            por una línea (desktop) para que se lean como UN proceso, no
            como 3 tarjetas sueltas sin relación entre sí. */}
        <Reveal delay={0.06} className="mb-10">
          <ol className="relative grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-0">
            {/* Línea conectora entre los 3 pasos, solo desde sm (en una
                sola fila) -- pasa por detrás de los círculos numerados. */}
            <div className="hidden sm:block absolute top-[34px] left-[calc(16.66%+14px)] right-[calc(16.66%+14px)] h-px bg-bg/15" aria-hidden="true" />
            {STEPS.map((s, i) => (
              <li key={s.text} className="relative flex flex-col items-center text-center sm:px-3">
                <span className="relative z-10 shrink-0 grid place-items-center w-9 h-9 rounded-full bg-bg text-white text-14 font-bold shadow-card mb-3">
                  {i + 1}
                </span>
                <p className="text-13 text-white/70 leading-snug max-w-[15rem]">{s.text}</p>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="glass-light rounded-[28px] p-7 md:p-9">
            {done ? (
              <div className="text-center py-8">
                <h3 className="text-24 text-bg font-bold mb-2">¡Gracias por registrarte!</h3>
                <p className="text-14 text-bg/60 max-w-sm mx-auto leading-relaxed">
                  Alguien de nuestro equipo te contactará pronto. Nos alegra que estés aquí.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-7">
                {/* La pregunta de "por qué" va primero -- es mas natural
                    empezar una conversacion asi que con un formulario de
                    campos; tambien es la que mas cambia el seguimiento que
                    hace el lider, tiene sentido que sea lo primero que se
                    decide. Tarjetas en vez de una lista de botones finitos
                    -- eso se leia como una version fea de un <select>. */}
                <div>
                  <p className="text-12 font-bold text-bg/60 mb-3 uppercase tracking-wide">
                    ¿Qué te trae por aquí? <span className="text-rose">*</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {CATEGORIES.map((c) => {
                      const selected = form.category === c.value;
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, category: c.value }))}
                          className={`flex flex-col items-center text-center gap-2 px-4 py-5 rounded-[18px] border-2 transition-all ${
                            selected
                              ? 'bg-bg/10 border-bg shadow-card'
                              : 'bg-bg/[0.03] border-bg/10 hover:border-bg/25 hover:bg-bg/[0.06]'
                          }`}
                        >
                          <span className={`text-14 font-bold ${selected ? 'text-bg' : 'text-bg/80'}`}>{c.label}</span>
                          <span className="text-11 text-bg/50 leading-snug">{c.helper}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Datos de contacto agrupados bajo su propio encabezado --
                    separa visualmente "la decision" de "como te contactamos",
                    en vez de que todo sea un solo bloque de campos. */}
                <div className="pt-1 border-t border-bg/10">
                  <p className="text-12 font-bold text-bg/60 mt-5 mb-3 uppercase tracking-wide">Tus datos</p>
                  <div className="space-y-4">
                    <FieldLight label="Nombre *" value={form.name} onChange={set('name')} placeholder="Tu nombre completo" required />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FieldLight label="Teléfono *" value={form.phone} onChange={set('phone')} placeholder="+502 …" required />
                      <FieldLight label="Correo" type="email" value={form.email} onChange={set('email')} placeholder="Opcional" />
                    </div>

                    <div>
                      <label className="block text-12 font-bold text-bg/60 mb-2">¿Cómo nos conociste?</label>
                      <div className="flex flex-wrap gap-2">
                        {HOW_FOUND.map((h) => (
                          <button
                            key={h.value}
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, how_found: p.how_found === h.value ? '' : h.value }))}
                            className={`px-3.5 py-2 rounded-full text-13 font-semibold border transition-colors ${
                              form.how_found === h.value
                                ? 'bg-bg text-white border-bg'
                                : 'bg-bg/[0.03] text-bg/65 border-bg/12 hover:bg-bg/[0.06]'
                            }`}
                          >
                            {h.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="text-13 text-rose">
                    {error}
                  </p>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-center gap-2 h-12 rounded-full bg-bg text-white text-15 font-bold disabled:opacity-50"
                >
                  {loading ? 'Enviando…' : 'Enviar'}
                </motion.button>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </main>
  );
}
