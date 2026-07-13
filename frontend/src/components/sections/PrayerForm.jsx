// Formulario público de peticiones — lenguaje Liquid Glass (tokens del
// sitio público). Antes usaba los componentes/tokens Material Design 3
// del panel admin (Input/Button, text-on-surf...) — la guía prohíbe
// mezclar los dos sistemas (docs/DISENO_LIQUID_GLASS.md §1).
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { Icon } from '../ui/Glass';

const CATEGORIES = [
  { value: 'salud',      label: 'Salud y Sanidad' },
  { value: 'familia',    label: 'Familia' },
  { value: 'trabajo',    label: 'Trabajo y Finanzas' },
  { value: 'espiritual', label: 'Crecimiento Espiritual' },
  { value: 'otro',       label: 'Otro' },
];

const PRESS = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.97 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
};

const FIELD_STYLE = {
  background: 'rgba(255,255,255,0.05)',
  borderColor: 'rgba(255,255,255,0.12)',
  color: '#fff',
};

function FieldShell({ label, error, children }) {
  return (
    <label className="block">
      <span className="block text-[13px] font-semibold text-white/60 mb-2">{label}</span>
      {children}
      {error && <span className="block text-[12.5px] font-medium text-red-400 mt-1.5">{error.message}</span>}
    </label>
  );
}

export default function PrayerForm({ compact = false }) {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
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
        <div className="w-16 h-16 rounded-full bg-white/10 border border-white/15 flex items-center justify-center mb-5">
          <Icon name="heart" className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-[22px] font-bold text-white mb-2">¡Recibida con amor!</h3>
        <p className="text-[15px] text-white/70 max-w-xs leading-relaxed mb-6">
          Tu petición fue recibida. Nuestra comunidad estará intercediendo por ti.
        </p>
        <motion.button
          type="button"
          {...PRESS}
          onClick={() => setSubmitted(false)}
          className="inline-flex items-center gap-2 rounded-pill liquid-glass border border-white/20 px-6 py-3 text-[14px] font-bold text-white focus-ring"
        >
          Enviar otra petición
        </motion.button>
      </div>
    );
  }

  return (
    <div className={compact ? '' : 'max-w-2xl mx-auto'}>
      {!compact && (
        <div className="mb-8">
          <h2 className="text-[24px] font-bold text-white tracking-tight mb-2">Petición de Oración</h2>
          <p className="text-[15px] text-white/70">
            Todo lo que compartas es confidencial y llega directamente al equipo pastoral.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldShell label="Nombre *" error={errors.name}>
            <input className="input-squircle w-full" style={FIELD_STYLE}
              {...register('name', { required: 'El nombre es requerido' })} />
          </FieldShell>
          <FieldShell label="Correo electrónico" error={errors.email}>
            <input type="email" className="input-squircle w-full" style={FIELD_STYLE}
              {...register('email', { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' } })} />
          </FieldShell>
        </div>

        <FieldShell label="Categoría">
          <select className="input-squircle w-full appearance-none cursor-pointer" style={FIELD_STYLE}
            {...register('category')}>
            <option value="" className="text-bg">Selecciona una categoría</option>
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value} className="text-bg">{c.label}</option>
            ))}
          </select>
        </FieldShell>

        <FieldShell label="Asunto *" error={errors.subject}>
          <input className="input-squircle w-full" style={FIELD_STYLE}
            {...register('subject', { required: 'El asunto es requerido' })} />
        </FieldShell>

        <FieldShell label="Petición *" error={errors.message}>
          <textarea rows={5} className="input-squircle w-full resize-none" style={FIELD_STYLE}
            {...register('message', { required: 'Escribe tu petición', minLength: { value: 10, message: 'Escribe un poco más' } })} />
        </FieldShell>

        <div className="flex items-start gap-3 p-3.5 rounded-[14px] bg-white/5 border border-white/10">
          <Icon name="lock" className="w-4 h-4 text-white/50 mt-0.5 shrink-0" />
          <p className="text-[12.5px] text-white/60 leading-relaxed">
            Tu petición es confidencial. Solo el equipo pastoral tiene acceso.
          </p>
        </div>

        <motion.button
          type="submit"
          {...PRESS}
          disabled={isSubmitting}
          className="w-full inline-flex items-center justify-center gap-2.5 rounded-pill bg-white text-bg px-6 py-4 text-[15px] font-bold focus-ring disabled:opacity-60"
        >
          {isSubmitting ? 'Enviando…' : <>Enviar petición<Icon name="arrow" className="w-4 h-4" stroke={2} /></>}
        </motion.button>
      </form>
    </div>
  );
}
