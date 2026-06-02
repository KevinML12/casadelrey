import { useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';

const BANKS = ['Banrural', 'BAC Credomatic', 'G&T Continental', 'Industrial', 'Agromercantil', 'Promerica', 'Citibank', 'Otro'];

const fieldCls = 'w-full px-4 py-2.5 rounded-xl border border-outline-var bg-transparent text-body-s text-on-surf placeholder:text-on-surf-var focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all';

const EMPTY = {
  payer_name: '', payer_email: '', payer_phone: '',
  amount: '', bank_name: '', reference_number: '',
  receipt_image_url: '', purpose: 'donacion', event_id: null,
};

export default function ReceiptUploadForm({ eventId = null, purpose = 'donacion', onSuccess }) {
  const [form, setForm]       = useState({ ...EMPTY, event_id: eventId, purpose });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent]       = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiClient.post('/upload?folder=comprobantes', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(p => ({ ...p, receipt_image_url: res.data.url }));
      toast.success('Comprobante subido');
    } catch { toast.error('Error al subir la imagen'); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.payer_name || !form.amount || !form.receipt_image_url) {
      toast.error('Nombre, monto y foto del comprobante son requeridos');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/receipts', {
        ...form,
        amount: parseFloat(form.amount) || 0,
      });
      setSent(true);
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al enviar');
    } finally { setSubmitting(false); }
  };

  if (sent) return (
    <div className="text-center py-10 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-ter-con flex items-center justify-center mx-auto mb-4">
        <span className="ms text-on-ter-con" style={{ fontSize: 32 }}>check_circle</span>
      </div>
      <h3 className="text-title-l text-on-surf font-bold mb-2">¡Comprobante recibido!</h3>
      <p className="text-body-s text-on-surf-var">El equipo verificará tu pago en 24-48 horas y recibirás confirmación.</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Datos del pagador */}
      <div className="space-y-3">
        <p className="text-label-l text-pri font-semibold uppercase tracking-widest">Tus datos</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-label-l text-on-surf-var mb-1.5">Nombre completo <span className="text-err">*</span></label>
            <input value={form.payer_name} onChange={set('payer_name')} className={fieldCls} placeholder="Juan García" required />
          </div>
          <div>
            <label className="block text-label-l text-on-surf-var mb-1.5">Teléfono</label>
            <input value={form.payer_phone} onChange={set('payer_phone')} className={fieldCls} placeholder="+502 5555 0000" />
          </div>
        </div>
        <div>
          <label className="block text-label-l text-on-surf-var mb-1.5">Correo electrónico</label>
          <input type="email" value={form.payer_email} onChange={set('payer_email')} className={fieldCls} placeholder="correo@email.com" />
        </div>
      </div>

      {/* Datos del pago */}
      <div className="space-y-3">
        <p className="text-label-l text-pri font-semibold uppercase tracking-widest">Datos del depósito</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-label-l text-on-surf-var mb-1.5">Monto depositado (Q) <span className="text-err">*</span></label>
            <input type="number" min="1" step="0.01" value={form.amount} onChange={set('amount')} className={fieldCls} placeholder="0.00" required />
          </div>
          <div>
            <label className="block text-label-l text-on-surf-var mb-1.5">Banco</label>
            <select value={form.bank_name} onChange={set('bank_name')} className={fieldCls}>
              <option value="">Seleccionar banco…</option>
              {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-label-l text-on-surf-var mb-1.5">Número de referencia / No. de boleta</label>
          <input value={form.reference_number} onChange={set('reference_number')} className={fieldCls} placeholder="Ej. 202600123456" />
        </div>
      </div>

      {/* Foto del comprobante */}
      <div>
        <p className="text-label-l text-pri font-semibold uppercase tracking-widest mb-3">Foto del comprobante</p>
        {form.receipt_image_url ? (
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-ter-con bg-ter-con/10">
            <img src={form.receipt_image_url} alt="comprobante" className="h-20 w-20 object-cover rounded-xl border border-outline-var" />
            <div className="flex-1">
              <p className="text-body-s text-on-surf font-medium flex items-center gap-1.5">
                <span className="ms text-ter" style={{ fontSize: 16 }}>check_circle</span>
                Comprobante cargado
              </p>
              <button type="button" onClick={() => setForm(p => ({ ...p, receipt_image_url: '' }))}
                className="text-label-s text-on-surf-var hover:text-err transition-colors mt-1">
                Cambiar foto
              </button>
            </div>
          </div>
        ) : (
          <label className={`flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${uploading ? 'border-outline-var opacity-60' : 'border-outline-var hover:border-pri hover:bg-surf-low'}`}>
            <span className="ms text-on-surf-var" style={{ fontSize: 40 }}>{uploading ? 'hourglass_empty' : 'add_photo_alternate'}</span>
            <div className="text-center">
              <p className="text-body-s text-on-surf font-medium">{uploading ? 'Subiendo…' : 'Toca para subir la foto'}</p>
              <p className="text-label-s text-on-surf-var mt-0.5">JPG, PNG o PDF · máx. 10 MB</p>
            </div>
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={handlePhoto} disabled={uploading} />
          </label>
        )}
      </div>

      <button type="submit" disabled={submitting || uploading || !form.receipt_image_url}
        className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-pri text-on-pri text-label-l font-semibold hover:opacity-90 transition-opacity disabled:opacity-40">
        <span className="ms" style={{ fontSize: 18 }}>{submitting ? 'hourglass_empty' : 'send'}</span>
        {submitting ? 'Enviando…' : 'Enviar comprobante'}
      </button>
    </form>
  );
}
