import { useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Input, { Textarea } from '../ui/Input';
import Button from '../ui/Button';
import CellCodePicker, { parseCode } from '../ui/CellCodePicker';
import { compressImageIfNeeded } from '../../lib/compressImage';

const Field = ({ label, children, required }) => (
  <div>
    <label className="block text-label-l text-bg/50 mb-1.5">
      {label}{required && <span className="text-rose ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const NumField = ({ label, name, value, onChange }) => (
  <Input label={label} type="number" min="0" value={value} onChange={e => onChange(name, e.target.value)} placeholder="0" />
);

const EMPTY = {
  cell_code: '', cell_name: '', cell_type: '', meeting_date: '',
  leader_name: '', pastor_name: '',
  host_name: '', host_phone: '', address: '',
  topic: '',
  total_attendees: 0, converts: 0, reconciled: 0, offering: 0,
  notes: '', photo_url: '',
};

export default function CellReportForm({ onSuccess }) {
  const { user } = useAuth();
  // Pre-cargar código y tipo desde el perfil del líder si está disponible
  const leaderParsed = parseCode(user?.cell_code || '');
  const [form, setForm] = useState({
    ...EMPTY,
    leader_name: user?.role === 'leader' ? (user?.name || '') : '',
    cell_code:   user?.cell_code || '',
    cell_id:     user?.cell_id || null,
    cell_type:   user?.cell_type || leaderParsed.type || '',
  });
  const [submitted,  setSubmitted]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [uploading,  setUploading]  = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const onInput = k => e => set(k, e.target.value);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImageIfNeeded(file);
      const fd = new FormData();
      fd.append('file', compressed);
      const res = await apiClient.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      set('photo_url', res.data.url);
      toast.success('Foto subida');
    } catch { toast.error('No se pudo subir la foto'); }
    finally { setUploading(false); }
  };

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
        <h3 className="text-title-l text-bg font-bold mb-2">¡Reporte enviado!</h3>
        <p className="text-body-m text-bg/50 mb-6">Pendiente de aprobación pastoral.</p>
        <Button variant="outlined" onClick={() => { setSubmitted(false); setForm({ ...EMPTY, leader_name: user?.role === 'leader' ? (user?.name || '') : '' }); }}>
          Enviar otro
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-headline-s text-bg font-black">Reporte de Célula</h2>

      {/* Identificación */}
      <div className="p-5 rounded-2xl bg-bg/4 border border-bg/10 space-y-4">
        <p className="text-label-l text-bg font-semibold uppercase tracking-widest">Identificación</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Tipo y código de célula">
              <CellCodePicker
                cellCode={form.cell_code}
                cellType={form.cell_type}
                onChange={({ cell_code, cell_type }) => setForm(p => ({ ...p, cell_code, cell_type }))}
                disabled={user?.role === 'leader'} // el líder no cambia su propio código
              />
            </Field>
          </div>
          <Input label="Nombre de la célula *" value={form.cell_name} onChange={onInput('cell_name')} placeholder="Ej. Célula Centro" />
        </div>
        <Input label="Fecha de la reunión *" type="date" value={form.meeting_date} onChange={onInput('meeting_date')} />
      </div>

      {/* Responsables */}
      <div className="p-5 rounded-2xl bg-bg/4 border border-bg/10 space-y-4">
        <p className="text-label-l text-bg font-semibold uppercase tracking-widest">Responsables</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Líder" value={form.leader_name} onChange={onInput('leader_name')}
            readOnly={user?.role === 'leader'} placeholder="Nombre del líder" />
          <Input label="Pastor asignado" value={form.pastor_name} onChange={onInput('pastor_name')} placeholder="Nombre del pastor" />
        </div>
      </div>

      {/* Anfitrión */}
      <div className="p-5 rounded-2xl bg-bg/4 border border-bg/10 space-y-4">
        <p className="text-label-l text-bg font-semibold uppercase tracking-widest">Anfitrión</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nombre del anfitrión" value={form.host_name} onChange={onInput('host_name')} placeholder="Dueño de la casa" />
          <Input label="Teléfono" value={form.host_phone} onChange={onInput('host_phone')} placeholder="+502 5555 0000" />
        </div>
        <Input label="Dirección" value={form.address} onChange={onInput('address')} placeholder="Dirección de la reunión" />
      </div>

      {/* Tema */}
      <div className="p-5 rounded-2xl bg-bg/4 border border-bg/10">
        <p className="text-label-l text-bg font-semibold uppercase tracking-widest mb-4">Tema</p>
        <Input label="Tema de la reunión" value={form.topic} onChange={onInput('topic')} placeholder="Ej. Fe que mueve montañas" />
      </div>

      {/* Números */}
      <div className="p-5 rounded-2xl bg-bg/4 border border-bg/10 space-y-4">
        <p className="text-label-l text-bg font-semibold uppercase tracking-widest">Números</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <NumField label="Total asistentes" name="total_attendees" value={form.total_attendees} onChange={set} />
          <NumField label="Convertidos" name="converts" value={form.converts} onChange={set} />
          <NumField label="Reconciliados" name="reconciled" value={form.reconciled} onChange={set} />
          <Input label="Ofrenda (Q)" type="number" min="0" step="0.01" value={form.offering} onChange={e => set('offering', e.target.value)} placeholder="0.00" />
        </div>
        <div className="px-4 py-3 rounded-xl bg-bg">
          <span className="text-body-s text-white">
            Nuevos total: <strong>{(parseInt(form.converts, 10) || 0) + (parseInt(form.reconciled, 10) || 0)}</strong>
            <span className="text-white/60 ml-2">({form.converts || 0} conv. + {form.reconciled || 0} rec.)</span>
          </span>
        </div>
      </div>

      {/* Notas y Foto */}
      <div className="space-y-4">
        <Textarea label="Notas" rows={3} value={form.notes} onChange={onInput('notes')} placeholder="Algo que destacar de la reunión…" />
        <Field label="Foto de la reunión">
          <div className="flex items-center gap-3">
            <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-bg/10 text-label-m font-medium cursor-pointer transition-colors ${uploading ? 'opacity-50' : 'hover:border-acento/40 hover:text-bg'} text-bg/50`}>
              {uploading ? 'Subiendo…' : form.photo_url ? 'Cambiar foto' : 'Subir foto'}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
            {form.photo_url && (
              <img src={form.photo_url} alt="preview" className="h-12 w-12 rounded-xl object-cover border border-bg/10" />
            )}
          </div>
        </Field>
      </div>

      <Button type="submit" variant="filled" size="lg" className="w-full justify-center" disabled={loading}>
        {loading ? 'Enviando…' : 'Enviar Reporte'}
      </Button>
    </form>
  );
}
