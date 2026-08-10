import { useState } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { FieldLight } from '../ui/Glass';
import { compressImageIfNeeded } from '../../lib/compressImage';

const BANKS = ['Banrural', 'BAC Credomatic', 'G&T Continental', 'Industrial', 'Agromercantil', 'Promerica', 'Citibank', 'Otro'];

const EMPTY = {
  payer_name: '', payer_email: '', payer_phone: '',
  amount: '', bank_name: '', reference_number: '',
  receipt_image_url: '', purpose: 'donacion', event_id: null,
};

// defaultName/Email/Phone: cuando este formulario se embebe dentro de otro
// (ej. RSVPModal de EventsPage.jsx) el usuario ya escribió esos datos --
// evita que los vuelva a escribir. Vacíos por defecto, no rompe al
// standalone de ReceiptPage.jsx que no los manda.
export default function ReceiptUploadForm({
  eventId = null, purpose = 'donacion', defaultAmount = '',
  defaultName = '', defaultEmail = '', defaultPhone = '', onSuccess,
}) {
  const [form, setForm] = useState({
    ...EMPTY, event_id: eventId, purpose, amount: defaultAmount,
    payer_name: defaultName, payer_email: defaultEmail, payer_phone: defaultPhone,
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent]       = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      // compressImageIfNeeded ignora PDFs (solo comprime image/*) -- este
      // input acepta ambos, la boleta tal vez sea una foto de celular.
      const compressed = await compressImageIfNeeded(file);
      const fd = new FormData();
      fd.append('file', compressed);
      const res = await apiClient.post('/receipts/upload', fd, {
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
    <div className="text-center py-10">
      <h3 className="text-20 font-bold text-bg mb-2">¡Comprobante recibido!</h3>
      <p className="text-14 text-bg/60">El equipo verificará tu pago en 24-48 horas y recibirás confirmación.</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Datos del pagador */}
      <div className="space-y-3">
        <p className="text-13 font-semibold text-bg/50">Tus datos</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FieldLight label="Nombre completo *" value={form.payer_name} onChange={set('payer_name')} placeholder="Juan García" required />
          <FieldLight label="Teléfono" value={form.payer_phone} onChange={set('payer_phone')} placeholder="+502 5555 0000" />
        </div>
        <FieldLight label="Correo electrónico" type="email" value={form.payer_email} onChange={set('payer_email')} placeholder="correo@email.com" />
      </div>

      {/* Datos del pago */}
      <div className="space-y-3">
        <p className="text-13 font-semibold text-bg/50">Datos del depósito</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FieldLight label="Monto depositado (Q) *" type="number" min="1" step="0.01" value={form.amount} onChange={set('amount')} placeholder="0.00" required />
          <FieldLight as="select" label="Banco" value={form.bank_name} onChange={set('bank_name')}>
            <option value="">Seleccionar banco…</option>
            {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
          </FieldLight>
        </div>
        <FieldLight label="Número de referencia / No. de boleta" value={form.reference_number} onChange={set('reference_number')} placeholder="Ej. 202600123456" />
      </div>

      {/* Foto del comprobante */}
      <div>
        <p className="text-13 font-semibold text-bg/50 mb-3">Foto del comprobante</p>
        {form.receipt_image_url ? (
          <div className="flex items-center gap-4 p-4 rounded-[16px] glass-light-nested">
            <img src={form.receipt_image_url} alt="comprobante" className="h-20 w-20 object-cover rounded-[10px] border border-bg/10" />
            <div className="flex-1">
              <p className="text-14 text-bg font-bold">
                Comprobante cargado
              </p>
              <button type="button" onClick={() => setForm(p => ({ ...p, receipt_image_url: '' }))}
                className="text-13 font-semibold text-bg/50 hover:text-bg transition-colors mt-1">
                Cambiar foto
              </button>
            </div>
          </div>
        ) : (
          <label className={`flex flex-col items-center justify-center gap-3 p-8 rounded-[16px] border-2 border-dashed border-bg/15 bg-bg/4 cursor-pointer transition-all ${uploading ? 'opacity-60' : 'hover:border-bg/30 hover:bg-bg/8'}`}>
            <div className="text-center">
              <p className="text-15 font-bold text-bg">{uploading ? 'Subiendo…' : 'Toca para subir la foto'}</p>
              <p className="text-12 text-bg/50 mt-0.5">JPG, PNG o PDF · máx. 10 MB</p>
            </div>
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={handlePhoto} disabled={uploading} />
          </label>
        )}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        type="submit"
        disabled={submitting || uploading || !form.receipt_image_url}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-pill bg-bg text-white font-bold text-15 disabled:opacity-40"
      >
        {submitting ? 'Enviando…' : 'Enviar comprobante'}
      </motion.button>
    </form>
  );
}
