import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageHero from '../../components/layout/PageHero';
import ParallaxImg from '../../components/ui/ParallaxImg';
import Reveal, { RevealList, RevealItem } from '../../components/ui/Reveal';
import Tilt from '../../components/ui/Tilt';
import { Icon, Eyebrow } from '../../components/ui/Glass';
import apiClient from '../../lib/apiClient';
import { useSitePhoto } from '../../lib/feed';
import toast from 'react-hot-toast';

const PRESS = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.96 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
};

// Los 10 departamentos reales de voluntariado (CONTEXTO_IGLESIA jul-2026)
const AREAS = [
  { value: 'alabanza',               icon: 'mic',         title: 'Alabanza',                desc: 'Lidera la adoración y la música en los servicios y células.' },
  { value: 'danza',                  icon: 'spark',       title: 'Danza',                   desc: 'Expresa la adoración a través del movimiento en los servicios.' },
  { value: 'servidores',             icon: 'heart',       title: 'Servidores',              desc: 'Recibe a cada persona; cuida la recepción y la limpieza de la iglesia.' },
  { value: 'protocolo',              icon: 'crown',       title: 'Protocolo',               desc: 'Atención VIP a políticos, pastores invitados y personas de alto nivel.' },
  { value: 'pancartas',              icon: 'flag',        title: 'Pancartas',               desc: 'Porta y coordina las pancartas durante los días de culto.' },
  { value: 'maestros_ninos',         icon: 'book',        title: 'Maestros de Niños',       desc: 'Enseña e inspira a los más pequeños con creatividad y amor.' },
  { value: 'tecnicos_audiovisuales', icon: 'headphones',  title: 'Técnicos Audiovisuales',  desc: 'Sonido, proyección y streaming para que el servicio llegue más lejos.' },
  { value: 'multimedia',             icon: 'camera',      title: 'Multimedia',              desc: 'Diseño gráfico, video y redes sociales para la comunicación de la iglesia.' },
  { value: 'oracion',                icon: 'pray',        title: 'Oración',                 desc: 'Intercede por la iglesia, los miembros y las necesidades de la ciudad.' },
  { value: 'logistica',              icon: 'box',         title: 'Logística',               desc: 'Coordina recursos, transporte y organización de eventos y servicios.' },
];

function VolunteerForm({ preselected, onClearPreselected }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: preselected || '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (preselected) {
      setForm(p => ({ ...p, department: preselected }));
      onClearPreselected?.();
    }
  }, [preselected]);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Nombre y correo son requeridos');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/volunteer/register', form);
      setSent(true);
      toast.success('Gracias — nos comunicaremos contigo pronto.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al enviar. Intenta de nuevo.');
    } finally { setSubmitting(false); }
  };

  if (sent) {
    return (
      <div className="text-center py-10">
        <div className="w-14 h-14 rounded-full bg-bg/8 border border-bg/12 flex items-center justify-center mx-auto mb-5">
          <Icon name="check" className="w-6 h-6 text-bg" />
        </div>
        <p className="text-[18px] font-bold text-bg">Inscripción recibida</p>
        <p className="text-[14px] text-bg/55 mt-1.5">Nuestro equipo se pondrá en contacto contigo.</p>
      </div>
    );
  }

  const selectedArea = AREAS.find(a => a.value === form.department);

  // Formulario en tarjeta glass-light (blanca) -- .input-squircle es del
  // publico oscuro, aca usamos .input-light (el mismo campo claro del
  // panel admin, funciona igual de bien fuera de .admin-light).
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-[13px] font-semibold text-bg/60 mb-2">Nombre completo</span>
          <input className="input-light" value={form.name} onChange={set('name')} required />
        </label>
        <label className="block">
          <span className="block text-[13px] font-semibold text-bg/60 mb-2">Correo electrónico</span>
          <input type="email" className="input-light" value={form.email} onChange={set('email')} required />
        </label>
      </div>
      <label className="block">
        <span className="block text-[13px] font-semibold text-bg/60 mb-2">Teléfono (opcional)</span>
        <input type="tel" className="input-light" value={form.phone} onChange={set('phone')} />
      </label>

      <label className="block">
        <span className="block text-[13px] font-semibold text-bg/60 mb-2">Departamento de interés</span>
        <select
          className="input-light w-full appearance-none cursor-pointer"
          value={form.department}
          onChange={set('department')}
        >
          <option value="">Selecciona un departamento</option>
          {AREAS.map(a => <option key={a.value} value={a.value}>{a.title}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="block text-[13px] font-semibold text-bg/60 mb-2">Mensaje (opcional)</span>
        <textarea
          rows={3}
          className="input-light w-full resize-none"
          value={form.message}
          onChange={set('message')}
          placeholder="Cuéntanos por qué quieres servir..."
        />
      </label>

      <motion.button
        type="submit"
        {...PRESS}
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2.5 rounded-pill bg-bg text-white px-6 py-4 text-[15px] font-bold focus-ring disabled:opacity-60 shadow-card hover:opacity-90"
      >
        {submitting ? 'Enviando…' : selectedArea ? `Enviar inscripción a ${selectedArea.title}` : 'Enviar inscripción'}
        {!submitting && <Icon name="arrow" className="w-4 h-4" stroke={2} />}
      </motion.button>
    </form>
  );
}

