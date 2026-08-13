import { useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Input, { Textarea } from '../ui/Input';
import Button from '../ui/Button';
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
  volunteer_name: '', area: '', service_date: '', leader_name: '',
  team_attendance: 0, notes: '', photo_url: '',
};

export default function VolunteerReportForm({ onSuccess }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    ...EMPTY,
    volunteer_name: user?.name || '',
    area: user?.area || '',
    leader_name: user?.role === 'leader' ? (user?.name || '') : '',
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
    if (!form.volunteer_name || !form.area || !form.service_date) {
      toast.error('Nombre, área y fecha son obligatorios');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/admin/volunteer-reports', {
        ...form,
        team_attendance: parseInt(form.team_attendance, 10) || 0,
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
        <p className="text-body-m text-bg/50 mb-6">Gracias por tu servicio en la casa de Dios.</p>
        <Button variant="outlined" onClick={() => { setSubmitted(false); setForm({ ...EMPTY, volunteer_name: user?.name || '' }); }}>
          Enviar otro
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-headline-s text-bg font-black">Reporte de Servicio (Voluntarios)</h2>

      {/* Identificación */}
      <div className="p-5 rounded-2xl bg-bg/4 border border-bg/10 space-y-4">
        <p className="text-label-l text-bg font-semibold uppercase tracking-widest">Identificación</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nombre del Voluntario *" value={form.volunteer_name} onChange={onInput('volunteer_name')} placeholder="Tu nombre" />
          <Input label="Área de Servicio *" value={form.area} onChange={onInput('area')} placeholder="Ej. Ujieres, Alabanza..." />
        </div>
        <Input label="Fecha del Servicio *" type="date" value={form.service_date} onChange={onInput('service_date')} />
      </div>

      {/* Responsables */}
      <div className="p-5 rounded-2xl bg-bg/4 border border-bg/10 space-y-4">
        <p className="text-label-l text-bg font-semibold uppercase tracking-widest">Responsable</p>
        <div className="grid grid-cols-1 gap-4">
          <Input label="Líder de Área" value={form.leader_name} onChange={onInput('leader_name')} placeholder="Nombre de tu líder directo" />
        </div>
      </div>

      {/* Detalles */}
      <div className="p-5 rounded-2xl bg-bg/4 border border-bg/10 space-y-4">
        <p className="text-label-l text-bg font-semibold uppercase tracking-widest">Detalles del Servicio</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumField label="Asistencia del Equipo (Opcional)" name="team_attendance" value={form.team_attendance} onChange={set} />
        </div>
      </div>

      {/* Notas y Foto */}
      <div className="space-y-4">
        <Textarea label="Notas o Testimonios" rows={3} value={form.notes} onChange={onInput('notes')} placeholder="Algo que destacar del servicio…" />
        <Field label="Foto (Opcional)">
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
