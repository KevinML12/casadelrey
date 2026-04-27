import { useState } from 'react';
import { useForm } from 'react-hook-form';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Input, { Textarea, Select } from '../ui/Input';
import Button from '../ui/Button';

const CATEGORIES = [
  { value: 'salud',      label: 'Salud y Sanidad' },
  { value: 'familia',    label: 'Familia' },
  { value: 'trabajo',    label: 'Trabajo y Finanzas' },
  { value: 'espiritual', label: 'Crecimiento Espiritual' },
  { value: 'otro',       label: 'Otro' },
];

export default function PrayerForm({ compact = false }) {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm({
    defaultValues: { name: '', email: '', category: '', subject: '', message: '' },
  });

  const onSubmit = async (data) => {
    try {
      await apiClient.post('/contact/petition', data);
      setSubmitted(true);
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo enviar. Intenta de nuevo.');
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center py-12 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-ter-con flex items-center justify-center mb-5">
          <span className="ms text-on-ter-con" style={{ fontSize: 32 }}>favorite</span>
        </div>
        <h3 className="text-title-l text-on-surf font-bold mb-2">¡Recibida con amor!</h3>
        <p className="text-body-m text-on-surf-var max-w-xs leading-relaxed mb-6">
          Tu petición fue recibida. Nuestra comunidad estará intercediendo por ti.
        </p>
        <Button variant="outlined" onClick={() => setSubmitted(false)}>
          Enviar otra petición
        </Button>
      </div>
    );
  }

  return (
    <div className={compact ? '' : 'max-w-2xl mx-auto'}>
      {!compact && (
        <div className="mb-8">
          <h2 className="text-headline-s text-on-surf font-black mb-2">Petición de Oración</h2>
          <p className="text-body-m text-on-surf-var">
            Todo lo que compartas es confidencial y llega directamente al equipo pastoral.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nombre *" error={errors.name}
            {...register('name', { required: 'El nombre es requerido' })} />
          <Input label="Correo electrónico" type="email" error={errors.email}
            {...register('email', { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' } })} />
        </div>

        <Select
          label="Categoría"
          options={CATEGORIES}
          value={watch('category')}
          onChange={e => setValue('category', e.target.value)}
        />

        <Input label="Asunto *" error={errors.subject}
          {...register('subject', { required: 'El asunto es requerido' })} />

        <Textarea label="Petición *" rows={5} error={errors.message}
          {...register('message', { required: 'Escribe tu petición', minLength: { value: 10, message: 'Escribe un poco más' } })} />

        <div className="flex items-start gap-3 p-3.5 rounded-lg bg-surf-high border border-outline-var">
          <span className="ms text-on-surf-var mt-0.5 shrink-0" style={{ fontSize: 16 }}>lock</span>
          <p className="text-label-s text-on-surf-var leading-relaxed">
            Tu petición es confidencial. Solo el equipo pastoral tiene acceso.
          </p>
        </div>

        <Button type="submit" variant="filled" size="lg" className="w-full justify-center" disabled={isSubmitting}>
          {isSubmitting
            ? <><span className="ms" style={{ fontSize: 18 }}>hourglass_empty</span>Enviando...</>
            : <><span className="ms" style={{ fontSize: 18 }}>send</span>Enviar Petición</>
          }
        </Button>
      </form>
    </div>
  );
}