export default function VolunteeringPage() {
  const [selected, setSelected] = useState('');
  const formRef = useRef(null);
  // Administrable desde /admin/site-photos (antes ruta hardcodeada — el
  // admin no podía cambiarla sin deploy). El local queda de fallback.
  const sectionImg = useSitePhoto('voluntariado_seccion', '/images/nosotros/servidores.jpg');

  const handleAreaClick = (value) => {
    setSelected(value);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  return (
    <main className="min-h-screen bg-bg text-white">
      <PageHero
        eyebrow="Sirve con tus talentos"
        title="Voluntariado"
        subtitle="Cada persona tiene un lugar. Únete a los más de 90 voluntarios que ya sirven en 10 departamentos."
        photoSlot="hero_voluntariado"
        photoFallback="/images/bg-ministerios.jpg"
      />

      <section className="relative py-4 pb-24 overflow-hidden">
        <ParallaxImg src={sectionImg} alt="" className="opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/55 to-bg" />

        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <Reveal className="mb-10 text-center">
            <Eyebrow>Departamentos</Eyebrow>
            <h2 className="display-mega text-white mt-4" style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3rem)' }}>
              ¿Dónde quieres servir?
            </h2>
            <p className="mt-4 text-[15.5px] text-white/70">Toca un área para preseleccionarla en el formulario.</p>
          </Reveal>

          <RevealList className="grid sm:grid-cols-2 gap-4 mb-16">
            {AREAS.map(({ value, icon, title, desc }) => {
              const isSelected = selected === value;
              return (
                <RevealItem key={value}>
                  <Tilt
                    as="button"
                    type="button"
                    onClick={() => handleAreaClick(value)}
                    max={4}
                    glass="standard"
                    className={`w-full h-full flex items-start gap-4 p-6 rounded-[20px] text-left glass-light transition-colors ${
                      isSelected ? 'ring-2 ring-bg' : 'hover:bg-bg/5'
                    }`}
                  >
                    <div className={`grid place-items-center w-12 h-12 rounded-full shrink-0 transition-colors ${
                      isSelected ? 'bg-bg text-white' : 'bg-bg/8 text-bg/70 border border-bg/12'
                    }`}>
                      <Icon name={icon} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[16.5px] font-bold text-bg tracking-tight mb-1">{title}</h3>
                      <p className="text-[13.5px] text-bg/50 leading-relaxed">{desc}</p>
                    </div>
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-bg text-white flex items-center justify-center shrink-0">
                        <Icon name="check" className="w-3.5 h-3.5" stroke={2.4} />
                      </span>
                    )}
                  </Tilt>
                </RevealItem>
              );
            })}
          </RevealList>

          <Reveal delay={0.1}>
            <div ref={formRef} className="glass-light rounded-[28px] p-8 md:p-11 scroll-mt-24">
              <span className="text-[11px] font-bold uppercase tracking-widest text-bg/45">Aplicación</span>
              <h3 className="text-[26px] font-bold text-bg tracking-tight mt-3 mb-2">¿Listo para servir?</h3>
              <p className="text-[14.5px] text-bg/55 mb-8 leading-relaxed max-w-lg">
                Completa el formulario y nuestro equipo se comunicará contigo para orientarte
                en tu primer paso como voluntario.
              </p>
              <VolunteerForm preselected={selected} onClearPreselected={() => setSelected('')} />
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
