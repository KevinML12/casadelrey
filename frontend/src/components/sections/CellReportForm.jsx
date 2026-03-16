import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle, Loader2, Users } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Input from '../ui/Input';
import Button from '../ui/Button';

const inputCls = 'w-full px-4 py-2.5 rounded-md border border-line dark:border-white/10 bg-transparent text-ink placeholder:text-ink-3 text-sm focus:outline-none focus:border-blue focus:ring-2 focus:ring-blue/15 transition-all';

export default function CellReportForm({ onSuccess }) {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const leaderDefault = user?.role === 'leader' ? (user?.name || '') : '';
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    defaultValues: { leader_name: leaderDefault, cell_name: '', meeting_date: '', attendance: 0, new_visitors: 0, notes: '' },
  });

  const onSubmit = async (data) => {
    try {
      await apiClient.post('/admin/cell-report', {
        leader_name: data.leader_name,
        cell_name: data.cell_name,
        meeting_date: data.meeting_date,
        attendance: parseInt(data.attendance, 10) || 0,
        new_visitors: parseInt(data.new_visitors, 10) || 0,
        notes: data.notes || '',
      });
      setSubmitted(true);
      reset();
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo enviar. Intenta de nuevo.');
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center py-12 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-ok/10 flex items-center justify-center mb-5">
          <CheckCircle size={32} className="text-ok" />
        </div>
        <h3 className="text-xl font-bold text-ink mb-2">¡Reporte enviado!</h3>
        <p className="text-ink-2 text-sm max-w-xs leading-relaxed mb-6">
          Tu reporte de célula fue registrado correctamente.
        </p>
        <Button variant="outline" onClick={() => setSubmitted(false)}>
          Enviar otro reporte
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-ink mb-2">Reporte de Célula</h2>
        <p className="text-ink-2 text-sm">
          Registra la reunión de tu célula para que el equipo pastoral tenga visibilidad.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nombre del líder *"
            error={errors.leader_name}
            readOnly={user?.role === 'leader'}
            {...register('leader_name', { required: 'El nombre del líder es requerido' })} />
          <Input label="Nombre de la célula *"
            error={errors.cell_name}
            {...register('cell_name', { required: 'El nombre de la célula es requerido' })} />
        </div>

        <Input label="Fecha de la reunión *" type="date"
          error={errors.meeting_date}
          {...register('meeting_date', { required: 'La fecha es requerida' })} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Asistencia</label>
            <input
              type="number" min="0" placeholder="0"
              className={inputCls}
              {...register('attendance', { min: { value: 0, message: 'Mínimo 0' } })}
            />
            {errors.attendance && <p className="text-xs text-red-500 mt-0.5">{errors.attendance.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Visitantes nuevos</label>
            <input
              type="number" min="0" placeholder="0"
              className={inputCls}
              {...register('new_visitors', { min: { value: 0, message: 'Mínimo 0' } })}
            />
            {errors.new_visitors && <p className="text-xs text-red-500 mt-0.5">{errors.new_visitors.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Notas (opcional)</label>
          <textarea
            rows={3} placeholder="Algo que destacar de la reunión..."
            className={inputCls}
            {...register('notes')}
          />
        </div>

        <Button type="submit" variant="navy" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting
            ? <><Loader2 size={16} className="animate-spin" /> Enviando...</>
            : <><Users size={16} /> Enviar Reporte</>
          }
        </Button>
      </form>
    </div>
  );
}
