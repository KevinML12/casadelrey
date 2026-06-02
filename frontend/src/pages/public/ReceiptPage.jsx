import { useSearchParams } from 'react-router-dom';
import PageHero from '../../components/layout/PageHero';
import ReceiptUploadForm from '../../components/sections/ReceiptUploadForm';

export default function ReceiptPage() {
  const [params] = useSearchParams();
  const eventId   = params.get('event_id') ? Number(params.get('event_id')) : null;
  const eventName = params.get('event') || null;

  return (
    <main className="min-h-screen bg-surf">
      <PageHero icon="receipt_long" title="Enviar Comprobante" subtitle="Sube la foto de tu depósito o transferencia bancaria para que el equipo lo verifique." />

      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="max-w-xl mx-auto">

          {/* Contexto del evento si viene de ahí */}
          {eventName && (
            <div className="mb-6 px-4 py-3 rounded-2xl bg-pri-con flex items-center gap-3">
              <span className="ms text-on-pri-con shrink-0" style={{ fontSize: 20 }}>calendar_month</span>
              <div>
                <p className="text-label-s text-on-pri-con uppercase tracking-widest">Pago para</p>
                <p className="text-body-s text-on-pri-con font-semibold">{eventName}</p>
              </div>
            </div>
          )}

          {/* Info bancaria */}
          <div className="mb-8 p-5 rounded-2xl bg-surf-low border border-outline-var space-y-3">
            <p className="text-label-l text-pri font-semibold uppercase tracking-widest">Datos para depósito</p>
            {[
              { label: 'Banco',   value: 'Banrural' },
              { label: 'Cuenta',  value: '3061234567890' },
              { label: 'A nombre de', value: 'Iglesia Casa del Rey' },
              { label: 'Tigo Money', value: '+502 4760-0636' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-label-m text-on-surf-var w-28 shrink-0">{label}</span>
                <span className="text-body-s text-on-surf font-semibold">{value}</span>
              </div>
            ))}
          </div>

          {/* Formulario */}
          <div className="bg-surf border border-outline-var rounded-2xl p-6 md:p-8">
            <ReceiptUploadForm
              eventId={eventId}
              purpose={eventId ? 'evento' : 'donacion'}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
