import { useCallback, useEffect, useState } from "react";
import apiClient from "../../lib/apiClient";
const ERRORS = {
  provider_400: "El proveedor rechazó los datos del envío.",
  provider_401: "Hace falta revisar la conexión con Brevo.",
  provider_403: "El remitente o el acceso requieren revisión.",
  provider_422: "Hace falta revisar los datos del envío.",
  provider_429:
    "Se alcanzó un límite de envío. El mensaje espera un reintento.",
  provider_duplicate:
    "Brevo reconoce este envío como un duplicado. Comprueba su historial antes de reenviar.",
  delivery_unknown: "No se pudo confirmar si el proveedor aceptó este envío.",
  retry_window_expired: "El estado requiere revisión antes de reenviar.",
  payload_unreadable:
    "El mensaje debe regenerarse con ayuda del responsable técnico.",
};
const LABELS = {
  pending: "En cola",
  processing: "Enviando",
  accepted: "Aceptado por Brevo",
  failed: "Falló",
  uncertain: "Revisar en Brevo",
  expired: "Caducado",
};
export default function AdminEmails() {
  const [status, setStatus] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [health, list] = await Promise.all([
        apiClient.get("/admin/email/status"),
        apiClient.get(`/admin/email/messages?page=${page}&limit=15`),
      ]);
      setStatus(health.data);
      setMessages(list.data.data || []);
      setTotal(list.data.meta?.total || 0);
    } catch {
      setError("No se pudo consultar el servicio de correo.");
    } finally {
      setLoading(false);
    }
  }, [page]);
  useEffect(() => {
    load();
  }, [load]);
  const retry = async (id) => {
    setBusy(id);
    try {
      await apiClient.post(`/admin/email/messages/${id}/retry`);
      await load();
    } catch (err) {
      setError(
        err.response?.data?.error || "No se pudo preparar el reintento.",
      );
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-28 font-bold text-bg">Correos</h1>
          <p className="mt-2 text-14 text-bg/70">
            Confirmaciones de eventos, donaciones y acciones de cuenta.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="min-h-11 rounded-[12px] px-5 bg-bg text-white font-semibold text-14 focus-ring"
        >
          {loading ? "Actualizando…" : "Actualizar"}
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-[12px] bg-white/80 border border-rose/40 p-4 text-bg"
        >
          {error}
        </p>
      )}
      {status && (
        <section className="glass-light rounded-[16px] p-5 text-bg">
          <h2 className="text-18 font-bold">
            {status.configured
              ? "Configuración de correo lista"
              : "Falta conectar Brevo"}
          </h2>
          <p className="mt-2 text-14 leading-relaxed text-bg/75">
            {status.configured
              ? "El servidor conserva los envíos en cola y procesa los reintentos seguros."
              : "Los mensajes permanecen guardados. Configura la clave API, un remitente verificado y el frontend definitivo en Render para empezar a enviar."}
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-13">
            <span>
              Clave: {status.api_key_configured ? "configurada" : "pendiente"}
            </span>
            <span>
              Remitente:{" "}
              {status.sender_configured ? "configurado" : "pendiente"}
            </span>
            <span>
              Frontend:{" "}
              {status.frontend_configured ? "configurado" : "pendiente"}
            </span>
          </div>
          <p className="mt-4 text-12 text-bg/65">
            Límite preventivo del sitio: {status.local_limit_24h} envíos en 24
            horas. «Aceptado por Brevo» indica recepción por el proveedor; no
            confirma llegada a la bandeja de entrada.
          </p>
        </section>
      )}
      <section
        aria-label="Historial de correos"
        className="glass-light rounded-[16px] overflow-hidden text-bg"
      >
        <div className="divide-y divide-bg/15">
          {loading && !messages.length ? (
            <p role="status" className="p-5">
              Cargando correos…
            </p>
          ) : !messages.length ? (
            <p className="p-5 text-14">
              Todavía no hay correos en este historial.
            </p>
          ) : (
            messages.map((item) => (
              <article
                key={item.id}
                className="p-5 flex flex-col sm:flex-row justify-between gap-4"
              >
                <div className="min-w-0">
                  <h2 className="font-semibold text-15 break-words">
                    {item.subject}
                  </h2>
                  <p className="mt-1 text-13 text-bg/65 break-all">
                    {item.recipient} ·{" "}
                    {new Date(item.created_at).toLocaleString("es-GT")}
                  </p>
                  <p className="mt-2 text-13 font-semibold">
                    {LABELS[item.status] || item.status} · Intentos:{" "}
                    {item.attempts}
                  </p>
                  {item.last_error && (
                    <p className="mt-1 text-12 text-bg/65">
                      {ERRORS[item.last_error] ||
                        "El responsable técnico debe revisar este envío."}
                    </p>
                  )}
                  {item.status === "uncertain" && (
                    <p className="mt-2 text-13 text-bg/75">
                      Comprueba el registro en Brevo antes de reenviar para
                      evitar duplicados.
                    </p>
                  )}
                </div>
                {item.status === "failed" &&
                  /^provider_(400|401|403|422|429)$/.test(item.last_error) && (
                    <button
                      disabled={!status?.configured || busy === item.id}
                      onClick={() => retry(item.id)}
                      className="self-start min-h-11 rounded-[10px] px-4 border border-bg/30 font-semibold text-13 disabled:opacity-45 focus-ring"
                    >
                      {busy === item.id ? "Preparando…" : "Reintentar"}
                    </button>
                  )}
              </article>
            ))
          )}
        </div>
      </section>
      {total > 15 && (
        <nav
          aria-label="Páginas de correos"
          className="flex items-center justify-between gap-4 text-14 text-bg"
        >
          <button
            disabled={page === 1}
            onClick={() => setPage((n) => n - 1)}
            className="min-h-11 px-4 rounded-[10px] border border-bg/30 disabled:opacity-40 focus-ring"
          >
            Anterior
          </button>
          <span>Página {page}</span>
          <button
            disabled={page * 15 >= total}
            onClick={() => setPage((n) => n + 1)}
            className="min-h-11 px-4 rounded-[10px] border border-bg/30 disabled:opacity-40 focus-ring"
          >
            Siguiente
          </button>
        </nav>
      )}
    </div>
  );
}
