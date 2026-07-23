import { useSearchParams } from 'react-router-dom';
import PageHero from '../../components/layout/PageHero';
import ReceiptUploadForm from '../../components/sections/ReceiptUploadForm';
import { Icon, Eyebrow } from '../../components/ui/Glass';
import Reveal from '../../components/ui/Reveal';
import Tilt from '../../components/ui/Tilt';
import BankDetails from '../../components/sections/BankDetails';

export default function ReceiptPage() {
  const [params] = useSearchParams();
  const eventId   = params.get('event_id') ? Number(params.get('event_id')) : null;
  const eventName = params.get('event') || null;
  // Monto total ya calculado (precio x asistentes) que RSVPModal manda --
  // solo un default editable, el usuario confirma/ajusta antes de enviar.
  const defaultAmount = params.get('amount') || '';

  return (
    <main className="min-h-screen bg-bg text-white">
      <PageHero
        eyebrow="Comprobante"
        title="Sube tu depósito."
        subtitle="Lo verificamos y confirmamos tu pago lo antes posible."
        photoSlot="hero_comprobante"
        photoFallback="/images/bg-ubicacion.jpg"
      />

      <section className="relative py-16 md:py-24">
        <div className="relative z-10 max-w-2xl mx-auto px-6">

          {eventName && (
            <Reveal className="mb-6 flex items-center gap-4 glass-light rounded-[20px] px-5 py-4">
              <span className="grid place-items-center w-11 h-11 rounded-full bg-bg/8 border border-bg/12 text-bg shrink-0">
                <Icon name="calendar" className="w-5 h-5" />
              </span>
              <div>
                <p className="text-12 font-bold text-bg/50">Pago para</p>
                <p className="text-15 font-bold text-bg mt-0.5">{eventName}</p>
              </div>
            </Reveal>
          )}

          {/* Datos bancarios */}
          <Reveal delay={0.05}>
            <Tilt max={3} glass="featured" className="mb-6 glass-light rounded-[24px] p-7">
              <Eyebrow on="light">Datos para depósito</Eyebrow>
              <div className="mt-4">
                <BankDetails on="light" />
              </div>
            </Tilt>
          </Reveal>

          {/* Formulario */}
          <Reveal delay={0.1}>
            <div className="glass-light rounded-[24px] p-7 md:p-9">
              <div className="flex items-start justify-between gap-4 mb-1">
                <Eyebrow on="light">Sube el comprobante</Eyebrow>
                <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg/6 border border-bg/12 text-11 font-semibold text-bg/60">
                  <Icon name="clock" className="w-3 h-3" />
                  Verificación en 24-48h
                </span>
              </div>
              <div className="mt-4">
                <ReceiptUploadForm
                  eventId={eventId}
                  purpose={eventId ? 'evento' : 'donacion'}
                  defaultAmount={defaultAmount}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
