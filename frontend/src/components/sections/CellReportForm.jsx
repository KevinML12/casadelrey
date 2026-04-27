import { useState } from 'react';
import { useForm } from 'react-hook-form';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Input from '../ui/Input';
import Button from '../ui/Button';

const fieldCls = 'w-full px-4 py-2.5 rounded-lg border border-outline-var bg-transparent text-body-s text-on-surf placeholder:text-on-surf-var focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all';

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
        <div className="w-16 h-16 rounded-full bg-ter-con flex items-center justify-center mb-5">
          <span className="ms text-on-ter-con" style={{ fontSize: 32 }}>check_circle</span>
        </div>
        <h3 className="text-title-l text-on-surf font-bold mb-2">¡Reporte enviado!</h3>
        <p className="text-body-m text-on-surf-var max-w-xs leading-relaxed mb-6">
          Tu reporte de célula fue registrado correctamente.
        </p>
        <Button variant="outlined" onClick={() => setSubmitted(false)}>Enviar otro reporte</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-headline-s text-on-surf font-black mb-1">Reporte de Célula</h2>
        <p className="text-body-m text-on-surf-var">Registra la reunión para que el equipo pastoral tenga visibilidad.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nombre del líder *" error={errors.leader_name}
            readOnly={user?.role === 'leader'}
            {...register('leader_name', { required: 'El nombre del líder es requerido' })} />
          <Input label="Nombre de la célula *" error={errors.cell_name}
            {...register('cell_name', { required: 'El nombre de la célula es requerido' })} />
        </div>

        <Input label="Fecha de la reunión *" type="date" error={errors.meeting_date}
          {...register('meeting_date', { required: 'La fecha es requerida' })} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-label-l text-on-surf-var mb-1.5">Asistencia</label>
            <input type="number" min="0" placeholder="0" className={fieldCls}
              {...register('attendance', { min: { value: 0, message: 'Mínimo 0' } })} />
            {errors.attendance && <p className="mt-1.5 text-label-s text-err">{errors.attendance.message}</p>}
          </div>
          <div>
            <label className="block text-label-l text-on-surf-var mb-1.5">Visitantes nuevos</label>
            <input type="number" min="0" placeholder="0" className={fieldCls}
              {...register('new_visitors', { min: { value: 0, message: 'Mínimo 0' } })} />
            {errors.new_visitors && <p className="mt-1.5 text-label-s text-err">{errors.new_visitors.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-label-l text-on-surf-var mb-1.5">Notas (opcional)</label>
          <textarea rows={3} placeholder="Algo que destacar de la reunión..." className={`${fieldCls} resize-none`}
            {...register('notes')} />
        </div>

        <Button type="submit" variant="filled" size="lg" className="w-full justify-center" disabled={isSubmitting}>
          {isSubmitting
            ? <><span className="ms" style={{ fontSize: 18 }}>hourglass_empty</span>Enviando...</>
            : <><span className="ms" style={{ fontSize: 18 }}>groups</span>Enviar Reporte</>
          }
        </Button>
      </form>
    </div>
  );
}
