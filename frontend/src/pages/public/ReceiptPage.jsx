import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ReceiptUploadForm from "../../components/sections/ReceiptUploadForm";
import BankDetails from "../../components/sections/BankDetails";
import SectionBg from "../../components/ui/SectionBg";
import { useApiResource, useSitePhoto } from "../../lib/feed";
import apiClient from "../../lib/apiClient";

export default function ReceiptPage() {
  const [params] = useSearchParams();
  const eventID = Number(params.get("event_id")) || null;
  const receiptID = Number(params.get("receipt")) || null;
  const [token] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get("token") || "",
  );
  const [replacement, setReplacement] = useState(null);
  const [loading, setLoading] = useState(!!receiptID);
  const [error, setError] = useState("");
  const events = useApiResource("/events");
  const event = events.data?.find?.(
    (item) => Number(item.ID ?? item.id) === eventID,
  );
  const background = useSitePhoto(
    "hero_comprobante",
    useSitePhoto("hero_donar", "/images/public_bg_donaciones.jpg"),
  );
  useEffect(() => {
    if (window.location.hash.includes("token="))
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search,
      );
    if (!receiptID) return;
    const controller = new AbortController();
    if (!token) {
      setError(
        "Abre nuevamente el enlace de corrección que recibiste por correo.",
      );
      setLoading(false);
      return;
    }
    apiClient
      .post(
        `/receipts/${receiptID}/replacement`,
        { token },
        { signal: controller.signal },
      )
      .then(({ data }) => setReplacement(data))
      .catch((err) => {
        if (!controller.signal.aborted)
          setError(
            err.response?.data?.error ||
              "No se pudo validar el enlace. Vuelve a abrirlo desde tu correo.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [receiptID, token]);
  const requested = Number(params.get("amount"));
  const amount =
    replacement?.amount ??
    (Number.isFinite(requested) && requested > 0
      ? Math.max(requested, Number(event?.price_gtq) || 0)
      : event?.price_gtq || "");
  const unavailable =
    eventID &&
    !events.loading &&
    (!event || !event.requires_payment || event.is_full);
  return (
    <main className="relative min-h-[100svh] text-white pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
      <SectionBg
        src={event?.cover_image || background}
        scrimClassName="bg-bg/45"
      />
      <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)] gap-8 lg:gap-16 items-start">
        <div className="lg:sticky lg:top-32">
          <p className="text-13 font-semibold text-white/80">
            Eventos y donaciones
          </p>
          <h1 className="text-36 sm:text-48 font-bold tracking-tight mt-3">
            {receiptID
              ? "Corrige tu comprobante."
              : "Tu depósito, con claridad."}
          </h1>
          <p className="mt-5 max-w-md text-16 text-white/85 leading-relaxed">
            {event?.title ||
              "Envía el comprobante de tu depósito para que el equipo pueda revisarlo."}
          </p>
          <p className="mt-4 max-w-md text-14 text-white/75">
            El archivo es privado. El pago permanece pendiente hasta que
            administración verifique el depósito.
          </p>
          {!receiptID && (
            <details className="mt-6 rounded-[14px] border border-white/35 bg-bg/20 p-4">
              <summary className="cursor-pointer min-h-11 font-semibold text-14 focus-ring">
                Ver datos para depositar
              </summary>
              <div className="pt-4">
                <BankDetails />
              </div>
            </details>
          )}
        </div>
        <section
          aria-label={
            receiptID ? "Corrección de comprobante" : "Envío de comprobante"
          }
          className="glass-light rounded-[16px] p-5 sm:p-8 text-bg min-w-0"
        >
          <h2 className="text-24 font-bold mb-5">
            {receiptID ? "Volver a revisión" : "Sube tu comprobante"}
          </h2>
          {loading || (!receiptID && eventID && events.loading) ? (
            <p role="status">Cargando los datos del pago…</p>
          ) : error ? (
            <p role="alert" className="text-15 leading-relaxed">
              {error}
            </p>
          ) : eventID && events.error ? (
            <div role="alert">
              <p>No se pudieron cargar los datos del evento.</p>
              <button
                onClick={events.retry}
                className="min-h-11 mt-3 px-4 rounded-[10px] bg-bg text-white font-semibold focus-ring"
              >
                Reintentar
              </button>
            </div>
          ) : unavailable ? (
            <p role="alert">
              Este evento no acepta comprobantes desde este enlace. Consulta el
              evento o contacta al equipo.
            </p>
          ) : (
            <>
              {replacement?.rejection_reason && (
                <p className="mb-5 p-3 rounded-[12px] border border-bg/20 text-14">
                  <strong>Motivo de revisión:</strong>{" "}
                  {replacement.rejection_reason}
                </p>
              )}
              <ReceiptUploadForm
                key={`${receiptID || eventID || "donation"}:${replacement ? "ready" : "new"}`}
                eventId={eventID}
                purpose={
                  replacement?.purpose || (eventID ? "evento" : "donacion")
                }
                defaultAmount={amount}
                defaultName={replacement?.payer_name || ""}
                defaultEmail={replacement?.payer_email || ""}
                correction={replacement ? { id: receiptID, token } : null}
              />
              {eventID && (
                <a
                  href={`/events?id=${eventID}`}
                  className="mt-5 inline-flex min-h-11 items-center text-14 font-semibold underline underline-offset-4 focus-ring"
                >
                  Volver al evento y completar la inscripción
                </a>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
