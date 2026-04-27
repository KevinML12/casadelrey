import { useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

const CELL_TYPES = [
  { value: 'hombres',  label: 'Hombres (HX)' },
  { value: 'mujeres',  label: 'Mujeres (MX)' },
  { value: 'jovenes',  label: 'Jóvenes (JX)' },
  { value: 'prejus',   label: 'Prejus (PX)' },
  { value: 'ninos',    label: 'Niños (NX)' },
];

const fieldCls = 'w-full px-4 py-2.5 rounded-xl border border-outline-var bg-transparent text-body-s text-on-surf placeholder:text-on-surf-var focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all';

const Field = ({ label, children, required }) => (
  <div>
    <label className="block text-label-l text-on-surf-var mb-1.5">
      {label}{required && <span className="text-err ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const NumField = ({ label, name, value, onChange }) => (
  <Field label={label}>
    <input type="number" min="0" value={value} onChange={e => onChange(name, e.target.value)}
      className={fieldCls} placeholder="0" />
  </Field>
);

const EMPTY = {
  cell_code: '', cell_name: '', cell_type: '', meeting_date: '',
  leader_name: '', pastor_name: '',
  host_name: '', host_phone: '', address: '',
  topic: '',
  total_attendees: 0, converts: 0, reconciled: 0, offering: 0,
  notes: '',
};

export default function CellReportForm({ onSuccess }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    ...EMPTY,
    leader_name: user?.role === 'leader' ? (user?.name || '') : '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const onInput = k => e => set(k, e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cell_name || !form.meeting_date) {
      toast.error('Nombre de célula y fecha son obligatorios');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/admin/cell-reports', {
        ...form,
        total_attendees: parseInt(form.total_attendees, 10) || 0,
        converts:        parseInt(form.converts, 10) || 0,
        reconciled:      parseInt(form.reconciled, 10) || 0,
        offering:        parseFloat(form.offering) || 0,
      });
      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo enviar.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center py-12 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-ter-con flex items-center justify-center mb-5">
          <span className="ms text-on-ter-con" style={{ fontSize: 32 }}>check_circle</span>
        </div>
        <h3 className="text-title-l text-on-surf font-bold mb-2">¡Reporte enviado!</h3>
        <p className="text-body-m text-on-surf-var mb-6">Pendiente de aprobación pastoral.</p>
        <Button variant="outlined" onClick={() => { setSubmitted(false); setForm({ ...EMPTY, leader_name: user?.role === 'leader' ? (user?.name || '') : '' }); }}>
          Enviar otro
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-headline-s text-on-surf font-black">Reporte de Célula</h2>

      {/* Identificación */}
      <div className="p-5 rounded-2xl bg-surf border border-outline-var space-y-4">
        <p className="text-label-l text-pri font-semibold uppercase tracking-widest">Identificación</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Código" ><input value={form.cell_code} onChange={onInput('cell_code')} className={fieldCls} placeholder="H1, M2, J3…" /></Field>
          <Field label="Nombre de la célula" required><input value={form.cell_name} onChange={onInput('cell_name')} className={fieldCls} placeholder="Ej. Célula Centro" /></Field>
          <Field label="Tipo de célula">
            <select value={form.cell_type} onChange={onInput('cell_type')} className={fieldCls}>
              <option value="">Seleccionar…</option>
              {CELL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Fecha de la reunión" required>
          <input type="date" value={form.meeting_date} onChange={onInput('meeting_date')} className={fieldCls} />
        </Field>
      </div>

      {/* Responsables */}
      <div className="p-5 rounded-2xl bg-surf border border-outline-var space-y-4">
        <p className="text-label-l text-pri font-semibold uppercase tracking-widest">Responsables</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Líder">
            <input value={form.leader_name} onChange={onInput('leader_name')}
              readOnly={user?.role === 'leader'} className={fieldCls} placeholder="Nombre del líder" />
          </Field>
          <Field label="Pastor asignado">
            <input value={form.pastor_name} onChange={onInput('pastor_name')} className={fieldCls} placeholder="Nombre del pastor" />
          </Field>
        </div>
      </div>

      {/* Anfitrión */}
      <div className="p-5 rounded-2xl bg-surf border border-outline-var space-y-4">
        <p className="text-label-l text-pri font-semibold uppercase tracking-widest">Anfitrión</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre del anfitrión"><input value={form.host_name} onChange={onInput('host_name')} className={fieldCls} placeholder="Dueño de la casa" /></Field>
          <Field label="Teléfono"><input value={form.host_phone} onChange={onInput('host_phone')} className={fieldCls} placeholder="+502 5555 0000" /></Field>
        </div>
        <Field label="Dirección"><input value={form.address} onChange={onInput('address')} className={fieldCls} placeholder="Dirección de la reunión" /></Field>
      </div>

      {/* Tema */}
      <div className="p-5 rounded-2xl bg-surf border border-outline-var">
        <p className="text-label-l text-pri font-semibold uppercase tracking-widest mb-4">Tema</p>
        <Field label="Tema de la reunión"><input value={form.topic} onChange={onInput('topic')} className={fieldCls} placeholder="Ej. Fe que mueve montañas" /></Field>
      </div>

      {/* Números */}
      <div className="p-5 rounded-2xl bg-surf border border-outline-var space-y-4">
        <p className="text-label-l text-pri font-semibold uppercase tracking-widest">Números</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <NumField label="Total asistentes" name="total_attendees" value={form.total_attendees} onChange={set} />
          <NumField label="Convertidos" name="converts" value={form.converts} onChange={set} />
          <NumField label="Reconciliados" name="reconciled" value={form.reconciled} onChange={set} />
          <Field label="Ofrenda (Q)">
            <input type="number" min="0" step="0.01" value={form.offering} onChange={e => set('offering', e.target.value)}
              className={fieldCls} placeholder="0.00" />
          </Field>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-pri-con">
          <span className="ms text-on-pri-con" style={{ fontSize: 18 }}>person_add</span>
          <span className="text-body-s text-on-pri-con">
            Nuevos total: <strong>{(parseInt(form.converts, 10) || 0) + (parseInt(form.reconciled, 10) || 0)}</strong>
            <span className="text-on-pri-con/60 ml-2">({form.converts || 0} conv. + {form.reconciled || 0} rec.)</span>
          </span>
        </div>
      </div>

      {/* Notas */}
      <div>
        <Field label="Notas">
          <textarea rows={3} value={form.notes} onChange={onInput('notes')}
            placeholder="Algo que destacar de la reunión…" className={`${fieldCls} resize-none`} />
        </Field>
      </div>

      <Button type="submit" variant="filled" size="lg" className="w-full justify-center" disabled={loading}>
        {loading
          ? <><span className="ms" style={{ fontSize: 18 }}>hourglass_empty</span>Enviando…</>
          : <><span className="ms" style={{ fontSize: 18 }}>groups</span>Enviar Reporte</>
        }
      </Button>
    </form>
  );
}
