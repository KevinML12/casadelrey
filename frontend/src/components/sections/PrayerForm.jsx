import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Send, CheckCircle, Loader2, Lock } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Input, { Textarea } from '../ui/Input';
import Button from '../ui/Button';

const CATEGORIES = [
  { value: 'salud',      label: 'Salud y Sanidad' },
  { value: 'familia',    label: 'Familia' },
  { value: 'trabajo',    label: 'Trabajo y Finanzas' },
  { value: 'espiritual', label: 'Crecimiento Espiritual' },
  { value: 'otro',       label: 'Otro' },
];

const selectCls = [
  'w-full px-4 py-2.5 rounded-md border border-line dark:border-white/10 bg-transparent text-ink text-sm',
  'focus:outline-none focus:border-blue focus:ring-2 focus:ring-blue/15 transition-all',
].join(' ');

export default function PrayerForm({ compact = false }) {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    defaultValues: { name: '', email: '', category: '', subject: '', message: '' },
  });

  const onSubmit = async (data) => {
    try {
      await apiClient.post('/v1/contact/petition', data);
      setSubmitted(true);
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo enviar. Intenta de nuevo.');
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center py-12 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-ok/10 flex items-center justify-center mb-5">
          <CheckCircle size={32} className="text-ok" />
        </div>
        <h3 className="text-xl font-bold text-ink mb-2">¡Recibida con amor!</h3>
        <p className="text-ink-2 text-sm max-w-xs leading-relaxed mb-6">
          Tu petición fue recibida. Nuestra comunidad estará intercediendo por ti.
        </p>
        <Button variant="outline" onClick={() => setSubmitted(false)}>
          Enviar otra petición
        </Button>
      </div>
    );
  }

  return (
    <div className={compact ? '' : 'max-w-2xl mx-auto'}>
      {!compact && (
        <div className="mb-8">
          <h2 className="text-2xl font-black text-ink mb-2">Petición de Oración</h2>
          <p className="text-ink-2 text-sm">
            Todo lo que compartas es confidencial y llega directamente al equipo pastoral.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nombre *"
            error={errors.name}
            {...register('name', { required: 'El nombre es requerido' })} />
          <Input label="Correo electrónico" type="email"
            error={errors.email}
            {...register('email', { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' } })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Categoría</label>
          <select {...register('category')} className={selectCls}>
            <option value="">Selecciona una categoría</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <Input label="Asunto *"
          error={errors.subject}
          {...register('subject', { required: 'El asunto es requerido' })} />

        <Textarea label="Petición *" rows={5}
          error={errors.message}
          {...register('message', { required: 'Escribe tu petición', minLength: { value: 10, message: 'Escribe un poco más' } })} />

        <div className="flex items-start gap-3 p-3.5 rounded-lg bg-card-2 border border-line">
          <Lock size={13} className="text-ink-3 mt-0.5 shrink-0" />
          <p className="text-xs text-ink-3 leading-relaxed">
            Tu petición es confidencial. Solo el equipo pastoral tiene acceso.
          </p>
        </div>

        <Button type="submit" variant="navy" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting
            ? <><Loader2 size={16} className="animate-spin" /> Enviando...</>
            : <><Send size={16} /> Enviar Petición</>
          }
        </Button>
      </form>
    </div>
  );
}
