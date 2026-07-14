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
            <Reveal className="mb-6 flex items-center gap-4 liquid-glass rounded-[20px] px-5 py-4">
              <span className="grid place-items-center w-11 h-11 rounded-full bg-white/10 border border-white/15 text-white shrink-0">
                <Icon name="calendar" className="w-5 h-5" />
              </span>
              <div>
                <p className="text-[12px] font-bold text-white/50">Pago para</p>
                <p className="text-[15px] font-bold text-white mt-0.5">{eventName}</p>
              </div>
            </Reveal>
          )}

          {/* Datos bancarios */}
          <Reveal delay={0.05}>
            <Tilt max={3} glass="featured" className="mb-6 liquid-glass rounded-[24px] p-7">
              <Eyebrow>Datos para depósito</Eyebrow>
              <div className="mt-4">
                <BankDetails />
              </div>
            </Tilt>
          </Reveal>

          {/* Formulario */}
          <Reveal delay={0.1}>
            <div className="liquid-glass rounded-[24px] p-7 md:p-9">
              <Eyebrow>Sube el comprobante</Eyebrow>
              <div className="mt-4">
                <ReceiptUploadForm
                  eventId={eventId}
                  purpose={eventId ? 'evento' : 'donacion'}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
