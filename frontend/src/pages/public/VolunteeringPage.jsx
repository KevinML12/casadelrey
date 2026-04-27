import { useState } from 'react';
import PageHero from '../../components/layout/PageHero';
import Input from '../../components/ui/Input';
import { Textarea, Select } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';

const AREAS = [
  { icon: 'waving_hand',     title: 'Equipo de Bienvenida',   desc: 'Recibe a cada persona con calidez y haz que se sienta en casa desde el primer momento.' },
  { icon: 'child_care',      title: 'Ministerio de Niños',    desc: 'Enseña e inspira a los más pequeños con creatividad y amor.' },
  { icon: 'spatial_audio',   title: 'Equipo de Producción',   desc: 'Sonido, proyección y streaming para que el servicio llegue más lejos.' },
  { icon: 'group',           title: 'Grupos de Conexión',     desc: 'Facilita espacios donde las personas construyen comunidad y amistad real.' },
  { icon: 'volunteer_activism', title: 'Equipo de Alcance',   desc: 'Lleva el amor de Dios a la comunidad a través de servicio práctico y evangelismo.' },
  { icon: 'self_improvement', title: 'Ministerio de Oración', desc: 'Intercede por la iglesia, los miembros y las necesidades de la ciudad.' },
];

function VolunteerForm() {
  const [form,       setForm]       = useState({ name: '', email: '', phone: '', area: '', message: '' });
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
        label="Área de interés"
        placeholder="Selecciona un área"
        value={form.area}
        onChange={e => setForm(p => ({ ...p, area: e.target.value }))}
        options={AREAS.map(a => ({ value: a.title, label: a.title }))}
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
            {AREAS.map(({ icon, title, desc }) => (
              <div key={title}
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
