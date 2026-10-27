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
import { PRESS_PRIMARY } from '../../lib/motion';
import SectionBg from '../../components/ui/SectionBg';

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
  { text: 'Llenas el formulario con tus datos' },
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
    <main className="relative w-full min-h-screen overflow-hidden">
      <PageHero
        title="Conéctate"
        subtitle="Cuéntanos un poco de ti — alguien de nuestro equipo te va a escribir para darte la bienvenida."
        photoSlot="hero_conectate"
        photoFallback="/images/bg-ministerios.jpg"
      />

      <section className="relative overflow-hidden py-16 md:py-24">
        <SectionBg src="/images/components/bg_conectate.jpg" />
        <div className="relative z-10 px-6 max-w-6xl mx-auto grid lg:grid-cols-[0.85fr_1.15fr] gap-10 lg:gap-20 items-start">
          <Reveal className="lg:sticky lg:top-28">
            <h2 className="text-d2 text-white">Queremos conocerte.</h2>
            <p className="mt-5 text-17 text-white/80 leading-relaxed max-w-md">
              Ya sea tu primera visita o un nuevo comienzo, hay un lugar para ti en esta casa.
            </p>
            <ol className="mt-9 space-y-0">
              {STEPS.map((s, i) => (
                <li key={s.text} className="relative flex gap-5 pb-8 last:pb-0">
                  {i < STEPS.length - 1 && <span className="absolute left-[17px] top-9 bottom-0 w-px bg-white/20" aria-hidden="true" />}
                  <span className="relative shrink-0 grid place-items-center w-9 h-9 rounded-full liquid-glass text-white text-14 font-bold" aria-hidden="true">{i + 1}</span>
                  <p className="text-15 text-white/80 leading-relaxed pt-1 max-w-xs">{s.text}</p>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="glass-light rounded-[16px] p-7 md:p-9">
              {done ? (
                <div className="text-center py-8" role="status">
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
                    {/* En caja normal, no versales: micro-mayúsculas con
                        tracking encima de un bloque es la fórmula del eyebrow
                        que el sitio ya desterró, y a 12px las versales piden
                        MÁS aire del que caben. Es una pregunta, que se lea
                        como una pregunta. */}
                    <p className="text-13 font-semibold text-bg/60 mb-3">
                      ¿Qué te trae por aquí? <span className="text-rose">*</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="group" aria-label="¿Qué te trae por aquí?">
                      {CATEGORIES.map((c) => {
                        const selected = form.category === c.value;
                        return (
                          <button
                            key={c.value}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setForm((p) => ({ ...p, category: c.value }))}
                            className={`focus-ring flex flex-col items-center text-center gap-2 px-4 py-5 rounded-[12px] border-2 transition-all ${
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
                    <p className="text-13 font-semibold text-bg/60 mt-5 mb-3">Tus datos</p>
                    <div className="space-y-4">
                      <FieldLight name="name" autoComplete="name" label="Nombre *" value={form.name} onChange={set('name')} placeholder="Tu nombre completo" required />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FieldLight name="phone" type="tel" autoComplete="tel" label="Teléfono *" value={form.phone} onChange={set('phone')} placeholder="+502 …" required />
                        <FieldLight name="email" autoComplete="email" label="Correo" type="email" value={form.email} onChange={set('email')} placeholder="Opcional" />
                      </div>

                      <div>
                        <p className="block text-12 font-bold text-bg/60 mb-2">¿Cómo nos conociste?</p>
                        <div className="flex flex-wrap gap-2" role="group" aria-label="¿Cómo nos conociste?">
                          {HOW_FOUND.map((h) => (
                            <button
                              key={h.value}
                              type="button"
                              aria-pressed={form.how_found === h.value}
                              onClick={() => setForm((p) => ({ ...p, how_found: p.how_found === h.value ? '' : h.value }))}
                              className={`focus-ring px-3.5 py-2 rounded-full text-13 font-semibold border transition-colors ${
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
                    <p className="text-13 text-rose" role="alert">
                      {error}
                    </p>
                  )}

                  {/* PRESS_PRIMARY: es LA acción de la pantalla, así que usa el
                      único press que sale del plano. El scale 1.02 al hover que
                      tenía antes era un gesto inventado aquí mismo, distinto al
                      de los demás CTA del sitio. */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    {...PRESS_PRIMARY}
                    className="w-full flex items-center justify-center gap-2 h-12 rounded-full bg-bg text-white text-15 font-bold disabled:opacity-50"
                  >
                    {loading ? 'Enviando…' : 'Enviar'}
                  </motion.button>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
