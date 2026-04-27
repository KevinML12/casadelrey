import { useState } from 'react';
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

function VolunteerForm() {
  const [form,       setForm]       = useState({ name: '', email: '', phone: '', department: '', message: '' });
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
  return (
    <main className="min-h-screen bg-surf">
      <PageHero icon="handshake" title="Voluntariado" subtitle="Sirve con tus talentos y haz la diferencia en la comunidad." />

      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto">

          <div className="mb-3">
            <p className="text-label-l text-pri font-semibold uppercase tracking-widest mb-2">Áreas de Servicio</p>
            <h2 className="text-headline-s text-on-surf font-black">¿Dónde quieres servir?</h2>
          </div>

          {/* Areas list */}
          <div className="divide-y divide-outline-var border border-outline-var rounded-xl overflow-hidden mb-12 mt-6">
            {AREAS.map(({ value, icon, title, desc }) => (
              <div key={value}
                className="flex items-start gap-4 p-5 bg-surf-low hover:bg-surf-high transition-colors">
                <div className="leading-icon shrink-0">
                  <span className="ms" style={{ fontSize: 20 }}>{icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-title-s text-on-surf font-semibold mb-0.5">{title}</h3>
                  <p className="text-body-s text-on-surf-var leading-relaxed">{desc}</p>
                </div>
                <span className="ms text-on-surf-var mt-1 shrink-0" style={{ fontSize: 18 }}>chevron_right</span>
              </div>
            ))}
          </div>

          {/* Formulario */}
          <div className="p-8 rounded-2xl bg-surf-low border border-outline-var">
            <h3 className="text-headline-s text-on-surf font-black mb-2">¿Listo para servir?</h3>
            <p className="text-body-m text-on-surf-var mb-6 leading-relaxed">
              Completa el formulario y nuestro equipo se comunicará contigo para orientarte.
            </p>
            <VolunteerForm />
          </div>
        </div>
      </div>
    </main>
  );
}
