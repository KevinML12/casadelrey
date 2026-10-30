import { useCallback, useEffect, useState } from "react";
import apiClient from "../../lib/apiClient";
import Paginator from "../../components/ui/Paginator";
import ModalWrapper from "../../components/ui/ModalWrapper";
import { useDonationPurposes } from "../../lib/donationPurposes";

export default function AdminDonations() {
  const purposes = useDonationPurposes();
  const [donations, setDonations] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [purpose, setPurpose] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page, limit: 20 });
    if (purpose) params.set("purpose", purpose);
    if (status) params.set("status", status);
    if (debounced) params.set("q", debounced);
    try {
      const { data } = await apiClient.get(`/admin/donations?${params}`);
      setDonations(data.data || []);
      setMeta(data.meta || null);
    } catch {
      setError("No se pudieron consultar las donaciones.");
    } finally {
      setLoading(false);
    }
  }, [page, purpose, status, debounced]);
  useEffect(() => {
    load();
  }, [load]);
  const confirm = async () => {
    setSaving(true);
    setError("");
    try {
      await apiClient.put(`/admin/donations/${selected.ID}/cash`, {
        received: !selected.is_successful,
      });
      setSelected(null);
      await load();
    } catch (err) {
      setError(
        err.response?.data?.error || "No se pudo registrar la recepción.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="max-w-5xl mx-auto space-y-5 text-bg">
      <div>
        <h1 className="text-28 font-bold">Donaciones</h1>
        <p className="mt-2 text-14 text-bg/70">
          Intenciones y aportes recibidos. Sólo los recibidos se suman a lo
          recaudado.
        </p>
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-[12px] border border-rose/30 bg-white/70 p-4"
        >
          <p>{error}</p>
          <button
            onClick={load}
            className="min-h-11 mt-2 px-4 rounded-[10px] bg-bg text-white text-14 font-semibold focus-ring"
          >
            Reintentar
          </button>
        </div>
      )}
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="text-13 font-semibold">
          Buscar
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Nombre o correo"
            className="input-light mt-2"
          />
        </label>
        <label className="text-13 font-semibold">
          Destino
          <select
            value={purpose}
            onChange={(e) => {
              setPurpose(e.target.value);
              setPage(1);
            }}
            className="input-light mt-2"
          >
            <option value="">Todos</option>
            {purposes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-13 font-semibold">
          Estado
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="input-light mt-2"
          >
            <option value="">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="received">Recibidos</option>
          </select>
        </label>
      </div>
      <section
        aria-label="Listado de donaciones"
        className="glass-light rounded-[16px] divide-y divide-bg/15 overflow-hidden"
      >
        {loading ? (
          <p role="status" className="p-5 text-14">
            Cargando donaciones…
          </p>
        ) : !donations.length ? (
          <p className="p-5 text-14">
            No hay donaciones que coincidan con estos filtros.
          </p>
        ) : (
          donations.map((d) => (
            <article
              key={d.ID}
              className="p-5 flex flex-col sm:flex-row justify-between gap-4"
            >
              <div className="min-w-0">
                <h2 className="text-16 font-bold break-words">{d.name}</h2>
                {d.email && (
                  <p className="mt-1 text-13 text-bg/65 break-all">{d.email}</p>
                )}
                <p className="mt-3 text-14">
                  {purposes.find((item) => item.value === d.donation_purpose)
                    ?.title ||
                    d.donation_purpose ||
                    "Sin destino registrado"}{" "}
                  ·{" "}
                  {d.payment_method === "presencial"
                    ? "En persona"
                    : "Transferencia"}
                </p>
                <p className="mt-2 text-12 text-bg/65">
                  Registro {d.ID} ·{" "}
                  {new Date(d.CreatedAt).toLocaleDateString("es-GT")}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-22 font-bold">
                  Q{Number(d.amount).toFixed(2)}
                </p>
                <p className="mt-1 text-13 font-semibold">
                  {d.is_successful ? "Recibido" : "Pendiente"}
                </p>
                {d.payment_method === "presencial" ? (
                  <button
                    onClick={() => setSelected(d)}
                    className="mt-3 min-h-11 rounded-[10px] px-4 bg-bg text-white font-semibold text-13 focus-ring"
                  >
                    {d.is_successful
                      ? "Volver a pendiente"
                      : "Confirmar recepción"}
                  </button>
                ) : (
                  <a
                    href="/admin/receipts"
                    className="mt-3 inline-flex min-h-11 items-center text-13 font-semibold underline underline-offset-4 focus-ring"
                  >
                    Revisar comprobante
                  </a>
                )}
              </div>
            </article>
          ))
        )}
      </section>
      <Paginator meta={meta} onPage={setPage} />
      {selected && (
        <ModalWrapper
          onClose={() => {
            if (!saving) setSelected(null);
          }}
          ariaLabel="Recepción de donación"
        >
          <h2 className="text-24 font-bold">
            {selected.is_successful
              ? "Volver a pendiente"
              : "Confirmar aporte recibido"}
          </h2>
          <p className="mt-4 text-15">
            {selected.name} · Q{Number(selected.amount).toFixed(2)}
          </p>
          <p className="mt-3 text-14 text-bg/75">
            {selected.is_successful
              ? "El importe dejará de sumarse a lo recaudado. Se preparará una notificación si hay un correo registrado."
              : "Confirma únicamente cuando el equipo haya recibido el aporte en persona. Se actualizará lo recaudado y se preparará una confirmación si hay correo registrado."}
          </p>
          <button
            disabled={saving}
            onClick={confirm}
            className="mt-6 w-full min-h-12 rounded-[12px] bg-bg text-white font-semibold focus-ring disabled:opacity-50"
          >
            {saving
              ? "Guardando…"
              : selected.is_successful
                ? "Confirmar cambio a pendiente"
                : "Sí, el aporte fue recibido"}
          </button>
        </ModalWrapper>
      )}
    </div>
  );
}
