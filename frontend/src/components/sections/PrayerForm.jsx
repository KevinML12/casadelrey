import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import apiClient from '../../lib/apiClient';
import { FieldLight } from '../ui/Glass';

const CATEGORIES = [
  { value: 'salud', label: 'Salud y Sanidad' },
  { value: 'familia', label: 'Familia' },
  { value: 'trabajo', label: 'Trabajo y Finanzas' },
  { value: 'espiritual', label: 'Crecimiento Espiritual' },
  { value: 'otro', label: 'Otro' },
];
const trim = value => value.trim();

export default function PrayerForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const optionalRef = useRef(null);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setFocus } = useForm({
    defaultValues: { name: '', email: '', category: '', subject: '', message: '' },
  });

  const onSubmit = async data => {
    setError('');
    try {
      await apiClient.post('/contact/petition', data);
      setSubmitted(true);
      reset();
    } catch (failure) {
      setError(failure.response?.data?.error || failure.response?.data?.message || 'No se pudo enviar. Conservamos tu petición para que puedas reintentar.');
    }
  };
  const onInvalid = invalid => {
    if (invalid.email && optionalRef.current) {
      optionalRef.current.open = true;
      setFocus('email');
    }
  };

  if (submitted) return (
    <div role="status" className="pt-7 pb-2">
      <h2 className="text-24 font-semibold">Petición recibida.</h2>
      <p className="mt-4 text-16 text-bg/75 leading-relaxed">El equipo de la iglesia ya puede leerla y acompañarte en oración.</p>
      <button type="button" onClick={() => { setSubmitted(false); setError(''); }} className="ui-action mt-7 inline-flex min-h-11 items-center justify-center rounded-[12px] bg-bg px-5 py-3 text-14 font-bold text-white focus-ring">Enviar otra petición</button>
    </div>
  );

  return (
    <form onSubmit={event => handleSubmit(onSubmit, onInvalid)(event)} noValidate aria-label="Petición de oración" className="mt-3">
      <p className="mb-7 max-w-md text-15 leading-relaxed text-bg/75">Comparte tu petición de forma privada con el equipo de la iglesia.</p>
      <fieldset disabled={isSubmitting}>
        <legend className="sr-only">Tu petición</legend>
        <div className="space-y-5">
          <FieldLight label="Nombre *" autoComplete="name" error={errors.name} maxLength={100} {...register('name', { setValueAs: trim, required: 'Escribe tu nombre.' })} />
          <FieldLight label="Asunto *" error={errors.subject} maxLength={200} {...register('subject', { setValueAs: trim, required: 'Escribe el asunto.' })} />
          <FieldLight as="textarea" rows={4} label="Petición *" error={errors.message} maxLength={10000} {...register('message', { setValueAs: trim, required: 'Escribe tu petición.', minLength: { value: 10, message: 'Escribe al menos 10 caracteres.' } })} />
          <details ref={optionalRef} className="border-t border-bg/15 pt-1">
            <summary className="min-h-11 cursor-pointer rounded-lg py-3 text-14 font-semibold text-bg/70 focus-ring marker:text-bg/50">Datos opcionales</summary>
            <div className="space-y-4 pt-3 pb-1">
              <FieldLight label="Correo electrónico" type="email" autoComplete="email" error={errors.email} maxLength={100} {...register('email', { setValueAs: trim, pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Revisa el correo electrónico.' } })} />
              <FieldLight as="select" label="Categoría" {...register('category')}>
                <option value="">Prefiero no indicar</option>
                {CATEGORIES.map(category => <option key={category.value} value={category.value}>{category.label}</option>)}
              </FieldLight>
            </div>
          </details>
          {error && <p role="alert" className="rounded-[12px] border border-rose/30 bg-white/40 px-4 py-3 text-14 text-bg">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="ui-action w-full min-h-12 rounded-[12px] bg-bg px-5 py-3.5 text-15 font-bold text-white focus-ring disabled:opacity-50">{isSubmitting ? 'Enviando…' : 'Enviar petición'}</button>
        </div>
      </fieldset>
    </form>
  );
}
