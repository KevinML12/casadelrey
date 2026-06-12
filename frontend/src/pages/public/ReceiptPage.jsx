import { useSearchParams } from 'react-router-dom';
import PageHero from '../../components/layout/PageHero';
import ReceiptUploadForm from '../../components/sections/ReceiptUploadForm';
import { Icon, Halos } from '../../components/ui/Glass';

const BANK_INFO = [
  { label: 'Banco',       value: 'Banrural' },
  { label: 'Cuenta',      value: '3061234567890' },
  { label: 'A nombre de', value: 'Iglesia Casa del Rey' },
  { label: 'Tigo Money',  value: '+502 4760-0636' },
];

export default function ReceiptPage() {
  const [params] = useSearchParams();
  const eventId   = params.get('event_id') ? Number(params.get('event_id')) : null;
  const eventName = params.get('event') || null;

  return (
    <main className="min-h-screen bg-bg text-ink">
      <PageHero
        icon="receipt_long"
        eyebrow="Comprobante"
        title="Sube tu depósito."
        subtitle="Lo verificamos y confirmamos tu pago lo antes posible."
      />

      <section className="relative py-16 md:py-24 overflow-hidden">
        <Halos variant="soft" />
        <div className="relative z-10 max-w-2xl mx-auto px-6">

          {eventName && (
            <div className="mb-6 flex items-center gap-3 bg-bg border border-ink-soft shadow-card rounded-card px-5 py-4">
              <span className="grid place-items-center w-11 h-11 rounded-sm bg-bg-soft text-celeste shrink-0">
                <Icon name="calendar" className="w-5 h-5" />
              </span>
              <div>
                <p className="text-[10.5px] font-extrabold uppercase tracking-widest text-celeste">Pago para</p>
                <p className="text-[15px] font-extrabold tracking-tightish text-ink mt-0.5">{eventName}</p>
              </div>
            </div>
          )}

          {/* Datos bancarios */}
          <div className="mb-8 bg-bg border border-ink-soft shadow-card-lg rounded-card p-7 relative overflow-hidden">
            <div className="absolute inset-0 -z-10 pointer-events-none">
              <div className="halo" style={{ width: 280, height: 280, top: -100, right: -60, background: 'rgba(124,212,255,0.16)' }} />
            </div>
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-10 bg-gradient-to-r from-electric to-transparent" />
              <span className="text-celeste text-[11px] font-extrabold uppercase tracking-widest">Datos para depósito</span>
            </div>

            <div className="space-y-2.5">
              {BANK_INFO.map(({ label, value }) => (
                <div key={label} className="flex items-center gap-3 rounded-md bg-bg-soft border border-ink-soft px-4 py-3">
                  <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-ink-3 w-28 shrink-0">{label}</span>
                  <span className="text-[14.5px] font-extrabold tracking-tightish text-ink">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Formulario */}
          <div className="bg-bg border border-ink-soft shadow-card-lg rounded-card p-7 md:p-9">
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-10 bg-gradient-to-r from-electric to-transparent" />
              <span className="text-celeste text-[11px] font-extrabold uppercase tracking-widest">Sube el comprobante</span>
            </div>
            <ReceiptUploadForm
              eventId={eventId}
              purpose={eventId ? 'evento' : 'donacion'}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
