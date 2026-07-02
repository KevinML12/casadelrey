import { useState, useRef, useEffect } from 'react';
import PageHero from '../../components/layout/PageHero';
import Input from '../../components/ui/Input';
import { Textarea, Select } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';

const AREAS = [
  { value: 'alabanza',               icon: 'mic',              title: 'Alabanza',                desc: 'Lidera la adoración y la música en los servicios y células.' },
  { value: 'danza',                  icon: 'directions_run',   title: 'Danza',                   desc: 'Expresa la adoración a través del movimiento en los servicios.' },
  { value: 'servidores',             icon: 'waving_hand',      title: 'Servidores',              desc: 'Recibe a cada persona, cuida la recepción y la limpieza de la Iglesia.' },
  { value: 'protocolo',              icon: 'star',             title: 'Protocolo',               desc: 'Atención VIP a políticos, pastores invitados y personas de alto nivel.' },
  { value: 'pancartas',              icon: 'flag',             title: 'Pancartas',               desc: 'Porta y coordina las pancartas durante los días de culto.' },
  { value: 'maestros_ninos',         icon: 'child_care',       title: 'Maestros de Niños',       desc: 'Enseña e inspira a los más pequeños con creatividad y amor.' },
  { value: 'tecnicos_audiovisuales', icon: 'spatial_audio',    title: 'Técnicos Audiovisuales',  desc: 'Sonido, proyección y streaming para que el servicio llegue más lejos.' },
  { value: 'multimedia',             icon: 'video_camera_front', title: 'Multimedia',            desc: 'Diseño gráfico, video y redes sociales para la comunicación de la Iglesia.' },
  { value: 'oracion',                icon: 'self_improvement', title: 'Oración',                 desc: 'Intercede por la iglesia, los miembros y las necesidades de la ciudad.' },
  { value: 'logistica',              icon: 'local_shipping',   title: 'Logística',               desc: 'Coordina recursos, transporte y organización de eventos y servicios.' },
];

function VolunteerForm({ preselected, onClearPreselected }) {
  const [form,       setForm]       = useState({ name: '', email: '', phone: '', department: preselected || '', message: '' });

  useEffect(() => {
    if (preselected) {
      setForm(p => ({ ...p, department: preselected }));
      onClearPreselected?.();
    }
  }, [preselected]);
  const [submitting, setSubmitting] = useState(false);
  const [sent,       setSent]       = useState(false);

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
      toast.success('¡Gracias! Nos comunicaremos contigo pronto.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al enviar. Intenta de nuevo.');
    } finally { setSubmitting(false); }
  };

  if (sent) {
    return (
      <div className="text-center py-8 bg-ter-con border border-outline-var rounded-xl animate-fade-in">
        <span className="ms text-on-ter-con mb-3 block" style={{ fontSize: 40 }}>check_circle</span>
        <p className="text-title-s text-on-ter-con font-semibold">¡Inscripción recibida!</p>
        <p className="text-body-s text-on-ter-con/80 mt-1">Nuestro equipo se pondrá en contacto contigo.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Nombre completo" value={form.name}  onChange={set('name')}  required />
      <Input label="Correo electrónico" type="email" value={form.email} onChange={set('email')} required />
      <Input label="Teléfono" type="tel" value={form.phone} onChange={set('phone')} placeholder="Opcional" />
      <Select
        label="Departamento de interés"
        placeholder="Selecciona un departamento"
        value={form.department}
        onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
        options={AREAS.map(a => ({ value: a.value, label: a.title }))}
      />
      <Textarea label="Mensaje" rows={3} value={form.message} onChange={set('message')}
        placeholder="Cuéntanos por qué quieres servir..." />
      <Button type="submit" variant="filled" size="lg" className="w-full justify-center" disabled={submitting}>
        {submitting
          ? <><span className="ms" style={{ fontSize: 18 }}>hourglass_empty</span>Enviando...</>
          : <><span className="ms" style={{ fontSize: 18 }}>send</span>Enviar inscripción</>
        }
      </Button>
    </form>
  );
}

export default function VolunteeringPage() {
  const [selected, setSelected] = useState('');
  const formRef = useRef(null);

  const handleAreaClick = (value) => {
    setSelected(value);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  return (
    <main className="min-h-screen bg-bg text-white relative overflow-hidden flex flex-col">
      {/* Background & Blobs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-celeste/20 rounded-full mix-blend-screen filter blur-[120px] opacity-60 animate-blob" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-amber/20 rounded-full mix-blend-screen filter blur-[150px] opacity-50 animate-blob" style={{ animationDelay: '2s' }} />
      
      <img src="/images/bg-hero.jpg" alt="Voluntariado" className="absolute inset-0 w-full h-full object-cover opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-bg/10" />

      <PageHero icon="handshake" title="Voluntariado" subtitle="Sirve con tus talentos y haz la diferencia en la comunidad." />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-16 w-full">
        <div className="max-w-3xl mx-auto">

          <div className="mb-6 text-center">
            <h2 className="display-mega text-white mb-2" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>¿Dónde quieres servir?</h2>
            <p className="text-[16px] text-white/70">Toca un área para seleccionarla en el formulario.</p>
          </div>

          {/* Areas list */}
          <div className="flex flex-col gap-4 mb-16">
            {AREAS.map(({ value, icon, title, desc }) => (
              <button key={value} type="button" onClick={() => handleAreaClick(value)}
                className={`w-full flex items-center justify-between gap-4 p-5 rounded-[24px] text-left transition-all card-spring ${
                  selected === value ? 'liquid-glass bg-white/10 border-celeste shadow-pri' : 'liquid-glass hover:bg-white/5 border-white/10'
                }`}>
                <div className="flex items-center gap-4">
                  <div className={`grid place-items-center w-12 h-12 rounded-full shrink-0 transition-colors ${selected === value ? 'bg-celeste text-white shadow-pri' : 'bg-white/10 text-white/70'}`}>
                    <span className="material-symbols-rounded">{icon}</span>
                  </div>
                  <div>
                    <h3 className={`text-[18px] font-bold tracking-tightish mb-0.5 ${selected === value ? 'text-white' : 'text-white/90'}`}>{title}</h3>
                    <p className={`text-[14px] leading-relaxed ${selected === value ? 'text-white/80' : 'text-white/50'}`}>{desc}</p>
                  </div>
                </div>
                <span className={`material-symbols-rounded shrink-0 transition-transform ${selected === value ? 'text-celeste scale-110' : 'text-white/30'}`} style={{ fontSize: 24 }}>
                  {selected === value ? 'check_circle' : 'chevron_right'}
                </span>
              </button>
            ))}
          </div>

          {/* Formulario */}
          <div ref={formRef} className="liquid-glass rounded-[32px] p-8 md:p-10 scroll-mt-24 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-celeste/10 rounded-full mix-blend-screen filter blur-[100px]" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="h-px w-10 bg-gradient-to-r from-celeste to-transparent" />
                <span className="text-celeste text-[11px] font-extrabold uppercase tracking-widest">
                  Aplicación
                </span>
              </div>
              <h3 className="display-mega text-white mb-2" style={{ fontSize: '2rem' }}>¿Listo para servir?</h3>
              <p className="text-[15px] text-white/70 mb-8 leading-relaxed">
                Completa el formulario y nuestro equipo se comunicará contigo para orientarte y ayudarte a dar tu primer paso en el voluntariado.
              </p>
              <div className="donation-wrapper">
                <VolunteerForm preselected={selected} onClearPreselected={() => setSelected('')} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
