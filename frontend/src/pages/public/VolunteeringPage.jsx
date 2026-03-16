import { useState } from 'react';
import { ArrowRight, Send } from 'lucide-react';
import PageHero from '../../components/layout/PageHero';
import Input from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';

const AREAS = [
  { title: 'Equipo de Bienvenida',    desc: 'Recibe a cada persona con calidez y haz que se sienta en casa desde el primer momento.' },
  { title: 'Ministerio de Niños',     desc: 'Enseña e inspira a los más pequeños con creatividad y amor.' },
  { title: 'Equipo de Producción',    desc: 'Sonido, proyección y streaming para que el servicio llegue más lejos.' },
  { title: 'Grupos de Conexión',      desc: 'Facilita espacios donde las personas construyen comunidad y amistad real.' },
  { title: 'Equipo de Alcance',       desc: 'Lleva el amor de Dios a la comunidad a través de servicio práctico y evangelismo.' },
  { title: 'Ministerio de Oración',   desc: 'Intercede por la iglesia, los miembros y las necesidades de la ciudad.' },
];

function VolunteerForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', area: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

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
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-6 bg-green-500/10 border border-green-500/20 rounded-xl">
        <p className="text-green-700 dark:text-green-400 font-medium">¡Inscripción recibida!</p>
        <p className="text-ink-3 text-sm mt-1">Nuestro equipo se pondrá en contacto contigo.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Nombre completo" value={form.name} onChange={set('name')} required />
      <Input label="Correo electrónico" type="email" value={form.email} onChange={set('email')} required />
      <Input label="Teléfono" type="tel" value={form.phone} onChange={set('phone')} placeholder="Opcional" />
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Área de interés</label>
        <select
          className="w-full rounded-md border border-line bg-transparent px-4 py-2.5 text-sm text-ink"
          value={form.area}
          onChange={(e) => setForm(p => ({ ...p, area: e.target.value }))}
        >
          <option value="">Selecciona un área</option>
          {AREAS.map(a => <option key={a.title} value={a.title}>{a.title}</option>)}
        </select>
      </div>
      <Textarea label="Mensaje" rows={3} value={form.message} onChange={set('message')} placeholder="Cuéntanos por qué quieres servir..." />
      <Button type="submit" variant="navy" size="lg" className="w-full" disabled={submitting}>
        {submitting ? 'Enviando...' : <>Enviar inscripción <Send size={14} /></>}
      </Button>
    </form>
  );
}

export default function VolunteeringPage() {
  return (
    <main className="min-h-screen bg-bg">
      <PageHero title="Voluntariado" subtitle="Sirve con tus talentos y haz la diferencia en la comunidad." />

      <div className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-blue font-semibold text-sm uppercase tracking-widest mb-3">Áreas de Servicio</p>
          <h2 className="text-3xl font-black text-ink mb-10">¿Dónde quieres servir?</h2>

          <div className="divide-y divide-line border border-line rounded-xl overflow-hidden mb-12">
            {AREAS.map(({ title, desc }) => (
              <div key={title} className="flex items-start justify-between gap-4 p-5 bg-card hover:bg-card-2 transition-colors">
                <div>
                  <h3 className="font-bold text-ink mb-1 text-sm">{title}</h3>
                  <p className="text-ink-3 text-sm leading-relaxed">{desc}</p>
                </div>
                <ArrowRight size={14} className="text-ink-3 mt-0.5 shrink-0" />
              </div>
            ))}
          </div>

          {/* Formulario de inscripción */}
          <div className="p-8 rounded-2xl bg-bg-2 border border-line">
            <h3 className="text-2xl font-black text-ink mb-2">¿Listo para servir?</h3>
            <p className="text-ink-2 text-sm mb-6 leading-relaxed">
              Completa el formulario y nuestro equipo se comunicará contigo para orientarte.
            </p>
            <VolunteerForm />
          </div>
        </div>
      </div>
    </main>
  );
}
