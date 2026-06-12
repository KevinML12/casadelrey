import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Chip, { FilterChip } from '../../components/ui/Chip';
import { IconButton } from '../../components/ui/Button';

const STATUS = {
  pendiente:  { label: 'Pendiente',  color: 'default',  icon: 'schedule' },
  verificado: { label: 'Verificado', color: 'tertiary', icon: 'check_circle' },
  rechazado:  { label: 'Rechazado', color: 'error',    icon: 'cancel' },
};

const BANKS_ICONS = {
  'Banrural': 'account_balance', 'BAC Credomatic': 'account_balance',
  'G&T Continental': 'account_balance', 'Industrial': 'account_balance',
};

function RevertSection({ receipt, onDone, onClose }) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const revert = async () => {
    setLoading(true);
    try {
      await apiClient.put(`/admin/receipts/${receipt.ID}/revert`);
      toast.success('Comprobante revertido a pendiente');
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al revertir');
    } finally { setLoading(false); }
  };

  if (!confirm) return (
    <button onClick={() => setConfirm(true)}
      className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-outline-var text-label-l text-on-surf-var hover:bg-surf-dim transition-colors">
      <span className="ms" style={{ fontSize: 16 }}>undo</span>
      Revertir a pendiente
    </button>
  );

  return (
    <div className="rounded-2xl border border-outline-var bg-surf-low p-4 space-y-3 animate-fade-in">
      <p className="text-body-s text-on-surf font-semibold flex items-center gap-2">
        <span className="ms text-on-surf-var" style={{ fontSize: 18 }}>undo</span>
        ¿Revertir este comprobante a pendiente?
      </p>
      <p className="text-body-s text-on-surf-var">Volverá a aparecer en la cola de verificación y deberás revisarlo nuevamente.</p>
      <div className="flex gap-2">
        <button onClick={revert} disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-pri text-on-pri text-label-l font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
          <span className="ms" style={{ fontSize: 16 }}>undo</span>
          {loading ? 'Revirtiendo…' : 'Sí, revertir'}
        </button>
        <button onClick={() => setConfirm(false)}
          className="flex-1 h-10 rounded-xl border border-outline-var text-label-l text-on-surf-var hover:bg-surf-dim transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function VerifyModal({ receipt, onClose, onDone }) {
  const [status,   setStatus]   = useState('verificado');
  const [reason,   setReason]   = useState('');
  const [loading,  setLoading]  = useState(false);
  // Doble confirmación: solo se activa al intentar rechazar
  const [confirmStep, setConfirmStep] = useState(false);

  const handleAction = () => {
    // Si va a rechazar → pedir doble confirmación
    if (status === 'rechazado' && !confirmStep) {
      setConfirmStep(true);
      return;
    }
    submit();
  };

  const submit = async () => {
    setLoading(true);
    try {
      await apiClient.put(`/admin/receipts/${receipt.ID}/verify`, {
        status,
        rejection_reason: reason,
      });
      toast.success(status === 'verificado' ? '✅ Comprobante verificado' : '❌ Comprobante rechazado');
      onDone();
      onClose();
    } catch { toast.error('Error al verificar'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-surf rounded-2xl border border-outline-var shadow-elev-3 w-full max-w-lg animate-fade-in overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-var">
          <h3 className="text-title-l text-on-surf font-bold">Verificar comprobante</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surf-dim text-on-surf-var transition-colors">
            <span className="ms" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* Foto del comprobante */}
        {receipt.receipt_image_url && (
          <div className="px-6 pt-5">
            <a href={receipt.receipt_image_url} target="_blank" rel="noopener noreferrer">
              <img src={receipt.receipt_image_url} alt="comprobante"
                className="w-full max-h-64 object-contain rounded-xl border border-outline-var hover:opacity-90 transition-opacity" />
            </a>
            <p className="text-label-s text-on-surf-var mt-1.5 text-center">Toca la imagen para verla en tamaño completo</p>
          </div>
        )}

        {/* Datos */}
        <div className="px-6 py-4 space-y-2">
          {[
            { label: 'Pagador',    value: receipt.payer_name },
            { label: 'Teléfono',   value: receipt.payer_phone || '—' },
            { label: 'Monto',      value: `Q${Number(receipt.amount).toFixed(2)}` },
            { label: 'Banco',      value: receipt.bank_name || '—' },
            { label: 'Referencia', value: receipt.reference_number || '—' },
            { label: 'Propósito',  value: receipt.purpose || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-2 text-body-s">
              <span className="text-on-surf-var w-24 shrink-0">{label}</span>
              <span className="text-on-surf font-medium">{value}</span>
            </div>
          ))}
        </div>

        {/* Decisión */}
        <div className="px-6 pb-6 space-y-3 border-t border-outline-var pt-4">

          {/* Solo mostrar selección si el comprobante está pendiente */}
          {receipt.status === 'pendiente' && !confirmStep && (
            <>
              <div className="flex gap-3">
                {['verificado', 'rechazado'].map(s => (
                  <button key={s} onClick={() => { setStatus(s); setConfirmStep(false); }}
                    className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-label-l font-semibold transition-colors ${
                      status === s
                        ? s === 'verificado' ? 'bg-ter-con text-on-ter-con' : 'bg-err-con text-err'
                        : 'border border-outline-var text-on-surf-var hover:bg-surf-dim'
                    }`}>
                    <span className="ms" style={{ fontSize: 16 }}>{s === 'verificado' ? 'check_circle' : 'cancel'}</span>
                    {s === 'verificado' ? 'Aprobar' : 'Rechazar'}
                  </button>
                ))}
              </div>
              {status === 'rechazado' && (
                <textarea rows={2} value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="Razón del rechazo (opcional)…"
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-var bg-transparent text-body-s text-on-surf placeholder:text-on-surf-var focus:outline-none focus:border-pri resize-none" />
              )}
              <button onClick={handleAction} disabled={loading}
                className={`w-full flex items-center justify-center gap-2 h-11 rounded-xl text-label-l font-semibold transition-opacity disabled:opacity-50 ${
                  status === 'rechazado' ? 'bg-err text-ink hover:opacity-90' : 'bg-pri text-on-pri hover:opacity-90'
                }`}>
                <span className="ms" style={{ fontSize: 16 }}>save</span>
                {loading ? 'Guardando…' : status === 'rechazado' ? 'Rechazar comprobante' : 'Aprobar comprobante'}
              </button>
            </>
          )}

          {/* Doble confirmación de rechazo */}
          {confirmStep && (
            <div className="rounded-2xl border-2 border-err bg-err-con/20 p-4 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="ms text-err" style={{ fontSize: 22 }}>warning</span>
                <p className="text-body-s text-on-surf font-semibold">¿Confirmas el rechazo?</p>
              </div>
              <p className="text-body-s text-on-surf-var">
                Esta acción notifica al pagador que su comprobante fue rechazado.
                Puedes revertirla después si cometiste un error.
              </p>
              {reason && <p className="text-label-s text-err">Razón: {reason}</p>}
              <div className="flex gap-2">
                <button onClick={submit} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-err text-ink text-label-l font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
                  <span className="ms" style={{ fontSize: 16 }}>cancel</span>
                  {loading ? 'Rechazando…' : 'Sí, rechazar'}
                </button>
                <button onClick={() => setConfirmStep(false)}
                  className="flex-1 h-10 rounded-xl border border-outline-var text-label-l text-on-surf-var hover:bg-surf-dim transition-colors">
                  Volver
                </button>
              </div>
            </div>
          )}

          {/* Revertir — visible si ya fue procesado */}
          {receipt.status !== 'pendiente' && !confirmStep && (
            <RevertSection receipt={receipt} onDone={onDone} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminReceipts() {
  const [receipts, setReceipts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('');
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true);
    const params = filter ? `?status=${filter}` : '';
    apiClient.get(`/admin/receipts${params}`)
      .then(r => setReceipts(r.data?.data || r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const pending   = receipts.filter(r => r.status === 'pendiente').length;
  const counts    = { pendiente: 0, verificado: 0, rechazado: 0 };
  receipts.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {selected && <VerifyModal receipt={selected} onClose={() => setSelected(null)} onDone={load} />}

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sec-con flex items-center justify-center shrink-0">
            <span className="ms text-on-sec-con" style={{ fontSize: 22 }}>receipt_long</span>
          </div>
          <div>
            <h1 className="text-headline-s text-on-surf font-black">Comprobantes</h1>
            <p className="text-body-s text-on-surf-var mt-0.5">
              {pending > 0
                ? <><span className="text-pri font-semibold">{pending}</span> pendiente{pending > 1 ? 's' : ''} de verificar</>
                : 'Todos verificados'}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <FilterChip selected={filter === ''} icon="apps" onClick={() => setFilter('')}>Todos</FilterChip>
        <FilterChip selected={filter === 'pendiente'}  icon="schedule"     count={counts.pendiente}  onClick={() => setFilter('pendiente')}>Pendientes</FilterChip>
        <FilterChip selected={filter === 'verificado'} icon="check_circle" count={counts.verificado} onClick={() => setFilter('verificado')}>Verificados</FilterChip>
        <FilterChip selected={filter === 'rechazado'}  icon="cancel"       count={counts.rechazado}  onClick={() => setFilter('rechazado')}>Rechazados</FilterChip>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
        </div>
      ) : receipts.length === 0 ? (
        <div className="bg-surf-low border border-outline-var rounded-2xl flex flex-col items-center py-20 gap-4 text-on-surf-var">
          <span className="ms" style={{ fontSize: 48 }}>receipt_long</span>
          <p className="text-body-l text-on-surf font-medium">Sin comprobantes</p>
          <p className="text-body-s">Los comprobantes enviados por los usuarios aparecerán aquí.</p>
        </div>
      ) : (
        <div className="bg-surf-low border border-outline-var rounded-2xl overflow-hidden divide-y divide-outline-var">
          {receipts.map(r => {
            const st = STATUS[r.status] || STATUS.pendiente;
            return (
              <div key={r.ID} className="flex items-start gap-4 p-5 hover:bg-surf-high transition-colors">

                {/* Miniatura */}
                {r.receipt_image_url ? (
                  <img src={r.receipt_image_url} alt="comprobante"
                    className="w-14 h-14 rounded-xl object-cover border border-outline-var shrink-0 cursor-pointer"
                    onClick={() => setSelected(r)} />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-surf-high flex items-center justify-center shrink-0">
                    <span className="ms text-on-surf-var" style={{ fontSize: 24 }}>receipt_long</span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-body-l text-on-surf font-medium">{r.payer_name}</span>
                    <Chip color={st.color} icon={st.icon}>{st.label}</Chip>
                    <span className="text-label-l text-on-surf font-bold">Q{Number(r.amount).toFixed(2)}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-body-s text-on-surf-var">
                    {r.bank_name && <span className="flex items-center gap-1"><span className="ms" style={{ fontSize: 13 }}>account_balance</span>{r.bank_name}</span>}
                    {r.reference_number && <span className="flex items-center gap-1"><span className="ms" style={{ fontSize: 13 }}>tag</span>{r.reference_number}</span>}
                    {r.payer_phone && <span className="flex items-center gap-1"><span className="ms" style={{ fontSize: 13 }}>phone</span>{r.payer_phone}</span>}
                    {r.purpose && <span className="flex items-center gap-1"><span className="ms" style={{ fontSize: 13 }}>info</span>{r.purpose}</span>}
                  </div>
                  {r.rejection_reason && (
                    <p className="text-label-s text-err mt-1.5">Rechazo: {r.rejection_reason}</p>
                  )}
                </div>

                {/* Fecha + acción */}
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-label-s text-on-surf-var hidden sm:block">
                    {r.CreatedAt ? new Date(r.CreatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '—'}
                  </p>
                  {r.status === 'pendiente' && (
                    <button onClick={() => setSelected(r)}
                      className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-pri text-on-pri text-label-m font-semibold hover:opacity-90 transition-opacity">
                      <span className="ms" style={{ fontSize: 14 }}>verified</span>
                      Verificar
                    </button>
                  )}
                  {r.status !== 'pendiente' && (
                    <IconButton onClick={() => setSelected(r)} title="Ver detalle" className="text-on-surf-var hover:text-on-surf">
                      <span className="ms" style={{ fontSize: 16 }}>visibility</span>
                    </IconButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
